import { createSupabaseAdminClient } from "../../lib/supabase/admin";

type RuntimeConfigRow = {
  key: string;
  value: unknown;
  enabled: boolean;
};

type LeadRow = {
  id: string;
  nombre: string | null;
  agente_id: string;
  estado_actual: string;
};

type ConversationRow = {
  id: string;
  lead_id: string;
};

type MessageRow = {
  id: string;
  created_at: string;
};

type TaskRow = {
  id: string;
};

type NoResponseRuntimeConfig = {
  enabled: boolean;
  minutes: number;
  statuses: string[];
  taskType: string;
  taskTitle: string;
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return fallback;
};

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toStringValue = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

const toStringArray = (value: unknown, fallback: string[]): string[] => {
  if (Array.isArray(value)) {
    const parsed = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    if (parsed.length > 0) {
      return parsed;
    }
  }
  return fallback;
};

export const getNoResponseRuntimeConfig = async (): Promise<NoResponseRuntimeConfig> => {
  const supabase = createSupabaseAdminClient();

  const defaults: NoResponseRuntimeConfig = {
    enabled: true,
    minutes: 10,
    statuses: ["contactado", "seguimiento"],
    taskType: "seguimiento_automatico",
    taskTitle: "Seguimiento automático por no respuesta",
  };

  const { data, error } = await supabase
    .from("whatsapp_runtime_config")
    .select("key, value, enabled")
    .eq("enabled", true)
    .in("key", [
      "automations_no_response_enabled",
      "automations_no_response_minutes",
      "automations_no_response_statuses",
      "automations_no_response_task_type",
      "automations_no_response_task_title",
    ]);

  if (error || !data) {
    return defaults;
  }

  const rows = data as RuntimeConfigRow[];
  const map = new Map<string, unknown>(rows.map((row) => [row.key, row.value]));

  return {
    enabled: toBoolean(map.get("automations_no_response_enabled"), defaults.enabled),
    minutes: Math.max(1, toNumber(map.get("automations_no_response_minutes"), defaults.minutes)),
    statuses: toStringArray(map.get("automations_no_response_statuses"), defaults.statuses),
    taskType: toStringValue(map.get("automations_no_response_task_type"), defaults.taskType),
    taskTitle: toStringValue(map.get("automations_no_response_task_title"), defaults.taskTitle),
  };
};

const hasInboundAfter = async (
  conversationId: string,
  outboundCreatedAt: string
): Promise<boolean> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .gt("created_at", outboundCreatedAt)
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
};

const hasPendingTaskForLead = async (leadId: string): Promise<boolean> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("lead_id", leadId)
    .eq("estado", "pendiente")
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data as TaskRow | null);
};

const createNoResponseTask = async (
  lead: LeadRow,
  taskType: string,
  taskTitle: string,
  triggerMinutes: number,
  outboundAt: string
) : Promise<boolean> => {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const finalTitle = `${taskTitle} (${lead.nombre ?? "Lead"})`;
  const description = `Lead sin respuesta ${triggerMinutes} minutos después del último mensaje outbound (${new Date(
    outboundAt
  ).toLocaleString("es-CO")}).`;

  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .insert({
      lead_id: lead.id,
      agente_id: lead.agente_id,
      titulo: finalTitle,
      tipo_tarea: taskType,
      descripcion: description,
      fecha_programada: now,
      estado: "pendiente",
    })
    .select("id")
    .single();

  if (taskError?.code === "23505") {
    return false;
  }

  if (taskError || !taskData) {
    throw new Error(taskError?.message ?? "No se pudo crear tarea automática");
  }

  const taskId = (taskData as { id: string }).id;

  await supabase.from("task_history").insert({
    task_id: taskId,
    estado: "pendiente",
    fecha: now,
    usuario_id: lead.agente_id,
    comentario: `Creación automática por no respuesta (${triggerMinutes} min)`,
  });

  await supabase.from("audit_logs").insert({
    action: "task_created",
    actor: "Automatización",
    entity_id: taskId,
    entity_type: "task",
    summary: `Tarea automática por no respuesta para lead ${lead.id}`,
  });

  return true;
};

export const runNoResponseAutomation = async () => {
  const config = await getNoResponseRuntimeConfig();
  if (!config.enabled) {
    return {
      enabled: false,
      evaluatedLeads: 0,
      createdTasks: 0,
      skippedLeads: 0,
      reason: "automation_disabled",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("id, nombre, agente_id, estado_actual")
    .in("estado_actual", config.statuses);

  if (leadsError || !leadsData) {
    throw new Error(leadsError?.message ?? "No se pudieron cargar leads para automatización");
  }

  const leads = leadsData as LeadRow[];
  let createdTasks = 0;
  let skippedLeads = 0;

  for (const lead of leads) {
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("id, lead_id")
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (conversationError || !conversationData) {
      skippedLeads += 1;
      continue;
    }

    const conversation = conversationData as ConversationRow;

    const { data: outboundData, error: outboundError } = await supabase
      .from("messages")
      .select("id, created_at")
      .eq("conversation_id", conversation.id)
      .eq("direction", "outbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (outboundError || !outboundData) {
      skippedLeads += 1;
      continue;
    }

    const lastOutbound = outboundData as MessageRow;
    const outboundMs = new Date(lastOutbound.created_at).getTime();
    if (Number.isNaN(outboundMs)) {
      skippedLeads += 1;
      continue;
    }

    const elapsedMinutes = (Date.now() - outboundMs) / 1000 / 60;
    if (elapsedMinutes < config.minutes) {
      skippedLeads += 1;
      continue;
    }

    const responded = await hasInboundAfter(conversation.id, lastOutbound.created_at);
    if (responded) {
      skippedLeads += 1;
      continue;
    }

    const hasPendingTask = await hasPendingTaskForLead(lead.id);
    if (hasPendingTask) {
      skippedLeads += 1;
      continue;
    }

    const created = await createNoResponseTask(
      lead,
      config.taskType,
      config.taskTitle,
      config.minutes,
      lastOutbound.created_at
    );
    if (created) {
      createdTasks += 1;
    } else {
      skippedLeads += 1;
    }
  }

  return {
    enabled: true,
    evaluatedLeads: leads.length,
    createdTasks,
    skippedLeads,
    minutes: config.minutes,
    statuses: config.statuses,
  };
};