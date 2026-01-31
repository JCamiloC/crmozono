import type { Lead, LeadStatus, LeadStatusHistory } from "../../types";
import LeadStatusBadge from "./LeadStatusBadge";

type LeadDetailPanelProps = {
  lead: Lead | null;
  onChangeStatus: (status: LeadStatus) => void;
  onCloseLead: () => void;
  onSimulateCall: () => void;
  lastCallNote: string | null;
  history: LeadStatusHistory[];
  slaDaysRemaining: number;
  isSlaBreached: boolean;
  errorMessage: string | null;
};

export default function LeadDetailPanel({
  lead,
  onChangeStatus,
  onCloseLead,
  onSimulateCall,
  lastCallNote,
  history,
  slaDaysRemaining,
  isSlaBreached,
  errorMessage,
}: LeadDetailPanelProps) {
  if (!lead) {
    return (
      <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
        Selecciona un lead para ver detalles.
      </div>
    );
  }

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
            Creación
          </p>
          <p className="mt-2 font-semibold text-botanical-900">
            {new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="text-xs font-semibold text-botanical-700">
          Cambiar estado
        </label>
        <select
          value={lead.estadoActual}
          onChange={(event) => onChangeStatus(event.target.value as LeadStatus)}
          className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        >
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="seguimiento">En seguimiento</option>
          <option value="llamada">Llamada realizada</option>
          <option value="venta">Venta efectiva</option>
          <option value="no_interesado">No interesado</option>
          <option value="cerrado_tiempo">Cerrado por tiempo</option>
        </select>
        {errorMessage ? (
          <p className="text-xs text-rose-600">{errorMessage}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onCloseLead}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
      >
        Cerrar lead (venta efectiva)
      </button>

      <div className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-sm text-botanical-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Última llamada (simulada)
            </p>
            <p className="mt-2 text-sm font-semibold text-botanical-900">
              {lastCallNote ?? "Sin llamadas registradas"}
            </p>
          </div>
          <button
            type="button"
            onClick={onSimulateCall}
            className="rounded-xl border border-botanical-200 bg-white px-3 py-2 text-xs font-semibold text-botanical-700 shadow-sm transition hover:bg-botanical-100"
          >
            Simular llamada
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
    </div>
  );
}
