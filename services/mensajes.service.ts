import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { Conversation, Message, MessageTemplate } from "../types";

type ConversationRow = {
	id: string;
	lead_id: string;
	last_message: string | null;
	updated_at: string;
	leads?: { nombre: string | null; telefono: string } | { nombre: string | null; telefono: string }[] | null;
};

type MessageRow = {
	id: string;
	conversation_id: string;
	body: string;
	direction: string;
	created_at: string;
};

type MessageTemplateRow = {
	id: string;
	name: string;
	preview: string;
	body: string;
	send_mode?: string | null;
	provider_template_name?: string | null;
	provider_language_code?: string | null;
	variable_defaults?: Record<string, unknown> | null;
};

export type SendMessageOptions = {
	templateId?: string;
	customVariables?: Record<string, string>;
	forceMode?: "auto" | "text" | "template";
};

const defaultTemplates: MessageTemplate[] = [
	{
		id: "tpl-default-001",
		name: "Bienvenida",
		preview: "Hola {{nombre}}, gracias por contactarnos...",
		body: "Hola {{nombre}}, gracias por contactarnos en SuperOzono. ¿En qué podemos ayudarte?",
	},
	{
		id: "tpl-default-002",
		name: "Seguimiento",
		preview: "Queremos saber si pudiste revisar...",
		body: "Hola {{nombre}}, queremos saber si pudiste revisar la propuesta. Quedamos atentos.",
	},
	{
		id: "tpl-default-003",
		name: "Garantía",
		preview: "Gracias por tu compra, te recordamos...",
		body: "Gracias por tu compra. Recuerda que tu garantía está activa y nuestro equipo te acompaña.",
	},
];

const getLeadData = (leads: ConversationRow["leads"]) => {
	if (!leads) {
		return { leadName: "Lead sin nombre", leadPhone: "" };
	}
	if (Array.isArray(leads)) {
		return {
			leadName: leads[0]?.nombre ?? "Lead sin nombre",
			leadPhone: leads[0]?.telefono ?? "",
		};
	}
	return {
		leadName: leads.nombre ?? "Lead sin nombre",
		leadPhone: leads.telefono,
	};
};

const getInitials = (name: string) => {
	const cleanName = name.trim();
	if (!cleanName) {
		return "--";
	}
	const parts = cleanName.split(" ").filter(Boolean);
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const normalizeDirection = (value: string): "inbound" | "outbound" => {
	return value === "inbound" ? "inbound" : "outbound";
};

const mapConversationRow = (row: ConversationRow): Conversation => {
	const leadData = getLeadData(row.leads);
	return {
		id: row.id,
		leadId: row.lead_id,
		leadName: leadData.leadName,
		leadPhone: leadData.leadPhone,
		initials: getInitials(leadData.leadName),
		lastMessage: row.last_message ?? "Sin mensajes",
		updatedAt: row.updated_at,
	};
};

const mapMessageRow = (row: MessageRow): Message => {
	return {
		id: row.id,
		conversationId: row.conversation_id,
		body: row.body,
		direction: normalizeDirection(row.direction),
		createdAt: row.created_at,
	};
};

const mapTemplateRow = (row: MessageTemplateRow): MessageTemplate => {
	const defaultVariables: Record<string, string> = {};
	if (row.variable_defaults && typeof row.variable_defaults === "object") {
		for (const [key, value] of Object.entries(row.variable_defaults)) {
			if (typeof value === "string") {
				defaultVariables[key] = value;
			}
		}
	}

	return {
		id: row.id,
		name: row.name,
		preview: row.preview,
		body: row.body,
		sendMode:
			row.send_mode === "auto" || row.send_mode === "text" || row.send_mode === "template"
				? row.send_mode
				: undefined,
		providerTemplateName: row.provider_template_name ?? null,
		providerLanguageCode: row.provider_language_code ?? null,
		defaultVariables,
	};
};

export const listConversations = async (): Promise<Conversation[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("conversations")
		.select("id, lead_id, last_message, updated_at, leads(nombre, telefono)")
		.order("updated_at", { ascending: false });

	if (error || !data) {
		console.error("[messages] listConversations error", error);
		return [];
	}

	return (data as ConversationRow[]).map(mapConversationRow);
};

export const getConversationById = async (
	conversationId: string
): Promise<Conversation | null> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("conversations")
		.select("id, lead_id, last_message, updated_at, leads(nombre, telefono)")
		.eq("id", conversationId)
		.maybeSingle();

	if (error || !data) {
		return null;
	}

	return mapConversationRow(data as ConversationRow);
};

export const listMessages = async (conversationId: string): Promise<Message[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("messages")
		.select("id, conversation_id, body, direction, created_at")
		.eq("conversation_id", conversationId)
		.order("created_at", { ascending: true });

	if (error || !data) {
		console.error("[messages] listMessages error", error);
		return [];
	}

	return (data as MessageRow[]).map(mapMessageRow);
};

export const sendMessage = async (
	conversationId: string,
	body: string,
	options?: SendMessageOptions
): Promise<Message> => {
	const response = await fetch("/api/whatsapp/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			conversationId,
			body,
			templateId: options?.templateId,
			customVariables: options?.customVariables,
			forceMode: options?.forceMode,
		}),
	});

	const payload = (await response.json().catch(() => null)) as
		| {
			error?: string;
			message?: MessageRow;
		  }
		| null;

	if (!response.ok || !payload?.message) {
		throw new Error(payload?.error ?? "No se pudo enviar el mensaje a WhatsApp");
	}

	return mapMessageRow(payload.message);
};

export const listTemplates = async (): Promise<MessageTemplate[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("message_templates")
		.select("*")
		.order("name", { ascending: true });

	if (error || !data) {
		console.error("[messages] listTemplates error", error);
		return defaultTemplates;
	}

	if (data.length === 0) {
		return defaultTemplates;
	}

	return (data as MessageTemplateRow[]).map(mapTemplateRow);
};
