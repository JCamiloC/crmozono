import type { Conversation, Message, MessageTemplate } from "../types";

const mockConversations: Conversation[] = [
	{
		id: "conv-001",
		leadId: "lead-001",
		leadName: "María Torres",
		leadPhone: "+57 300 123 4567",
		initials: "MT",
		lastMessage: "Gracias, esperaré el seguimiento.",
		updatedAt: new Date().toISOString(),
	},
	{
		id: "conv-002",
		leadId: "lead-002",
		leadName: "José Martínez",
		leadPhone: "+52 55 2345 6789",
		initials: "JM",
		lastMessage: "¿Me puedes enviar la propuesta?",
		updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
	},
	{
		id: "conv-003",
		leadId: "lead-003",
		leadName: "Carolina Ríos",
		leadPhone: "+56 9 8123 4567",
		initials: "CR",
		lastMessage: "Listo, agendemos una llamada.",
		updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
	},
];

const mockMessages: Message[] = [
	{
		id: "msg-001",
		conversationId: "conv-001",
		body: "Hola María, gracias por tu interés en SuperOzono.",
		direction: "outbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
	},
	{
		id: "msg-002",
		conversationId: "conv-001",
		body: "¿Quieres que te enviemos el plan de instalación?",
		direction: "outbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
	},
	{
		id: "msg-003",
		conversationId: "conv-001",
		body: "Gracias, esperaré el seguimiento.",
		direction: "inbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
	},
	{
		id: "msg-004",
		conversationId: "conv-002",
		body: "Hola José, te comparto la propuesta en breve.",
		direction: "outbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
	},
	{
		id: "msg-005",
		conversationId: "conv-002",
		body: "¿Me puedes enviar la propuesta?",
		direction: "inbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
	},
	{
		id: "msg-006",
		conversationId: "conv-003",
		body: "¿Agendamos una llamada esta semana?",
		direction: "outbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
	},
	{
		id: "msg-007",
		conversationId: "conv-003",
		body: "Listo, agendemos una llamada.",
		direction: "inbound",
		createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
	},
];

const mockTemplates: MessageTemplate[] = [
	{
		id: "tpl-001",
		name: "Bienvenida",
		preview: "Hola {{nombre}}, gracias por contactarnos...",
		body: "Hola {{nombre}}, gracias por contactarnos en SuperOzono. ¿En qué podemos ayudarte?",
	},
	{
		id: "tpl-002",
		name: "Seguimiento",
		preview: "Queremos saber si pudiste revisar...",
		body: "Hola {{nombre}}, queremos saber si pudiste revisar la propuesta. Quedamos atentos.",
	},
	{
		id: "tpl-003",
		name: "Garantía",
		preview: "Gracias por tu compra, te recordamos...",
		body: "Gracias por tu compra. Recuerda que tu garantía está activa y nuestro equipo te acompaña.",
	},
];

export const listConversations = async (): Promise<Conversation[]> => {
	return [...mockConversations];
};

export const getConversationById = async (
	conversationId: string
): Promise<Conversation | null> => {
	return mockConversations.find((conversation) => conversation.id === conversationId) ?? null;
};

export const listMessages = async (conversationId: string): Promise<Message[]> => {
	return mockMessages.filter((message) => message.conversationId === conversationId);
};

export const sendMessage = async (
	conversationId: string,
	body: string
): Promise<Message> => {
	const newMessage: Message = {
		id: `msg-${Math.random().toString(36).slice(2, 7)}`,
		conversationId,
		body,
		direction: "outbound",
		createdAt: new Date().toISOString(),
	};
	mockMessages.push(newMessage);
	const conversation = mockConversations.find((item) => item.id === conversationId);
	if (conversation) {
		conversation.lastMessage = body;
		conversation.updatedAt = newMessage.createdAt;
	}
	return newMessage;
};

export const listTemplates = async (): Promise<MessageTemplate[]> => {
	return [...mockTemplates];
};
