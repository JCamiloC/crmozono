import type { CampaignStatus } from "../../types";

type CampaignStatusBadgeProps = {
  status: CampaignStatus;
};

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-amber-100 text-amber-700",
  running: "bg-botanical-100 text-botanical-700",
  completed: "bg-emerald-100 text-emerald-700",
  paused: "bg-rose-100 text-rose-700",
};

const statusLabels: Record<CampaignStatus, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  running: "En curso",
  completed: "Finalizada",
  paused: "Pausada",
};

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
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
