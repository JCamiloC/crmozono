"use client";

import { useEffect, useMemo, useState } from "react";
import LeadDetailPanel from "../../../components/leads/LeadDetailPanel";
import LeadFilters from "../../../components/leads/LeadFilters";
import ManualLeadForm from "../../../components/leads/ManualLeadForm";
import LeadTable from "../../../components/leads/LeadTable";
import type { CallResult, Lead, LeadStatus, LeadStatusHistory } from "../../../types";
import {
  closeLead,
  createManualLead,
  getLeadHistory,
  listLeads,
  updateLeadStatus,
} from "../../../services/leads/leads.service";
import { getSlaCloseAutomationConfig } from "../../../services/configuracion.service";
import { listCountries } from "../../../services/configuracion.service";
import { createCall, listCallsByLead } from "../../../services/llamadas.service";
import { addAuditLog } from "../../../services/auditoria.service";
import {
  createTask,
  listTasksByLead,
  updateTaskStatus,
} from "../../../services/tasks/tasks.service";
import { getCurrentUserProfile } from "../../../services/auth/auth.service";
import {
  appendManualMessageToConversation,
  getOrCreateConversationByLead,
  listMessages,
} from "../../../services/mensajes.service";

const FINAL_LEAD_STATUS: LeadStatus[] = ["venta", "no_interesado", "cerrado_tiempo"];
const LEAD_JOURNEY: LeadStatus[] = [
  "nuevo",
  "contactado",
  "seguimiento",
  "llamada",
  "venta",
];

const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  seguimiento: "En seguimiento",
  llamada: "Llamada realizada",
  venta: "Venta efectiva",
  no_interesado: "No interesado",
  cerrado_tiempo: "Cerrado por tiempo",
};

const isFinalLeadStatus = (status: LeadStatus): boolean => FINAL_LEAD_STATUS.includes(status);

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [referenceNowMs, setReferenceNowMs] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState<LeadStatus | "all">("all");
  const [countryValue, setCountryValue] = useState<string | "all">("all");
  const [manualLeadCountries, setManualLeadCountries] = useState<string[]>([]);
  const [orderValue, setOrderValue] = useState<
    "created_desc" | "created_asc" | "name_asc" | "name_desc" | "sla_urgent"
  >("created_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [history, setHistory] = useState<LeadStatusHistory[]>([]);
  const [slaDays, setSlaDays] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAgentName, setCurrentAgentName] = useState("Agente");
  const [workspaceTab, setWorkspaceTab] = useState<"mensajes" | "tareas" | "llamadas">(
    "mensajes"
  );
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceConversationId, setWorkspaceConversationId] = useState<string | null>(null);
  const [workspaceMessages, setWorkspaceMessages] = useState<
    Array<{
      id: string;
      conversationId: string;
      body: string;
      direction: "inbound" | "outbound";
      createdAt: string;
    }>
  >([]);
  const [workspaceCalls, setWorkspaceCalls] = useState<
    Array<{
      id: string;
      leadId: string;
      leadName: string;
      leadPhone: string;
      agentName: string;
      startedAt: string;
      endedAt: string;
      durationMinutes: number;
      result:
        | "venta"
        | "interesado"
        | "no_interesado"
        | "no_contesta"
        | "cortada"
        | "numero_incorrecto";
      notes: string | null;
    }>
  >([]);
  const [workspaceTasks, setWorkspaceTasks] = useState<
    Array<{
      id: string;
      leadId: string;
      leadNombre: string;
      agenteId: string;
      titulo: string;
      tipoTarea: string;
      descripcion: string | null;
      fechaProgramada: string;
      estado: "pendiente" | "completada" | "vencida" | "cancelada";
      fechaCreacion: string;
      fechaCompletada: string | null;
    }>
  >([]);
  const [workspaceMessageInput, setWorkspaceMessageInput] = useState("");
  const [sendingWorkspaceMessage, setSendingWorkspaceMessage] = useState(false);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      const [data, slaConfig, countriesData] = await Promise.all([
        listLeads(),
        getSlaCloseAutomationConfig(),
        listCountries(),
      ]);
      const profile = await getCurrentUserProfile();
      setLeads(data);
      setSlaDays(slaConfig.days);
      setManualLeadCountries(countriesData.map((country) => country.name));
      const userEmail = profile?.email?.trim() ?? "";
      setCurrentAgentName(userEmail || "Agente");
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

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!selectedLeadId) {
        setWorkspaceConversationId(null);
        setWorkspaceMessages([]);
        setWorkspaceCalls([]);
        setWorkspaceTasks([]);
        return;
      }

      setWorkspaceLoading(true);
      setWorkspaceError(null);

      try {
        const [calls, tasks, conversation] = await Promise.all([
          listCallsByLead(selectedLeadId),
          listTasksByLead(selectedLeadId),
          getOrCreateConversationByLead(selectedLeadId),
        ]);

        const messages = await listMessages(conversation.id);

        setWorkspaceCalls(calls);
        setWorkspaceTasks(tasks);
        setWorkspaceConversationId(conversation.id);
        setWorkspaceMessages(messages);
      } catch (error) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la gestión integral del lead"
        );
      } finally {
        setWorkspaceLoading(false);
      }
    };

    loadWorkspace();
  }, [selectedLeadId]);

  const countries = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.pais))).sort(),
    [leads]
  );

  const availableCountries = useMemo(
    () => Array.from(new Set([...manualLeadCountries, ...countries])).sort(),
    [manualLeadCountries, countries]
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

  const isSelectedLeadFinalized = selectedLead
    ? isFinalLeadStatus(selectedLead.estadoActual)
    : false;

  const selectedLeadJourneyIndex = selectedLead
    ? LEAD_JOURNEY.indexOf(selectedLead.estadoActual)
    : -1;

  const selectedLeadAgeDays = selectedLead
    ? Math.max(
        0,
        Math.floor(
          ((referenceNowMs || Date.now()) - new Date(selectedLead.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const pendingTasksForLead = workspaceTasks.filter((task) => task.estado === "pendiente").length;

  const leadHealth = useMemo(() => {
    if (!selectedLead) {
      return { label: "Sin selección", tone: "text-botanical-600 bg-botanical-50 border-botanical-200" };
    }

    if (selectedLead.estadoActual === "venta") {
      return { label: "Cerrado exitosamente", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }

    if (selectedLead.estadoActual === "no_interesado") {
      return { label: "Cierre por no interés", tone: "text-rose-700 bg-rose-50 border-rose-200" };
    }

    if (selectedLead.estadoActual === "cerrado_tiempo" || selectedLeadAgeDays > slaDays) {
      return { label: "SLA vencido", tone: "text-rose-700 bg-rose-50 border-rose-200" };
    }

    if (selectedLeadAgeDays >= slaDays - 1) {
      return { label: "Riesgo de vencimiento", tone: "text-amber-700 bg-amber-50 border-amber-200" };
    }

    return { label: "En gestión", tone: "text-botanical-700 bg-botanical-50 border-botanical-200" };
  }, [selectedLead, selectedLeadAgeDays, slaDays]);

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

    if (isFinalLeadStatus(selectedLead.estadoActual) && status !== selectedLead.estadoActual) {
      setErrorMessage("El lead está cerrado y no puede reabrirse.");
      return;
    }

    if (status === "venta") {
      const calls = await listCallsByLead(selectedLead.id);
      if (calls.length === 0) {
        setErrorMessage("No se puede cerrar sin llamada registrada.");
        return;
      }

      if (selectedLead.estadoActual !== "llamada") {
        setErrorMessage("Para cerrar como venta primero debes pasar por llamada realizada.");
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

    if (isFinalLeadStatus(selectedLead.estadoActual)) {
      setErrorMessage("El lead ya está en estado final y no puede modificarse.");
      return;
    }

    const calls = await listCallsByLead(selectedLead.id);
    if (calls.length === 0) {
      setErrorMessage("No se puede cerrar sin llamada registrada.");
      return;
    }

    const updated = await closeLead(selectedLead.id);
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
    const updatedHistory = await getLeadHistory(updated.id);
    setHistory(updatedHistory);

    try {
      const conversation = await getOrCreateConversationByLead(updated.id);
      const warrantyMessage = await appendManualMessageToConversation(
        conversation.id,
        "Gracias por tu compra. Tu garantía quedó activa y nuestro equipo queda atento.",
        "outbound"
      );
      setWorkspaceConversationId(conversation.id);
      setWorkspaceMessages((prev) => [...prev, warrantyMessage]);
    } catch (messageError) {
      console.error("[leads] post-sale warranty message error", messageError);
    }

    await addAuditLog(
      "lead_status_change",
      "lead",
      updated.id,
      "Lead cerrado como venta efectiva",
      currentAgentName
    );

    await addAuditLog(
      "message_sent",
      "lead",
      updated.id,
      "Mensaje automático de garantía registrado",
      currentAgentName
    );
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

    if (isFinalLeadStatus(selectedLead.estadoActual)) {
      setErrorMessage("El lead está cerrado. No se pueden crear nuevas tareas.");
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
      currentAgentName
    );

    const refreshedTasks = await listTasksByLead(selectedLead.id);
    setWorkspaceTasks(refreshedTasks);
  };

  const handleRegisterCallAndSetLlamada = async (payload: {
    startedAt: string;
    endedAt: string;
    result: CallResult;
    notes: string | null;
  }) => {
    if (!selectedLead) {
      return;
    }

    setErrorMessage(null);

    if (isFinalLeadStatus(selectedLead.estadoActual)) {
      setErrorMessage("El lead está cerrado. No se pueden registrar más llamadas.");
      return;
    }

    const durationMinutes = Math.max(
      1,
      Math.round(
        (new Date(payload.endedAt).getTime() - new Date(payload.startedAt).getTime()) /
          (1000 * 60)
      )
    );

    const call = await createCall({
      leadId: selectedLead.id,
      leadName: selectedLead.nombre ?? "Lead sin nombre",
      leadPhone: selectedLead.telefono,
      agentName: currentAgentName,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      durationMinutes,
      result: payload.result,
      notes: payload.notes,
    });

    const updatedLead = await updateLeadStatus(selectedLead.id, "llamada");
    setLeads((prev) => prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
    const updatedHistory = await getLeadHistory(updatedLead.id);
    setHistory(updatedHistory);

    await addAuditLog(
      "call_result_registered",
      "call",
      call.id,
      `Llamada registrada para lead ${selectedLead.id}: ${payload.result}`,
      currentAgentName
    );

    await addAuditLog(
      "lead_status_change",
      "lead",
      updatedLead.id,
      "Estado actualizado a llamada",
      currentAgentName
    );

    if (payload.result === "no_contesta") {
      const followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      try {
        const task = await createTask({
          leadId: selectedLead.id,
          leadNombre: selectedLead.nombre ?? "Lead sin nombre",
          agenteId: selectedLead.agenteId,
          titulo: "Reintentar contacto tras llamada no contestada",
          tipoTarea: "seguimiento",
          descripcion: "Automática por resultado de llamada: no contesta",
          fechaProgramada: followUpDate,
          estado: "pendiente",
        });

        await addAuditLog(
          "task_created",
          "task",
          task.id,
          `Tarea automática post-llamada para lead ${selectedLead.id}`,
          currentAgentName
        );
      } catch (taskAutomationError) {
        console.error("[leads] no-answer follow-up task error", taskAutomationError);
      }
    }

    const refreshedCalls = await listCallsByLead(selectedLead.id);
    setWorkspaceCalls(refreshedCalls);
    const refreshedTasks = await listTasksByLead(selectedLead.id);
    setWorkspaceTasks(refreshedTasks);
  };

  const handleSendWorkspaceMessage = async () => {
    if (!workspaceConversationId || !workspaceMessageInput.trim() || sendingWorkspaceMessage) {
      return;
    }

    if (selectedLead && isFinalLeadStatus(selectedLead.estadoActual)) {
      setWorkspaceError("El lead está cerrado. No se permiten nuevos mensajes comerciales.");
      return;
    }

    setWorkspaceError(null);
    setSendingWorkspaceMessage(true);

    try {
      const message = await appendManualMessageToConversation(
        workspaceConversationId,
        workspaceMessageInput,
        "outbound"
      );
      setWorkspaceMessages((prev) => [...prev, message]);
      setWorkspaceMessageInput("");

      if (selectedLeadId) {
        await addAuditLog(
          "message_sent",
          "conversation",
          workspaceConversationId,
          `Mensaje enviado desde vista de leads para ${selectedLeadId}`,
          currentAgentName
        );
      }
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : "No se pudo enviar el mensaje"
      );
    } finally {
      setSendingWorkspaceMessage(false);
    }
  };

  const handleWorkspaceTaskStatusChange = async (
    taskId: string,
    status: "pendiente" | "completada" | "vencida" | "cancelada"
  ) => {
    if (selectedLead && isFinalLeadStatus(selectedLead.estadoActual)) {
      setWorkspaceError("El lead está cerrado. No se pueden modificar tareas comerciales.");
      return;
    }

    try {
      const updatedTask = await updateTaskStatus(taskId, status);
      setWorkspaceTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );

      await addAuditLog(
        "task_status_change",
        "task",
        taskId,
        `Estado actualizado a ${status} desde Leads`,
        currentAgentName
      );
    } catch (error) {
      setWorkspaceError(
        error instanceof Error ? error.message : "No se pudo actualizar la tarea"
      );
    }
  };

  const handleCreateManualLead = async (payload: {
    nombre: string | null;
    telefono: string;
    pais: string;
    initialMessage?: string | null;
  }) => {
    const createdLead = await createManualLead(payload);

    setLeads((prev) => [createdLead, ...prev]);
    setSelectedLeadId(createdLead.id);
    setSearchValue("");
    setStatusValue("all");
    setCountryValue("all");
    setCurrentPage(1);
    setReferenceNowMs(Date.now());

    await addAuditLog(
      "settings_updated",
      "lead",
      createdLead.id,
      `Lead manual creado con conversación inicial (${createdLead.telefono})`,
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

      <ManualLeadForm countries={availableCountries} onCreateLead={handleCreateManualLead} />

      {selectedLead ? (
        <div className="rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
                Indicadores visuales del lead
              </p>
              <p className="mt-1 text-sm text-botanical-700">
                Etapa actual: {LEAD_STATUS_LABEL[selectedLead.estadoActual]}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${leadHealth.tone}`}
            >
              {leadHealth.label}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2">
              <p className="text-xs text-botanical-600">Mensajes</p>
              <p className="text-lg font-semibold text-botanical-900">{workspaceMessages.length}</p>
            </div>
            <div className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2">
              <p className="text-xs text-botanical-600">Llamadas</p>
              <p className="text-lg font-semibold text-botanical-900">{workspaceCalls.length}</p>
            </div>
            <div className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2">
              <p className="text-xs text-botanical-600">Tareas pendientes</p>
              <p className="text-lg font-semibold text-botanical-900">{pendingTasksForLead}</p>
            </div>
            <div className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2">
              <p className="text-xs text-botanical-600">Edad del lead</p>
              <p className="text-lg font-semibold text-botanical-900">{selectedLeadAgeDays} día(s)</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-botanical-600">
              <span>Progreso del ciclo comercial</span>
              <span>
                {selectedLeadJourneyIndex >= 0
                  ? `${Math.min(selectedLeadJourneyIndex + 1, LEAD_JOURNEY.length)}/${LEAD_JOURNEY.length}`
                  : `Estado final: ${LEAD_STATUS_LABEL[selectedLead.estadoActual]}`}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {LEAD_JOURNEY.map((step, index) => {
                const reached =
                  selectedLeadJourneyIndex >= 0
                    ? index <= selectedLeadJourneyIndex
                    : step === "venta" && selectedLead.estadoActual === "venta";

                return (
                  <div
                    key={step}
                    className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
                      reached
                        ? "border-botanical-300 bg-botanical-100 text-botanical-800"
                        : "border-botanical-100 bg-white text-botanical-500"
                    }`}
                  >
                    {LEAD_STATUS_LABEL[step]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

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
        <div className="min-w-0 space-y-3">
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
          onRegisterCallAndSetLlamada={handleRegisterCallAndSetLlamada}
          currentAgentName={currentAgentName}
          isCommercialLocked={isSelectedLeadFinalized}
          onCreateTask={handleCreateTask}
          history={history}
          slaDaysRemaining={slaDaysRemaining}
          isSlaBreached={isSlaBreached}
          errorMessage={errorMessage}
        />
      </div>

      <div className="min-w-0 rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Gestión integral en una pantalla
            </p>
            <p className="mt-1 text-sm text-botanical-700">
              Administra mensajes, tareas y llamadas del lead actual sin salir del módulo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWorkspaceTab("mensajes")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                workspaceTab === "mensajes"
                  ? "bg-botanical-700 text-white"
                  : "border border-botanical-200 bg-white text-botanical-700"
              }`}
            >
              Mensajes
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("tareas")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                workspaceTab === "tareas"
                  ? "bg-botanical-700 text-white"
                  : "border border-botanical-200 bg-white text-botanical-700"
              }`}
            >
              Tareas
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("llamadas")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                workspaceTab === "llamadas"
                  ? "bg-botanical-700 text-white"
                  : "border border-botanical-200 bg-white text-botanical-700"
              }`}
            >
              Llamadas
            </button>
          </div>
        </div>

        {workspaceError ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {workspaceError}
          </p>
        ) : null}

        {isSelectedLeadFinalized ? (
          <p className="mt-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Lead en estado final. Las acciones comerciales quedan bloqueadas para preservar trazabilidad.
          </p>
        ) : null}

        {workspaceLoading ? (
          <p className="mt-4 text-sm text-botanical-600">Cargando gestión del lead...</p>
        ) : null}

        {!workspaceLoading && workspaceTab === "mensajes" ? (
          <div className="mt-4 space-y-3">
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-botanical-100 bg-botanical-50 p-3">
              {workspaceMessages.length === 0 ? (
                <p className="text-sm text-botanical-600">Sin mensajes registrados.</p>
              ) : (
                <div className="space-y-2">
                  {workspaceMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === "outbound" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[78%] rounded-xl px-3 py-2 text-xs ${
                          message.direction === "outbound"
                            ? "bg-botanical-700 text-white"
                            : "bg-white text-botanical-800"
                        }`}
                      >
                        <p>{message.body}</p>
                        <p className="mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={workspaceMessageInput}
                onChange={(event) => setWorkspaceMessageInput(event.target.value)}
                placeholder="Escribe un mensaje para registrar en la conversación"
                disabled={isSelectedLeadFinalized}
                className="flex-1 rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
              />
              <button
                type="button"
                onClick={handleSendWorkspaceMessage}
                disabled={sendingWorkspaceMessage || isSelectedLeadFinalized}
                className="rounded-xl bg-botanical-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sendingWorkspaceMessage ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        ) : null}

        {!workspaceLoading && workspaceTab === "tareas" ? (
          <div className="mt-4">
            {workspaceTasks.length === 0 ? (
              <p className="text-sm text-botanical-600">Sin tareas registradas para este lead.</p>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {workspaceTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-botanical-900">{task.titulo}</p>
                      <p className="mt-1 text-xs text-botanical-700">Tipo: {task.tipoTarea}</p>
                      <p className="text-xs text-botanical-700">
                        Programada: {new Date(task.fechaProgramada).toLocaleString("es-CO")}
                      </p>
                      <div className="mt-2">
                        <select
                          value={task.estado}
                          disabled={isSelectedLeadFinalized}
                          onChange={(event) =>
                            handleWorkspaceTaskStatusChange(
                              task.id,
                              event.target.value as
                                | "pendiente"
                                | "completada"
                                | "vencida"
                                | "cancelada"
                            )
                          }
                          className="w-full rounded-lg border border-botanical-200 bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="completada">Completada</option>
                          <option value="vencida">Vencida</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="text-botanical-500">
                        <th className="px-2 py-2">Título</th>
                        <th className="px-2 py-2">Tipo</th>
                        <th className="px-2 py-2">Programada</th>
                        <th className="px-2 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workspaceTasks.map((task) => (
                        <tr key={task.id} className="border-t border-botanical-100 text-botanical-800">
                          <td className="px-2 py-2">{task.titulo}</td>
                          <td className="px-2 py-2">{task.tipoTarea}</td>
                          <td className="px-2 py-2">
                            {new Date(task.fechaProgramada).toLocaleString("es-CO")}
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={task.estado}
                              disabled={isSelectedLeadFinalized}
                              onChange={(event) =>
                                handleWorkspaceTaskStatusChange(
                                  task.id,
                                  event.target.value as
                                    | "pendiente"
                                    | "completada"
                                    | "vencida"
                                    | "cancelada"
                                )
                              }
                              className="rounded-lg border border-botanical-200 bg-white px-2 py-1 text-xs disabled:opacity-60"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="completada">Completada</option>
                              <option value="vencida">Vencida</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : null}

        {!workspaceLoading && workspaceTab === "llamadas" ? (
          <div className="mt-4 space-y-2">
            {workspaceCalls.length === 0 ? (
              <p className="text-sm text-botanical-600">
                Sin llamadas aún. Usa "Llamada realizada" en el detalle del lead para registrar la primera.
              </p>
            ) : (
              workspaceCalls.map((call) => (
                <div
                  key={call.id}
                  className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-botanical-900">
                      {call.result.replace("_", " ")}
                    </p>
                    <p className="text-xs text-botanical-600">
                      {new Date(call.startedAt).toLocaleString("es-CO")} - {call.durationMinutes} min
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-botanical-700">
                    {call.notes ?? "Sin notas"}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
