"use client";

import { useEffect, useMemo, useState } from "react";
import CallDetailPanel from "../../../components/calls/CallDetailPanel";
import CallList from "../../../components/calls/CallList";
import type { Call, CallResult } from "../../../types";
import { listCalls, registerCallResult } from "../../../services/llamadas.service";
import { addAuditLog } from "../../../services/auditoria.service";

export default function LlamadasPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [resultValue, setResultValue] = useState<CallResult | "all">("all");
  const [orderValue, setOrderValue] = useState<
    "started_desc" | "started_asc" | "lead_asc" | "lead_desc" | "duration_desc"
  >("started_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      const data = await listCalls();
      setCalls(data);
      if (data.length > 0) {
        setSelectedCallId(data[0].id);
      }
    };
    load();
  }, []);

  const selectedCall = useMemo(
    () => calls.find((call) => call.id === selectedCallId) ?? null,
    [calls, selectedCallId]
  );

  const processedCalls = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const filtered = calls.filter((call) => {
      const searchMatch =
        !normalizedSearch ||
        call.leadName.toLowerCase().includes(normalizedSearch) ||
        call.leadPhone.toLowerCase().includes(normalizedSearch) ||
        call.agentName.toLowerCase().includes(normalizedSearch);
      const resultMatch = resultValue === "all" || call.result === resultValue;
      return searchMatch && resultMatch;
    });

    filtered.sort((a, b) => {
      if (orderValue === "started_asc") {
        return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      }

      if (orderValue === "lead_asc") {
        return a.leadName.localeCompare(b.leadName, "es");
      }

      if (orderValue === "lead_desc") {
        return b.leadName.localeCompare(a.leadName, "es");
      }

      if (orderValue === "duration_desc") {
        return b.durationMinutes - a.durationMinutes;
      }

      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    return filtered;
  }, [calls, searchValue, resultValue, orderValue]);

  const totalPages = Math.max(1, Math.ceil(processedCalls.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCalls = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return processedCalls.slice(start, start + PAGE_SIZE);
  }, [processedCalls, safeCurrentPage]);

  const handleRegisterResult = async (result: CallResult, notes: string) => {
    if (!selectedCall) return;
    const updated = await registerCallResult(selectedCall.id, result, notes);
    setCalls((prev) => prev.map((call) => (call.id === updated.id ? updated : call)));
    await addAuditLog(
      "call_result_registered",
      "call",
      updated.id,
      `Resultado registrado: ${result}`,
      "Agente"
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Llamadas</h1>
        <p className="text-sm text-botanical-600">
          Registro de llamadas y formulario post-llamada (simulado).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
            Historial reciente
          </p>
          <input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por lead, teléfono o agente"
            className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800 placeholder:text-botanical-400"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={resultValue}
              onChange={(event) => {
                setResultValue(event.target.value as typeof resultValue);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
            >
              <option value="all">Todos los resultados</option>
              <option value="venta">Venta</option>
              <option value="interesado">Interesado</option>
              <option value="no_interesado">No interesado</option>
              <option value="no_contesta">No contesta</option>
              <option value="cortada">Cortada</option>
              <option value="numero_incorrecto">Número incorrecto</option>
            </select>
            <select
              value={orderValue}
              onChange={(event) => {
                setOrderValue(event.target.value as typeof orderValue);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
            >
              <option value="started_desc">Más recientes</option>
              <option value="started_asc">Más antiguas</option>
              <option value="lead_asc">Lead A-Z</option>
              <option value="lead_desc">Lead Z-A</option>
              <option value="duration_desc">Mayor duración</option>
            </select>
          </div>

          <CallList
            calls={paginatedCalls}
            selectedId={selectedCallId}
            onSelect={setSelectedCallId}
          />
          {totalPages > 1 ? (
            <div className="mt-1 flex items-center justify-between text-xs text-botanical-700">
              <span>
                Página {safeCurrentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <CallDetailPanel call={selectedCall} onRegisterResult={handleRegisterResult} />
      </div>
    </div>
  );
}
