import type { Campaign } from "../../types";
import CampaignStatusBadge from "./CampaignStatusBadge";

type CampaignListProps = {
  campaigns: Campaign[];
  selectedId: string | null;
  onSelect: (campaignId: string) => void;
};

export default function CampaignList({
  campaigns,
  selectedId,
  onSelect,
}: CampaignListProps) {
  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <button
          key={campaign.id}
          type="button"
          onClick={() => onSelect(campaign.id)}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition ${
            selectedId === campaign.id
              ? "border-botanical-200 bg-botanical-50"
              : "border-botanical-100 bg-white hover:bg-botanical-50/70"
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-botanical-900">
              {campaign.name}
            </p>
            <p className="truncate text-xs text-botanical-600">
              {campaign.segment}
            </p>
          </div>
          <div className="shrink-0">
            <CampaignStatusBadge status={campaign.status} />
          </div>
        </button>
      ))}
    </div>
  );
}
