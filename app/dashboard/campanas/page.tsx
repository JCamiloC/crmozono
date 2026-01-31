"use client";

import { useEffect, useMemo, useState } from "react";
import CampaignDetailPanel from "../../../components/campaigns/CampaignDetailPanel";
import CampaignForm from "../../../components/campaigns/CampaignForm";
import CampaignList from "../../../components/campaigns/CampaignList";
import type { Campaign, CampaignLog } from "../../../types";
import {
  listCampaignLogs,
  listCampaigns,
  createCampaign,
} from "../../../services/campañas.service";
import { addAuditLog } from "../../../services/auditoria.service";

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [logs, setLogs] = useState<CampaignLog[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await listCampaigns();
      setCampaigns(data);
      if (data.length > 0) {
        setSelectedCampaignId(data[0].id);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      if (!selectedCampaignId) return;
      const data = await listCampaignLogs(selectedCampaignId);
      setLogs(data);
    };
    loadLogs();
  }, [selectedCampaignId]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  const handleCreateCampaign = async () => {
    const newCampaign = await createCampaign({
      name: "Nueva campaña",
      segment: "Leads activos",
      status: "draft",
      scheduledAt: new Date().toISOString(),
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      deliveryRate: 0,
      messagePreview: "Mensaje basado en plantilla",
    });
    setCampaigns((prev) => [newCampaign, ...prev]);
    setSelectedCampaignId(newCampaign.id);
    await addAuditLog(
      "campaign_created",
      "campaign",
      newCampaign.id,
      "Campaña creada (simulada)",
      "Admin"
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Campañas masivas</h1>
        <p className="text-sm text-botanical-600">
          Gestión de envíos masivos con plantillas aprobadas (simulado).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
            Campañas
          </p>
          <CampaignList
            campaigns={campaigns}
            selectedId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
          />
        </div>

        <CampaignDetailPanel campaign={selectedCampaign} logs={logs} />

        <CampaignForm onSubmit={handleCreateCampaign} />
      </div>
    </div>
  );
}
