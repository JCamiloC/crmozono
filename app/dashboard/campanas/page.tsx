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
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState<Campaign["status"] | "all">("all");
  const [orderValue, setOrderValue] = useState<
    "scheduled_desc" | "scheduled_asc" | "name_asc" | "name_desc" | "delivery_desc"
  >("scheduled_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 8;

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

  const processedCampaigns = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const filtered = campaigns.filter((campaign) => {
      const searchMatch =
        !normalizedSearch ||
        campaign.name.toLowerCase().includes(normalizedSearch) ||
        campaign.segment.toLowerCase().includes(normalizedSearch);
      const statusMatch = statusValue === "all" || campaign.status === statusValue;
      return searchMatch && statusMatch;
    });

    filtered.sort((a, b) => {
      if (orderValue === "scheduled_asc") {
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      }

      if (orderValue === "name_asc") {
        return a.name.localeCompare(b.name, "es");
      }

      if (orderValue === "name_desc") {
        return b.name.localeCompare(a.name, "es");
      }

      if (orderValue === "delivery_desc") {
        return b.deliveryRate - a.deliveryRate;
      }

      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });

    return filtered;
  }, [campaigns, searchValue, statusValue, orderValue]);

  const totalPages = Math.max(1, Math.ceil(processedCampaigns.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCampaigns = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return processedCampaigns.slice(start, start + PAGE_SIZE);
  }, [processedCampaigns, safeCurrentPage]);

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
          <input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar campaña"
            className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800 placeholder:text-botanical-400"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={statusValue}
              onChange={(event) => {
                setStatusValue(event.target.value as typeof statusValue);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="scheduled">Programada</option>
              <option value="running">En curso</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
            <select
              value={orderValue}
              onChange={(event) => {
                setOrderValue(event.target.value as typeof orderValue);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
            >
              <option value="scheduled_desc">Más recientes</option>
              <option value="scheduled_asc">Más antiguas</option>
              <option value="name_asc">Nombre A-Z</option>
              <option value="name_desc">Nombre Z-A</option>
              <option value="delivery_desc">Mejor entrega</option>
            </select>
          </div>
          <CampaignList
            campaigns={paginatedCampaigns}
            selectedId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
          />
          {totalPages > 1 ? (
            <div className="mt-1 flex items-center justify-between text-xs text-botanical-700">
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
        </div>

        <CampaignDetailPanel campaign={selectedCampaign} logs={logs} />

        <CampaignForm onSubmit={handleCreateCampaign} />
      </div>
    </div>
  );
}
