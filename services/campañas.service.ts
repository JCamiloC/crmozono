import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { Campaign, CampaignLog } from "../types";

type CampaignRow = {
	id: string;
	name: string;
	segment: string;
	status: string;
	scheduled_at: string;
	total_recipients: number;
	sent_count: number;
	failed_count: number;
	delivery_rate: number;
	message_preview: string;
};

type CampaignLogRow = {
	id: string;
	campaign_id: string;
	phone: string;
	status: "enviado" | "fallido" | "bloqueado";
};

const mapCampaignRow = (row: CampaignRow): Campaign => {
	return {
		id: row.id,
		name: row.name,
		segment: row.segment,
		status:
			row.status === "scheduled" ||
			row.status === "running" ||
			row.status === "completed" ||
			row.status === "paused"
				? row.status
				: "draft",
		scheduledAt: row.scheduled_at,
		totalRecipients: row.total_recipients,
		sentCount: row.sent_count,
		failedCount: row.failed_count,
		deliveryRate: Number(row.delivery_rate ?? 0),
		messagePreview: row.message_preview,
	};
};

const mapCampaignLogRow = (row: CampaignLogRow): CampaignLog => {
	return {
		id: row.id,
		campaignId: row.campaign_id,
		phone: row.phone,
		status: row.status,
	};
};

export const listCampaigns = async (): Promise<Campaign[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select(
			"id, name, segment, status, scheduled_at, total_recipients, sent_count, failed_count, delivery_rate, message_preview"
		)
		.order("scheduled_at", { ascending: false });

	if (error || !data) {
		console.error("[campaigns] listCampaigns error", error);
		return [];
	}

	return (data as CampaignRow[]).map(mapCampaignRow);
};

export const getCampaignById = async (campaignId: string): Promise<Campaign | null> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select(
			"id, name, segment, status, scheduled_at, total_recipients, sent_count, failed_count, delivery_rate, message_preview"
		)
		.eq("id", campaignId)
		.maybeSingle();

	if (error || !data) {
		return null;
	}

	return mapCampaignRow(data as CampaignRow);
};

export const createCampaign = async (payload: Omit<Campaign, "id">): Promise<Campaign> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("campaigns")
		.insert({
			name: payload.name,
			segment: payload.segment,
			status: payload.status,
			scheduled_at: payload.scheduledAt,
			total_recipients: payload.totalRecipients,
			sent_count: payload.sentCount,
			failed_count: payload.failedCount,
			delivery_rate: payload.deliveryRate,
			message_preview: payload.messagePreview,
			updated_at: new Date().toISOString(),
		})
		.select(
			"id, name, segment, status, scheduled_at, total_recipients, sent_count, failed_count, delivery_rate, message_preview"
		)
		.single();

	if (error || !data) {
		throw new Error(error?.message ?? "No se pudo crear la campaña");
	}

	return mapCampaignRow(data as CampaignRow);
};

export const listCampaignLogs = async (campaignId: string): Promise<CampaignLog[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("campaign_logs")
		.select("id, campaign_id, phone, status")
		.eq("campaign_id", campaignId)
		.order("created_at", { ascending: false });

	if (error || !data) {
		console.error("[campaigns] listCampaignLogs error", error);
		return [];
	}

	return (data as CampaignLogRow[]).map(mapCampaignLogRow);
};
