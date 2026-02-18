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
    <div className="overflow-hidden rounded-2xl border border-botanical-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
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
              </td>
              <td className="px-4 py-3 text-botanical-700">{lead.pais}</td>
              <td className="px-4 py-3">
                <LeadStatusBadge status={lead.estadoActual} />
              </td>
              <td className="px-4 py-3 text-botanical-700">{lead.telefono}</td>
              <td className="px-4 py-3 text-botanical-700">
                {lead.agenteId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
