import type { Lead } from "../../types";
import LeadStatusBadge from "./LeadStatusBadge";

type LeadTableProps = {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelect: (leadId: string) => void;
  referenceNowMs: number;
};

export default function LeadTable({
  leads,
  selectedLeadId,
  onSelect,
  referenceNowMs,
}: LeadTableProps) {
  const getSlaInfo = (createdAt: string) => {
    const days = Math.floor(
      (referenceNowMs - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const remaining = Math.max(0, 5 - days);
    return { remaining, isBreached: days > 5 };
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 md:hidden">
        {leads.map((lead) => {
          const slaInfo = getSlaInfo(lead.createdAt);

          return (
            <button
              key={lead.id}
              type="button"
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                selectedLeadId === lead.id
                  ? "border-botanical-300 bg-botanical-50"
                  : "border-botanical-100 bg-white hover:border-botanical-200"
              }`}
              onClick={() => onSelect(lead.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-botanical-900">
                    {lead.nombre ?? "Sin nombre"}
                  </p>
                  <p className="text-xs text-botanical-600">ID {lead.id.slice(0, 6)}...</p>
                  <p
                    className={`text-xs font-semibold ${
                      slaInfo.isBreached ? "text-rose-600" : "text-botanical-600"
                    }`}
                  >
                    SLA: {slaInfo.isBreached ? "Vencido" : `${slaInfo.remaining} días`}
                  </p>
                </div>
                <LeadStatusBadge status={lead.estadoActual} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-botanical-700">
                <div>
                  <p className="font-semibold text-botanical-600">Teléfono</p>
                  <p className="break-all">{lead.telefono}</p>
                </div>
                <div>
                  <p className="font-semibold text-botanical-600">País</p>
                  <p>{lead.pais}</p>
                </div>
                <div>
                  <p className="font-semibold text-botanical-600">Agente</p>
                  <p className="truncate">{lead.agenteId}</p>
                </div>
                <div>
                  <p className="font-semibold text-botanical-600">Origen</p>
                  <p className="uppercase">{lead.origen ?? "manual"}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-botanical-100 bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-botanical-50 text-xs uppercase tracking-[0.08em] text-botanical-600">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Agente</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`cursor-pointer border-t border-botanical-100 transition hover:bg-botanical-50/70 ${
                  selectedLeadId === lead.id ? "bg-botanical-50" : "bg-white"
                }`}
                onClick={() => onSelect(lead.id)}
              >
                <td className="px-4 py-3 font-semibold text-botanical-900">
                  {lead.nombre ?? "Sin nombre"}
                  <p className="text-xs font-normal text-botanical-600">
                    ID {lead.id.slice(0, 6)}...
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      getSlaInfo(lead.createdAt).isBreached
                        ? "text-rose-600"
                        : "text-botanical-600"
                    }`}
                  >
                    SLA: {getSlaInfo(lead.createdAt).isBreached
                      ? "Vencido"
                      : `${getSlaInfo(lead.createdAt).remaining} días`}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-botanical-500">
                    Origen: {lead.origen ?? "manual"}
                  </p>
                </td>
                <td className="px-4 py-3 text-botanical-700">{lead.pais}</td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.estadoActual} />
                </td>
                <td className="px-4 py-3 text-botanical-700">
                  <span className="break-all">{lead.telefono}</span>
                </td>
                <td className="px-4 py-3 text-botanical-700">{lead.agenteId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
