export type Role = "superadmin" | "admin" | "agente";

export type UserProfile = {
  id: string;
  email: string | null;
  role: Role;
  countryId: string | null;
  createdAt: string;
};

export type LeadStatus =
  | "nuevo"
  | "contactado"
  | "seguimiento"
  | "llamada"
  | "venta"
  | "no_interesado"
  | "cerrado_tiempo";

export type Lead = {
  id: string;
  nombre: string | null;
  telefono: string;
  pais: string;
  administradorId: string;
  agenteId: string;
  estadoActual: LeadStatus;
  fechaEstado: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadStatusHistory = {
  id: string;
  leadId: string;
  estado: LeadStatus;
  fecha: string;
  usuarioId: string;
};

export type TaskStatus = "pendiente" | "completada" | "vencida" | "cancelada";

export type Task = {
  id: string;
  leadId: string;
  leadNombre: string;
  agenteId: string;
  titulo: string;
  tipoTarea: string;
  descripcion: string | null;
  fechaProgramada: string;
  estado: TaskStatus;
  fechaCreacion: string;
  fechaCompletada: string | null;
};

export type TaskHistory = {
  id: string;
  taskId: string;
  estado: TaskStatus;
  fecha: string;
  usuarioId: string;
  comentario: string | null;
};

export type Conversation = {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  initials: string;
  lastMessage: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  body: string;
  direction: "inbound" | "outbound";
  createdAt: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  preview: string;
  body: string;
  sendMode?: "auto" | "text" | "template";
  providerTemplateName?: string | null;
  providerLanguageCode?: string | null;
  defaultVariables?: Record<string, string>;
};

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "completed"
  | "paused";

export type Campaign = {
  id: string;
  name: string;
  segment: string;
  status: CampaignStatus;
  scheduledAt: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  deliveryRate: number;
  messagePreview: string;
};

export type CampaignLog = {
  id: string;
  campaignId: string;
  phone: string;
  status: "enviado" | "fallido" | "bloqueado";
};

export type Country = {
  id: string;
  name: string;
  code: string;
};

export type RoleSummary = {
  id: string;
  name: Role;
  description: string;
  permissions: string[];
};

export type SecuritySummary = {
  lastAuditAt: string;
  notes: string[];
};

export type UserAssignment = {
  id: string;
  email: string | null;
  role: Role;
  countryId: string | null;
  countryName: string | null;
  countryCode: string | null;
  createdAt: string;
};

export type CallResult =
  | "venta"
  | "interesado"
  | "no_interesado"
  | "no_contesta"
  | "cortada"
  | "numero_incorrecto";

export type Call = {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  agentName: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  result: CallResult;
  notes: string | null;
};

export type AuditAction =
  | "lead_status_change"
  | "lead_reassign"
  | "task_status_change"
  | "task_created"
  | "campaign_created"
  | "campaign_send_simulated"
  | "message_sent"
  | "call_result_registered";

export type AuditLog = {
  id: string;
  action: AuditAction;
  actor: string;
  entityId: string;
  entityType: string;
  createdAt: string;
  summary: string;
};
