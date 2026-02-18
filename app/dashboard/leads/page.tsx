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
import { listCallsByLead } from "../../../services/llamadas.service";
import { addAuditLog } from "../../../services/auditoria.service";

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
  const [lastCallNote, setLastCallNote] = useState<string | null>(null);
  const [history, setHistory] = useState<LeadStatusHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await listLeads();
      setLeads(data);
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

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
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

  const slaDaysRemaining = selectedLead
    ? Math.max(
        0,
        5 -
          Math.floor(
            (referenceNowMs - new Date(selectedLead.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      )
    : 0;

  const isSlaBreached = selectedLead
    ? referenceNowMs - new Date(selectedLead.createdAt).getTime() >
      1000 * 60 * 60 * 24 * 5
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
        onSearchChange={setSearchValue}
        statusValue={statusValue}
        onStatusChange={setStatusValue}
        countryValue={countryValue}
        onCountryChange={setCountryValue}
        countries={countries}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
            Leads activos
          </p>
          {filteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
              No hay leads para los filtros actuales.
            </div>
          ) : (
            <LeadTable
              leads={filteredLeads}
              selectedLeadId={selectedLeadId}
              onSelect={setSelectedLeadId}
              referenceNowMs={referenceNowMs}
            />
          )}
        </div>
        <LeadDetailPanel
          lead={selectedLead}
          onChangeStatus={handleStatusChange}
          onCloseLead={handleCloseLead}
          onSimulateCall={handleSimulateCall}
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
