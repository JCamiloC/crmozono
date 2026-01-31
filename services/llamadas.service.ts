import type { Call, CallResult } from "../types";

const mockCalls: Call[] = [
	{
		id: "call-001",
		leadId: "lead-001",
		leadName: "María Torres",
		leadPhone: "+57 300 123 4567",
		agentName: "Agente CO-01",
		startedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
		endedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
		durationMinutes: 10,
		result: "interesado",
		notes: "Solicita más información sobre instalación.",
	},
	{
		id: "call-002",
		leadId: "lead-002",
		leadName: "José Martínez",
		leadPhone: "+52 55 2345 6789",
		agentName: "Agente MX-03",
		startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
		endedAt: new Date(Date.now() - 1000 * 60 * 82).toISOString(),
		durationMinutes: 8,
		result: "no_contesta",
		notes: "No respondió, reintentar mañana.",
	},
	{
		id: "call-003",
		leadId: "lead-003",
		leadName: "Carolina Ríos",
		leadPhone: "+56 9 8123 4567",
		agentName: "Agente CL-02",
		startedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
		endedAt: new Date(Date.now() - 1000 * 60 * 138).toISOString(),
		durationMinutes: 12,
		result: "venta",
		notes: "Venta cerrada, enviar garantía.",
	},
];

export const listCalls = async (): Promise<Call[]> => {
	return [...mockCalls];
};

export const listCallsByLead = async (leadId: string): Promise<Call[]> => {
	return mockCalls.filter((call) => call.leadId === leadId);
};

export const getCallById = async (callId: string): Promise<Call | null> => {
	return mockCalls.find((call) => call.id === callId) ?? null;
};

export const createCall = async (payload: Omit<Call, "id">): Promise<Call> => {
	const newCall: Call = {
		...payload,
		id: `call-${Math.random().toString(36).slice(2, 7)}`,
	};
	mockCalls.push(newCall);
	return newCall;
};

export const registerCallResult = async (
	callId: string,
	result: CallResult,
	notes: string
): Promise<Call> => {
	const call = mockCalls.find((item) => item.id === callId);
	if (!call) {
		throw new Error("Llamada no encontrada");
	}
	call.result = result;
	call.notes = notes;
	call.endedAt = new Date().toISOString();
	call.durationMinutes = Math.max(1, call.durationMinutes);
	return call;
};
