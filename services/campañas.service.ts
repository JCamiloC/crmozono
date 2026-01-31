import type { Campaign, CampaignLog } from "../types";

const mockCampaigns: Campaign[] = [
	{
		id: "cmp-001",
		name: "Oferta mantenimiento",
		segment: "Leads activos Colombia",
		status: "running",
		scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
		totalRecipients: 120,
		sentCount: 96,
		failedCount: 4,
		deliveryRate: 80,
		messagePreview: "Hola {{nombre}}, tenemos una oferta especial...",
	},
	{
		id: "cmp-002",
		name: "Reactivación Q1",
		segment: "Leads inactivos México",
		status: "scheduled",
		scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
		totalRecipients: 240,
		sentCount: 0,
		failedCount: 0,
		deliveryRate: 0,
		messagePreview: "Hola {{nombre}}, queremos compartir una novedad...",
	},
	{
		id: "cmp-003",
		name: "Garantía extendida",
		segment: "Clientes recientes Perú",
		status: "completed",
		scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
		totalRecipients: 80,
		sentCount: 78,
		failedCount: 2,
		deliveryRate: 97,
		messagePreview: "Gracias por tu compra, tu garantía sigue activa...",
	},
];

const mockLogs: CampaignLog[] = [
	{ id: "log-001", campaignId: "cmp-001", phone: "+57 300 111 2222", status: "enviado" },
	{ id: "log-002", campaignId: "cmp-001", phone: "+57 300 333 4444", status: "enviado" },
	{ id: "log-003", campaignId: "cmp-001", phone: "+57 300 555 6666", status: "fallido" },
	{ id: "log-004", campaignId: "cmp-002", phone: "+52 55 1111 2222", status: "bloqueado" },
	{ id: "log-005", campaignId: "cmp-003", phone: "+51 999 888 777", status: "enviado" },
];

export const listCampaigns = async (): Promise<Campaign[]> => {
	return [...mockCampaigns];
};

export const getCampaignById = async (campaignId: string): Promise<Campaign | null> => {
	return mockCampaigns.find((campaign) => campaign.id === campaignId) ?? null;
};

export const createCampaign = async (payload: Omit<Campaign, "id">) => {
	const newCampaign: Campaign = {
		...payload,
		id: `cmp-${Math.random().toString(36).slice(2, 7)}`,
	};
	mockCampaigns.push(newCampaign);
	return newCampaign;
};

export const listCampaignLogs = async (campaignId: string): Promise<CampaignLog[]> => {
	return mockLogs.filter((log) => log.campaignId === campaignId);
};
