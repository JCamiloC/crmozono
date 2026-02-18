import { createSupabaseAdminClient } from "../../lib/supabase/admin";

type RuntimeConfigRow = {
  key: string;
  value: unknown;
};

type LeadRow = {
  id: string;
  agente_id: string;
  estado_actual: string;
  created_at: string;
};

type TaskCancelRow = {
  id: string;
};

type SlaCloseRuntimeConfig = {
  enabled: boolean;
  days: number;
  statuses: string[];
  targetStatus: string;
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

export const getSlaCloseRuntimeConfig = async (): Promise<SlaCloseRuntimeConfig> => {
  const supabase = createSupabaseAdminClient();
  const defaults: SlaCloseRuntimeConfig = {
    enabled: true,
    days: 5,
    statuses: ["nuevo", "contactado", "seguimiento", "llamada"],
    targetStatus: "cerrado_tiempo",
  };

  const { data, error } = await supabase
    .from("whatsapp_runtime_config")
    .select("key, value")
    .in("key", [
      "automations_sla_close_enabled",
      "automations_sla_close_days",
      "automations_sla_close_statuses",
      "automations_sla_close_target_status",
    ]);

  if (error || !data) {
    return defaults;
  }

  const rows = data as RuntimeConfigRow[];
  const map = new Map<string, unknown>(rows.map((row) => [row.key, row.value]));

  return {
    enabled: toBoolean(map.get("automations_sla_close_enabled"), defaults.enabled),
    days: Math.max(1, toNumber(map.get("automations_sla_close_days"), defaults.days)),
    statuses: toStringArray(map.get("automations_sla_close_statuses"), defaults.statuses),
    targetStatus: toStringValue(map.get("automations_sla_close_target_status"), defaults.targetStatus),
  };
};

const cancelPendingTasksForLead = async (leadId: string, actorId: string): Promise<number> => {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      estado: "cancelada",
      fecha_completada: null,
    })
    .eq("lead_id", leadId)
    .eq("estado", "pendiente")
    .select("id");

  if (error || !data) {
    return 0;
  }

  const canceled = data as TaskCancelRow[];
  if (canceled.length === 0) {
    return 0;
  }

  await supabase.from("task_history").insert(
    canceled.map((task) => ({
      task_id: task.id,
      estado: "cancelada",
      fecha: now,
      usuario_id: actorId,
      comentario: "Cancelada automáticamente por cierre SLA",
    }))
  );

  return canceled.length;
};

export const runSlaCloseAutomation = async () => {
  const config = await getSlaCloseRuntimeConfig();
  if (!config.enabled) {
    return {
      enabled: false,
      evaluatedLeads: 0,
      closedLeads: 0,
      canceledTasks: 0,
      skippedLeads: 0,
      reason: "automation_disabled",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("id, agente_id, estado_actual, created_at")
    .in("estado_actual", config.statuses);

  if (leadsError || !leadsData) {
    throw new Error(leadsError?.message ?? "No se pudieron cargar leads para SLA");
  }

  const leads = leadsData as LeadRow[];
  const now = Date.now();
  const deadlineMs = config.days * 24 * 60 * 60 * 1000;

  let closedLeads = 0;
  let canceledTasks = 0;
  let skippedLeads = 0;

  for (const lead of leads) {
    const createdAtMs = new Date(lead.created_at).getTime();
    if (Number.isNaN(createdAtMs) || now - createdAtMs < deadlineMs) {
      skippedLeads += 1;
      continue;
    }

    const timestamp = new Date().toISOString();
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update({
        estado_actual: config.targetStatus,
        fecha_estado: timestamp,
        updated_at: timestamp,
      })
      .eq("id", lead.id)
      .in("estado_actual", config.statuses)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedLead) {
      skippedLeads += 1;
      continue;
    }

    await supabase.from("lead_status_history").insert({
      lead_id: lead.id,
      estado: config.targetStatus,
      fecha: timestamp,
      usuario_id: lead.agente_id,
    });

    await supabase.from("audit_logs").insert({
      action: "lead_status_change",
      actor: "Automatización",
      entity_id: lead.id,
      entity_type: "lead",
      summary: `Lead cerrado automáticamente por SLA (${config.days} días)`,
    });

    canceledTasks += await cancelPendingTasksForLead(lead.id, lead.agente_id);
    closedLeads += 1;
  }

  return {
    enabled: true,
    evaluatedLeads: leads.length,
    closedLeads,
    canceledTasks,
    skippedLeads,
    days: config.days,
    statuses: config.statuses,
    targetStatus: config.targetStatus,
  };
};