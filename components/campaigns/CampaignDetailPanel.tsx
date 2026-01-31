import type { Campaign, CampaignLog } from "../../types";
import CampaignStatusBadge from "./CampaignStatusBadge";

type CampaignDetailPanelProps = {
  campaign: Campaign | null;
  logs: CampaignLog[];
};

export default function CampaignDetailPanel({
  campaign,
  logs,
}: CampaignDetailPanelProps) {
  if (!campaign) {
    return (
      <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
        Selecciona una campaña para ver detalles.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Campaña
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-botanical-900">
          {campaign.name}
        </h2>
        <p className="text-sm text-botanical-600">{campaign.segment}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CampaignStatusBadge status={campaign.status} />
        <span className="text-xs text-botanical-600">
          Programada: {new Date(campaign.scheduledAt).toLocaleDateString()}
        </span>
      </div>

      <div className="grid gap-4 text-sm text-botanical-700 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Total destinatarios
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{campaign.totalRecipients}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Enviados
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{campaign.sentCount}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Fallidos
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{campaign.failedCount}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Tasa de entrega
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{campaign.deliveryRate}%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-sm text-botanical-700">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Mensaje
        </p>
        <p className="mt-2 text-sm font-semibold text-botanical-900">
          {campaign.messagePreview}
        </p>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Logs recientes
        </p>
        <div className="mt-3 space-y-2 text-xs text-botanical-700">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between">
              <span>{log.phone}</span>
              <span className="text-botanical-600">{log.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
