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
          <CallList calls={calls} selectedId={selectedCallId} onSelect={setSelectedCallId} />
        </div>
        <CallDetailPanel call={selectedCall} onRegisterResult={handleRegisterResult} />
      </div>
    </div>
  );
}
