import { useState } from "react";
import type { CallResult, Lead, LeadStatus, LeadStatusHistory } from "../../types";
import LeadStatusBadge from "./LeadStatusBadge";

type CreateTaskPayload = {
  titulo: string;
  tipoTarea: string;
  descripcion: string;
  fechaProgramada: string;
};

type RegisterCallPayload = {
  startedAt: string;
  endedAt: string;
  result: CallResult;
  notes: string | null;
};

type LeadDetailPanelProps = {
  lead: Lead | null;
  onChangeStatus: (status: LeadStatus) => void;
  onCloseLead: () => void;
  onRegisterCallAndSetLlamada: (payload: RegisterCallPayload) => Promise<void>;
  currentAgentName: string;
  isCommercialLocked: boolean;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  history: LeadStatusHistory[];
  slaDaysRemaining: number;
  isSlaBreached: boolean;
  errorMessage: string | null;
};

const formatDateTimeLocal = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export default function LeadDetailPanel({
  lead,
  onChangeStatus,
  onCloseLead,
  onRegisterCallAndSetLlamada,
  currentAgentName,
  isCommercialLocked,
  onCreateTask,
  history,
  slaDaysRemaining,
  isSlaBreached,
  errorMessage,
}: LeadDetailPanelProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("seguimiento");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [registeringCall, setRegisteringCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callStartedAt, setCallStartedAt] = useState(() => {
    const start = new Date(Date.now() - 10 * 60 * 1000);
    return formatDateTimeLocal(start);
  });
  const [callEndedAt, setCallEndedAt] = useState(() => formatDateTimeLocal(new Date()));
  const [callResult, setCallResult] = useState<CallResult>("interesado");
  const [callNotes, setCallNotes] = useState("");

  const resetCallModalForm = () => {
    const now = new Date();
    const tenMinutesBefore = new Date(now.getTime() - 10 * 60 * 1000);
    setCallStartedAt(formatDateTimeLocal(tenMinutesBefore));
    setCallEndedAt(formatDateTimeLocal(now));
    setCallResult("interesado");
    setCallNotes("");
    setCallError(null);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDate) {
      setTaskError("Título y fecha programada son obligatorios.");
      return;
    }

    setTaskError(null);
    setTaskSuccess(null);
    setCreatingTask(true);

    try {
      await onCreateTask({
        titulo: taskTitle.trim(),
        tipoTarea: taskType,
        descripcion: taskDescription.trim(),
        fechaProgramada: new Date(taskDate).toISOString(),
      });

      setTaskTitle("");
      setTaskType("seguimiento");
      setTaskDescription("");
      setTaskDate("");
      setTaskSuccess("Tarea creada correctamente.");
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "No se pudo crear la tarea.");
    } finally {
      setCreatingTask(false);
    }
  };

  if (!lead) {
    return (
      <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
        Selecciona un lead para ver detalles.
      </div>
    );
  }

  const handleChangeStatus = (status: LeadStatus) => {
    if (isCommercialLocked && status !== lead.estadoActual) {
      return;
    }

    if (status === "llamada" && lead.estadoActual !== "llamada") {
      resetCallModalForm();
      setIsCallModalOpen(true);
      return;
    }
    onChangeStatus(status);
  };

  const handleConfirmCallAndStatus = async () => {
    setCallError(null);

    if (!callStartedAt || !callEndedAt) {
      setCallError("Debes ingresar fecha/hora de inicio y fin.");
      return;
    }

    const startIso = new Date(callStartedAt).toISOString();
    const endIso = new Date(callEndedAt).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setCallError("La fecha/hora de fin debe ser mayor a la de inicio.");
      return;
    }

    setRegisteringCall(true);

    try {
      await onRegisterCallAndSetLlamada({
        startedAt: startIso,
        endedAt: endIso,
        result: callResult,
        notes: callNotes.trim() ? callNotes.trim() : null,
      });
      setIsCallModalOpen(false);
      resetCallModalForm();
    } catch (error) {
      setCallError(
        error instanceof Error ? error.message : "No se pudo registrar la llamada."
      );
    } finally {
      setRegisteringCall(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Detalle del lead
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-botanical-900">
          {lead.nombre ?? "Sin nombre"}
        </h2>
        <p className="text-sm text-botanical-600">{lead.telefono}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LeadStatusBadge status={lead.estadoActual} />
        <span className="text-xs text-botanical-600">
          Última actualización: {new Date(lead.fechaEstado).toLocaleDateString()}
        </span>
        <span
          className={`text-xs font-semibold ${
            isSlaBreached ? "text-rose-600" : "text-botanical-600"
          }`}
        >
          SLA: {isSlaBreached ? "Vencido" : `${slaDaysRemaining} días`}
        </span>
      </div>

      <div className="grid gap-4 text-sm text-botanical-700 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            País
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{lead.pais}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Agente
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{lead.agenteId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Administrador
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{lead.administradorId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Origen
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{lead.origen ?? "manual"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Creación
          </p>
          <p className="mt-2 font-semibold text-botanical-900">
            {new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="text-xs font-semibold text-botanical-700">Cambiar estado</label>
        <select
          value={lead.estadoActual}
          disabled={isCommercialLocked}
          onChange={(event) => handleChangeStatus(event.target.value as LeadStatus)}
          className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100 disabled:opacity-60"
        >
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="seguimiento">En seguimiento</option>
          <option value="llamada">Llamada realizada</option>
          <option value="venta">Venta efectiva</option>
          <option value="no_interesado">No interesado</option>
          <option value="cerrado_tiempo">Cerrado por tiempo</option>
        </select>
        {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
        {isCommercialLocked ? (
          <p className="text-xs text-slate-600">
            Estado final alcanzado. El lead no permite reapertura ni nuevas acciones comerciales.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onCloseLead}
        disabled={isCommercialLocked}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:opacity-60"
      >
        Cerrar lead (venta efectiva)
      </button>

      <div className="rounded-2xl border border-botanical-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Crear tarea
        </p>
        <div className="mt-3 grid gap-3">
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Título"
            disabled={isCommercialLocked}
            className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
          />
          <select
            value={taskType}
            onChange={(event) => setTaskType(event.target.value)}
            disabled={isCommercialLocked}
            className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
          >
            <option value="seguimiento">Seguimiento</option>
            <option value="llamada">Llamada</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="cierre">Cierre</option>
          </select>
          <input
            type="datetime-local"
            value={taskDate}
            onChange={(event) => setTaskDate(event.target.value)}
            disabled={isCommercialLocked}
            className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
          />
          <textarea
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="Descripción (opcional)"
            rows={3}
            disabled={isCommercialLocked}
            className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
          />
          {taskError ? <p className="text-xs text-rose-600">{taskError}</p> : null}
          {taskSuccess ? <p className="text-xs text-emerald-600">{taskSuccess}</p> : null}
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={creatingTask || isCommercialLocked}
            className="rounded-xl bg-botanical-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-botanical-800 disabled:opacity-60"
          >
            {creatingTask ? "Creando..." : "Crear tarea"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Historial de estados
        </p>
        <div className="mt-3 space-y-2 text-xs text-botanical-700">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-botanical-200 bg-botanical-50 p-3 text-botanical-600">
              Sin historial registrado.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.estado}</span>
                <span className="text-botanical-500">
                  {new Date(item.fecha).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {isCallModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-botanical-900/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-botanical-200 bg-white p-5 shadow-soft">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
                Registrar llamada
              </p>
              <h3 className="mt-1 text-xl font-semibold text-botanical-900">
                Completa los datos para marcar llamada realizada
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
                  Agente
                </p>
                <p className="mt-1 rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2 text-sm font-semibold text-botanical-900">
                  {currentAgentName}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-botanical-700">Inicio</label>
                <input
                  type="datetime-local"
                  value={callStartedAt}
                  onChange={(event) => setCallStartedAt(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-botanical-700">Fin</label>
                <input
                  type="datetime-local"
                  value={callEndedAt}
                  onChange={(event) => setCallEndedAt(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-botanical-700">Resultado</label>
                <select
                  value={callResult}
                  onChange={(event) => setCallResult(event.target.value as CallResult)}
                  className="mt-1 w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
                >
                  <option value="venta">Venta efectiva</option>
                  <option value="interesado">Cliente interesado</option>
                  <option value="no_interesado">No interesado</option>
                  <option value="no_contesta">No contesta</option>
                  <option value="cortada">Llamada cortada</option>
                  <option value="numero_incorrecto">Número incorrecto</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-botanical-700">Notas</label>
                <textarea
                  value={callNotes}
                  onChange={(event) => setCallNotes(event.target.value)}
                  rows={3}
                  placeholder="Observaciones de la llamada"
                  className="mt-1 w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800"
                />
              </div>
            </div>

            {callError ? <p className="mt-3 text-xs text-rose-600">{callError}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCallModalOpen(false);
                  setCallError(null);
                }}
                className="rounded-xl border border-botanical-200 bg-white px-4 py-2 text-sm font-semibold text-botanical-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCallAndStatus}
                disabled={registeringCall}
                className="rounded-xl bg-botanical-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {registeringCall ? "Guardando..." : "Guardar llamada y cambiar estado"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
