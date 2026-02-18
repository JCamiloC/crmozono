import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { Call, CallResult } from "../types";

type CallRow = {
	id: string;
	lead_id: string;
	agent_name: string;
	started_at: string;
	ended_at: string;
	duration_minutes: number;
	result: string;
	notes: string | null;
	leads?: { nombre: string | null; telefono: string } | { nombre: string | null; telefono: string }[] | null;
};

const VALID_CALL_RESULT: CallResult[] = [
	"venta",
	"interesado",
	"no_interesado",
	"no_contesta",
	"cortada",
	"numero_incorrecto",
];

const normalizeCallResult = (value: string): CallResult => {
	if (VALID_CALL_RESULT.includes(value as CallResult)) {
		return value as CallResult;
	}
	return "interesado";
};

const getLeadData = (leads: CallRow["leads"]) => {
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

const mapCallRow = (row: CallRow): Call => {
	const leadData = getLeadData(row.leads);
	return {
		id: row.id,
		leadId: row.lead_id,
		leadName: leadData.leadName,
		leadPhone: leadData.leadPhone,
		agentName: row.agent_name,
		startedAt: row.started_at,
		endedAt: row.ended_at,
		durationMinutes: row.duration_minutes,
		result: normalizeCallResult(row.result),
		notes: row.notes,
	};
};

export const listCalls = async (): Promise<Call[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("calls")
		.select("id, lead_id, agent_name, started_at, ended_at, duration_minutes, result, notes, leads(nombre, telefono)")
		.order("started_at", { ascending: false });

	if (error || !data) {
		console.error("[calls] listCalls error", error);
		return [];
	}

	return (data as CallRow[]).map(mapCallRow);
};

export const listCallsByLead = async (leadId: string): Promise<Call[]> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("calls")
		.select("id, lead_id, agent_name, started_at, ended_at, duration_minutes, result, notes, leads(nombre, telefono)")
		.eq("lead_id", leadId)
		.order("started_at", { ascending: false });

	if (error || !data) {
		console.error("[calls] listCallsByLead error", error);
		return [];
	}

	return (data as CallRow[]).map(mapCallRow);
};

export const getCallById = async (callId: string): Promise<Call | null> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("calls")
		.select("id, lead_id, agent_name, started_at, ended_at, duration_minutes, result, notes, leads(nombre, telefono)")
		.eq("id", callId)
		.maybeSingle();

	if (error || !data) {
		return null;
	}

	return mapCallRow(data as CallRow);
};

export const createCall = async (payload: Omit<Call, "id">): Promise<Call> => {
	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("calls")
		.insert({
			lead_id: payload.leadId,
			agent_name: payload.agentName,
			started_at: payload.startedAt,
			ended_at: payload.endedAt,
			duration_minutes: payload.durationMinutes,
			result: payload.result,
			notes: payload.notes,
		})
		.select("id, lead_id, agent_name, started_at, ended_at, duration_minutes, result, notes, leads(nombre, telefono)")
		.single();

	if (error || !data) {
		throw new Error(error?.message ?? "No se pudo crear la llamada");
	}

	return mapCallRow(data as CallRow);
};

export const registerCallResult = async (
	callId: string,
	result: CallResult,
	notes: string
): Promise<Call> => {
	const existingCall = await getCallById(callId);
	if (!existingCall) {
		throw new Error("Llamada no encontrada");
	}

	const nowIso = new Date().toISOString();
	const startMs = new Date(existingCall.startedAt).getTime();
	const endMs = new Date(nowIso).getTime();
	const durationMinutes = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));

	const supabase = createSupabaseBrowserClient();
	const { data, error } = await supabase
		.from("calls")
		.update({
			result,
			notes,
			ended_at: nowIso,
			duration_minutes: durationMinutes,
		})
		.eq("id", callId)
		.select("id, lead_id, agent_name, started_at, ended_at, duration_minutes, result, notes, leads(nombre, telefono)")
		.single();

	if (error || !data) {
		throw new Error(error?.message ?? "No se pudo registrar el resultado de llamada");
	}

	return mapCallRow(data as CallRow);
};
