import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type {
  Country,
  MessageTemplate,
  Role,
  RoleSummary,
  SecuritySummary,
  UserAssignment,
} from "../types";

type RoleRow = {
  id: string;
  name: string;
};

type CountryRow = {
  id: string;
  name: string;
  code: string;
};

type AssignmentRow = {
  id: string;
  email: string | null;
  role: string;
  country_id: string | null;
  created_at: string;
  countries?: CountryRow | CountryRow[] | null;
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

type RuntimeConfigRow = {
  key: string;
  value: unknown;
};

export type NoResponseAutomationConfig = {
  enabled: boolean;
  minutes: number;
};

export type SlaCloseAutomationConfig = {
  enabled: boolean;
  days: number;
};

const roleCatalog: Record<Role, { description: string; permissions: string[] }> = {
  superadmin: {
    description: "Control global del sistema y configuraciones generales.",
    permissions: ["Todos los países", "Gestión de usuarios", "Auditoría"],
  },
  admin: {
    description: "Gestión operativa del país asignado.",
    permissions: ["Leads del país", "Campañas locales", "Métricas"],
  },
  agente: {
    description: "Operación diaria sobre leads asignados.",
    permissions: ["Leads asignados", "Tareas", "Mensajes manuales"],
  },
};

const toRole = (value: string): Role => {
  if (value === "superadmin" || value === "admin" || value === "agente") {
    return value;
  }
  return "agente";
};

const resolveCountry = (country: AssignmentRow["countries"]) => {
  if (!country) {
    return { countryName: null, countryCode: null };
  }
  if (Array.isArray(country)) {
    return {
      countryName: country[0]?.name ?? null,
      countryCode: country[0]?.code ?? null,
    };
  }
  return {
    countryName: country.name,
    countryCode: country.code,
  };
};

export const listRoles = async (): Promise<RoleSummary[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("roles").select("id, name").order("name", {
    ascending: true,
  });

  if (error || !data) {
    console.error("[config] listRoles error", error);
    return Object.entries(roleCatalog).map(([name, catalog], index) => ({
      id: `fallback-role-${index + 1}`,
      name: name as Role,
      description: catalog.description,
      permissions: catalog.permissions,
    }));
  }

  return (data as RoleRow[]).map((row) => {
    const role = toRole(row.name);
    return {
      id: row.id,
      name: role,
      description: roleCatalog[role].description,
      permissions: roleCatalog[role].permissions,
    };
  });
};

export const listCountries = async (): Promise<Country[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("countries")
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("[config] listCountries error", error);
    return [];
  }

  return data as Country[];
};

export const createCountry = async (name: string, code: string): Promise<Country> => {
  const supabase = createSupabaseBrowserClient();
  const normalizedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedName || !normalizedCode) {
    throw new Error("Nombre y código son obligatorios");
  }

  const { data, error } = await supabase
    .from("countries")
    .insert({ name: normalizedName, code: normalizedCode })
    .select("id, name, code")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el país");
  }

  return data as Country;
};

export const updateCountry = async (
  countryId: string,
  payload: { name: string; code: string }
): Promise<Country> => {
  const supabase = createSupabaseBrowserClient();
  const normalizedName = payload.name.trim();
  const normalizedCode = payload.code.trim().toUpperCase();

  if (!normalizedName || !normalizedCode) {
    throw new Error("Nombre y código son obligatorios");
  }

  const { data, error } = await supabase
    .from("countries")
    .update({ name: normalizedName, code: normalizedCode })
    .eq("id", countryId)
    .select("id, name, code")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar el país");
  }

  return data as Country;
};

export const deleteCountry = async (countryId: string): Promise<void> => {
  const supabase = createSupabaseBrowserClient();

  const { data: countryData, error: countryError } = await supabase
    .from("countries")
    .select("id, name")
    .eq("id", countryId)
    .maybeSingle();

  if (countryError || !countryData) {
    throw new Error("País no encontrado");
  }

  const countryName = (countryData as { id: string; name: string }).name;

  const { count: profilesCount, error: profilesError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("country_id", countryId);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if ((profilesCount ?? 0) > 0) {
    throw new Error("No se puede eliminar: el país está asignado a usuarios");
  }

  const { count: leadsCount, error: leadsError } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("pais", countryName);

  if (leadsError) {
    throw new Error(leadsError.message);
  }

  if ((leadsCount ?? 0) > 0) {
    throw new Error("No se puede eliminar: existen leads asociados a este país");
  }

  const { error: deleteError } = await supabase.from("countries").delete().eq("id", countryId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
};

const mapMessageTemplateRow = (row: MessageTemplateRow): MessageTemplate => {
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

export const listMessageTemplatesForConfig = async (): Promise<MessageTemplate[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("message_templates").select("*").order("name", {
    ascending: true,
  });

  if (error || !data) {
    console.error("[config] listMessageTemplatesForConfig error", error);
    return [];
  }

  return (data as MessageTemplateRow[]).map(mapMessageTemplateRow);
};

export const createMessageTemplateForConfig = async (payload: {
  name: string;
  preview: string;
  body: string;
}): Promise<MessageTemplate> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      name: payload.name.trim(),
      preview: payload.preview.trim(),
      body: payload.body.trim(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la plantilla");
  }

  return mapMessageTemplateRow(data as MessageTemplateRow);
};

export const updateMessageTemplateForConfig = async (
  templateId: string,
  payload: {
    name: string;
    preview: string;
    body: string;
    sendMode: "auto" | "text" | "template";
    providerTemplateName: string | null;
    providerLanguageCode: string | null;
    defaultVariables: Record<string, string>;
  }
): Promise<void> => {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("message_templates")
    .update({
      name: payload.name.trim(),
      preview: payload.preview.trim(),
      body: payload.body.trim(),
      send_mode: payload.sendMode,
      provider_template_name: payload.providerTemplateName,
      provider_language_code: payload.providerLanguageCode,
      variable_defaults: payload.defaultVariables,
    })
    .eq("id", templateId);

  if (error) {
    throw new Error(error.message);
  }
};

export const deleteMessageTemplateForConfig = async (templateId: string): Promise<void> => {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", templateId);

  if (error) {
    throw new Error(error.message);
  }
};

export const getNoResponseAutomationConfig = async (): Promise<NoResponseAutomationConfig> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("whatsapp_runtime_config")
    .select("key, value")
    .in("key", ["automations_no_response_enabled", "automations_no_response_minutes"]);

  if (error || !data) {
    return { enabled: true, minutes: 10 };
  }

  const rows = data as RuntimeConfigRow[];
  const map = new Map<string, unknown>(rows.map((row) => [row.key, row.value]));

  const enabledValue = map.get("automations_no_response_enabled");
  const minutesValue = map.get("automations_no_response_minutes");

  const enabled =
    typeof enabledValue === "boolean"
      ? enabledValue
      : typeof enabledValue === "string"
        ? enabledValue.toLowerCase() === "true"
        : true;

  const parsedMinutes =
    typeof minutesValue === "number"
      ? minutesValue
      : typeof minutesValue === "string"
        ? Number(minutesValue)
        : 10;

  return {
    enabled,
    minutes: Number.isFinite(parsedMinutes) ? Math.max(1, parsedMinutes) : 10,
  };
};

export const updateNoResponseAutomationConfig = async (
  config: NoResponseAutomationConfig
): Promise<void> => {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.from("whatsapp_runtime_config").upsert(
    [
      {
        key: "automations_no_response_enabled",
        value: config.enabled,
        enabled: true,
        description: "Activa automatización por no respuesta",
      },
      {
        key: "automations_no_response_minutes",
        value: Math.max(1, config.minutes),
        enabled: true,
        description: "Minutos para disparar tarea por no respuesta",
      },
    ],
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const runNoResponseAutomationNow = async (): Promise<{
  enabled: boolean;
  evaluatedLeads: number;
  createdTasks: number;
  skippedLeads: number;
}> => {
  const response = await fetch("/api/automations/no-response?target=no-response", {
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string;
        result?: {
          enabled: boolean;
          evaluatedLeads: number;
          createdTasks: number;
          skippedLeads: number;
        };
      }
    | null;

  if (!response.ok || !payload?.result) {
    throw new Error(payload?.error ?? "No se pudo ejecutar automatización");
  }

  return payload.result;
};

export const getSlaCloseAutomationConfig = async (): Promise<SlaCloseAutomationConfig> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("whatsapp_runtime_config")
    .select("key, value")
    .in("key", ["automations_sla_close_enabled", "automations_sla_close_days"]);

  if (error || !data) {
    return { enabled: true, days: 5 };
  }

  const rows = data as RuntimeConfigRow[];
  const map = new Map<string, unknown>(rows.map((row) => [row.key, row.value]));

  const enabledValue = map.get("automations_sla_close_enabled");
  const daysValue = map.get("automations_sla_close_days");

  const enabled =
    typeof enabledValue === "boolean"
      ? enabledValue
      : typeof enabledValue === "string"
        ? enabledValue.toLowerCase() === "true"
        : true;

  const parsedDays =
    typeof daysValue === "number"
      ? daysValue
      : typeof daysValue === "string"
        ? Number(daysValue)
        : 5;

  return {
    enabled,
    days: Number.isFinite(parsedDays) ? Math.max(1, parsedDays) : 5,
  };
};

export const updateSlaCloseAutomationConfig = async (
  config: SlaCloseAutomationConfig
): Promise<void> => {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.from("whatsapp_runtime_config").upsert(
    [
      {
        key: "automations_sla_close_enabled",
        value: config.enabled,
        enabled: true,
        description: "Activa cierre automático por SLA",
      },
      {
        key: "automations_sla_close_days",
        value: Math.max(1, config.days),
        enabled: true,
        description: "Días para cierre automático de lead por SLA",
      },
    ],
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const runSlaCloseAutomationNow = async (): Promise<{
  enabled: boolean;
  evaluatedLeads: number;
  closedLeads: number;
  canceledTasks: number;
  skippedLeads: number;
}> => {
  const response = await fetch("/api/automations/no-response?target=sla-close", {
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string;
        result?: {
          enabled: boolean;
          evaluatedLeads: number;
          closedLeads: number;
          canceledTasks: number;
          skippedLeads: number;
        };
      }
    | null;

  if (!response.ok || !payload?.result) {
    throw new Error(payload?.error ?? "No se pudo ejecutar cierre SLA");
  }

  return payload.result;
};

export const listUserAssignments = async (): Promise<UserAssignment[]> => {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, country_id, created_at, countries(id, name, code)")
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[config] listUserAssignments error", error);
    return [];
  }

  return (data as AssignmentRow[]).map((row) => {
    const countryInfo = resolveCountry(row.countries);
    return {
      id: row.id,
      email: row.email,
      role: toRole(row.role),
      countryId: row.country_id,
      countryName: countryInfo.countryName,
      countryCode: countryInfo.countryCode,
      createdAt: row.created_at,
    };
  });
};

export const updateUserAssignment = async (
  userId: string,
  role: Role,
  countryId: string | null
): Promise<void> => {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role, country_id: countryId })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

export const getSecuritySummary = async (): Promise<SecuritySummary> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[config] getSecuritySummary error", error);
  }

  return {
    lastAuditAt: data?.created_at ?? new Date().toISOString(),
    notes: [
      "RLS pendiente de activación final (fase de hardening).",
      "Asignación por país activa desde Configuración.",
    ],
  };
};
