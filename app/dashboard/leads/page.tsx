"use client";

import { useEffect, useMemo, useState } from "react";
import LeadDetailPanel from "../../../components/leads/LeadDetailPanel";
import LeadFilters from "../../../components/leads/LeadFilters";
import LeadTable from "../../../components/leads/LeadTable";
import type { Lead, LeadStatus, LeadStatusHistory } from "../../../types";
import {
  closeLead,
  getLeadHistory,
  listLeads,
  updateLeadStatus,
} from "../../../services/leads/leads.service";
import { getSlaCloseAutomationConfig } from "../../../services/configuracion.service";
import { listCallsByLead } from "../../../services/llamadas.service";
import { addAuditLog } from "../../../services/auditoria.service";
import { createTask } from "../../../services/tasks/tasks.service";

const callNotes = [
  "Llamada efectiva. Cliente interesado.",
  "No contestó. Reagendar seguimiento.",
  "Cliente solicita más información.",
  "Número incorrecto.",
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [referenceNowMs, setReferenceNowMs] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState<LeadStatus | "all">("all");
  const [countryValue, setCountryValue] = useState<string | "all">("all");
  const [orderValue, setOrderValue] = useState<
    "created_desc" | "created_asc" | "name_asc" | "name_desc" | "sla_urgent"
  >("created_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastCallNote, setLastCallNote] = useState<string | null>(null);
  const [history, setHistory] = useState<LeadStatusHistory[]>([]);
  const [slaDays, setSlaDays] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      const [data, slaConfig] = await Promise.all([listLeads(), getSlaCloseAutomationConfig()]);
      setLeads(data);
      setSlaDays(slaConfig.days);
      if (data.length > 0) {
        setSelectedLeadId(data[0].id);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedLeadId) return;
      const data = await getLeadHistory(selectedLeadId);
      setHistory(data);
      setReferenceNowMs(Date.now());
    };
    loadHistory();
  }, [selectedLeadId]);

  const countries = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.pais))).sort(),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchMatch =
        lead.nombre?.toLowerCase().includes(searchValue.toLowerCase()) ||
        lead.telefono.toLowerCase().includes(searchValue.toLowerCase());
      const statusMatch = statusValue === "all" || lead.estadoActual === statusValue;
      const countryMatch = countryValue === "all" || lead.pais === countryValue;
      return searchMatch && statusMatch && countryMatch;
    });
  }, [leads, searchValue, statusValue, countryValue]);

  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads];
    sorted.sort((a, b) => {
      if (orderValue === "created_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (orderValue === "name_asc") {
        return (a.nombre ?? "").localeCompare(b.nombre ?? "", "es");
      }

      if (orderValue === "name_desc") {
        return (b.nombre ?? "").localeCompare(a.nombre ?? "", "es");
      }

      if (orderValue === "sla_urgent") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted;
  }, [filteredLeads, orderValue]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLeads = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return sortedLeads.slice(start, start + PAGE_SIZE);
  }, [sortedLeads, safeCurrentPage]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const activeLeads = useMemo(
    () =>
      leads.filter(
        (lead) => lead.estadoActual !== "venta" && lead.estadoActual !== "cerrado_tiempo"
      ),
    [leads]
  );

  const slaBreachedCount = useMemo(
    () =>
      activeLeads.filter((lead) => {
        const ageDays =
          (referenceNowMs - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays > slaDays;
      }).length,
    [activeLeads, referenceNowMs, slaDays]
  );

  const slaDueSoonCount = useMemo(
    () =>
      activeLeads.filter((lead) => {
        const ageDays =
          (referenceNowMs - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays >= slaDays - 1 && ageDays <= slaDays;
      }).length,
    [activeLeads, referenceNowMs, slaDays]
  );

  const handleStatusChange = async (status: LeadStatus) => {
    if (!selectedLead) return;
    setErrorMessage(null);

    if (status === "venta") {
      const calls = await listCallsByLead(selectedLead.id);
      if (calls.length === 0) {
        setErrorMessage("No se puede cerrar sin llamada registrada.");
        return;
      }
    }
    const updated = await updateLeadStatus(selectedLead.id, status);
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
    const updatedHistory = await getLeadHistory(updated.id);
    setHistory(updatedHistory);
    await addAuditLog(
      "lead_status_change",
      "lead",
      updated.id,
      `Estado actualizado a ${status}`,
      "Agente"
    );
  };

  const handleCloseLead = async () => {
    if (!selectedLead) return;
    setErrorMessage(null);
    const calls = await listCallsByLead(selectedLead.id);
    if (calls.length === 0) {
      setErrorMessage("No se puede cerrar sin llamada registrada.");
      return;
    }
    const updated = await closeLead(selectedLead.id);
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
    const updatedHistory = await getLeadHistory(updated.id);
    setHistory(updatedHistory);
    await addAuditLog(
      "lead_status_change",
      "lead",
      updated.id,
      "Lead cerrado como venta efectiva",
      "Agente"
    );
  };

  const handleSimulateCall = () => {
    const note = callNotes[Math.floor(Math.random() * callNotes.length)];
    setLastCallNote(note);
    if (selectedLead) {
      addAuditLog(
        "call_result_registered",
        "lead",
        selectedLead.id,
        "Resultado de llamada simulado",
        "Agente"
      );
    }
  };

  const handleCreateTask = async (payload: {
    titulo: string;
    tipoTarea: string;
    descripcion: string;
    fechaProgramada: string;
  }) => {
    if (!selectedLead) {
      return;
    }

    const task = await createTask({
      leadId: selectedLead.id,
      leadNombre: selectedLead.nombre ?? "Lead sin nombre",
      agenteId: selectedLead.agenteId,
      titulo: payload.titulo,
      tipoTarea: payload.tipoTarea,
      descripcion: payload.descripcion || null,
      fechaProgramada: payload.fechaProgramada,
      estado: "pendiente",
    });

    await addAuditLog(
      "task_created",
      "task",
      task.id,
      `Tarea creada desde lead ${selectedLead.id}`,
      "Agente"
    );
  };

  const slaDaysRemaining = selectedLead
    ? Math.max(
        0,
        slaDays -
          Math.floor(
            (referenceNowMs - new Date(selectedLead.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      )
    : 0;

  const isSlaBreached = selectedLead
    ? referenceNowMs - new Date(selectedLead.createdAt).getTime() >
      1000 * 60 * 60 * 24 * slaDays
    : false;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Leads</h1>
        <p className="text-sm text-botanical-600">
          Gestión centralizada de leads con estados y seguimiento.
        </p>
      </div>

      <LeadFilters
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
        statusValue={statusValue}
        onStatusChange={(value) => {
          setStatusValue(value);
          setCurrentPage(1);
        }}
        countryValue={countryValue}
        onCountryChange={(value) => {
          setCountryValue(value);
          setCurrentPage(1);
        }}
        countries={countries}
      />

      {(slaDueSoonCount > 0 || slaBreachedCount > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">SLA por vencer</p>
            <p>
              {slaDueSoonCount} lead(s) están a menos de 1 día del límite de {slaDays} días.
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-semibold">SLA vencido</p>
            <p>{slaBreachedCount} lead(s) ya superaron el límite configurado.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Leads activos
            </p>
            <div className="flex items-center gap-2 text-xs text-botanical-700">
              <span>Ordenar por</span>
              <select
                value={orderValue}
                onChange={(event) => {
                  setOrderValue(event.target.value as typeof orderValue);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-botanical-200 bg-white px-2 py-1.5 text-xs text-botanical-800"
              >
                <option value="created_desc">Más recientes</option>
                <option value="created_asc">Más antiguos</option>
                <option value="name_asc">Nombre A-Z</option>
                <option value="name_desc">Nombre Z-A</option>
                <option value="sla_urgent">SLA más urgente</option>
              </select>
            </div>
          </div>

          {sortedLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
              No hay leads para los filtros actuales.
            </div>
          ) : (
            <>
              <LeadTable
                leads={paginatedLeads}
                selectedLeadId={selectedLeadId}
                onSelect={setSelectedLeadId}
                referenceNowMs={referenceNowMs}
              />
              {totalPages > 1 ? (
                <div className="mt-2 flex items-center justify-between text-xs text-botanical-700">
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
            </>
          )}
        </div>
        <LeadDetailPanel
          lead={selectedLead}
          onChangeStatus={handleStatusChange}
          onCloseLead={handleCloseLead}
          onSimulateCall={handleSimulateCall}
          onCreateTask={handleCreateTask}
          lastCallNote={lastCallNote}
          history={history}
          slaDaysRemaining={slaDaysRemaining}
          isSlaBreached={isSlaBreached}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
