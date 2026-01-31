import type { LeadStatus } from "../../types";

type LeadStatusBadgeProps = {
  status: LeadStatus;
};

const statusStyles: Record<LeadStatus, string> = {
  nuevo: "bg-slate-100 text-slate-700",
  contactado: "bg-botanical-100 text-botanical-700",
  seguimiento: "bg-amber-100 text-amber-700",
  llamada: "bg-violet-100 text-violet-700",
  venta: "bg-emerald-100 text-emerald-700",
  no_interesado: "bg-rose-100 text-rose-700",
  cerrado_tiempo: "bg-slate-200 text-slate-700",
};

const statusLabels: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  seguimiento: "En seguimiento",
  llamada: "Llamada realizada",
  venta: "Venta efectiva",
  no_interesado: "No interesado",
  cerrado_tiempo: "Cerrado por tiempo",
};

export default function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status]
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}
