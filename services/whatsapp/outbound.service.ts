import { createSupabaseAdminClient } from "../../lib/supabase/admin";

type SendMode = "auto" | "text" | "template";

type SendOutboundMessageInput = {
  conversationId: string;
  body: string;
  templateId?: string;
  customVariables?: Record<string, string>;
  forceMode?: SendMode;
};

type ConversationContextRow = {
  id: string;
  leads?:
    | {
        id?: string;
        nombre?: string | null;
        telefono?: string | null;
        pais?: string | null;
        estado_actual?: string | null;
      }
    | Array<{
        id?: string;
        nombre?: string | null;
        telefono?: string | null;
        pais?: string | null;
        estado_actual?: string | null;
      }>
    | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  body: string;
  direction: string;
  created_at: string;
};

type RuntimeConfigRow = {
  key: string;
  value: unknown;
  enabled: boolean;
};

type RuntimeConfig = {
  graphApiVersion: string;
  defaultSendMode: SendMode;
  conversationWindowHours: number;
  allowTextOutsideWindow: boolean;
  requireTemplateOutsideWindow: boolean;
  defaultTemplateLanguageCode: string;
  dryRun: boolean;
};

type TemplateRecord = {
  id: string;
  name: string;
  body: string;
  send_mode?: string | null;
  provider_template_name?: string | null;
  provider_language_code?: string | null;
  variable_defaults?: Record<string, unknown> | null;
};

type ConversationContext = {
  conversationId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCountry: string;
  leadStatus: string;
  lastInboundAt: string | null;
};

type ProviderResult = {
  success: boolean;
  providerMessageId: string | null;
  providerPayload: unknown;
  providerError: string | null;
};

const normalizePhone = (value: string): string => value.replace(/[^\d]/g, "");

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") {
      return true;
    }
    if (lowered === "false") {
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

const toSendMode = (value: unknown, fallback: SendMode): SendMode => {
  if (value === "auto" || value === "text" || value === "template") {
    return value;
  }
  return fallback;
};

const getRuntimeConfig = async (): Promise<RuntimeConfig> => {
  const supabase = createSupabaseAdminClient();

  const defaults: RuntimeConfig = {
    graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? "v22.0",
    defaultSendMode: "auto",
    conversationWindowHours: 24,
    allowTextOutsideWindow: false,
    requireTemplateOutsideWindow: true,
    defaultTemplateLanguageCode: "es",
    dryRun: false,
  };

  const { data, error } = await supabase
    .from("whatsapp_runtime_config")
    .select("key, value, enabled")
    .eq("enabled", true);

  if (error || !data) {
    return defaults;
  }

  const records = data as RuntimeConfigRow[];
  const map = new Map<string, unknown>(records.map((row) => [row.key, row.value]));

  return {
    graphApiVersion: toStringValue(map.get("graph_api_version"), defaults.graphApiVersion),
    defaultSendMode: toSendMode(map.get("outbound_default_mode"), defaults.defaultSendMode),
    conversationWindowHours: toNumber(
      map.get("outbound_conversation_window_hours"),
      defaults.conversationWindowHours
    ),
    allowTextOutsideWindow: toBoolean(
      map.get("outbound_allow_text_outside_window"),
      defaults.allowTextOutsideWindow
    ),
    requireTemplateOutsideWindow: toBoolean(
      map.get("outbound_require_template_outside_window"),
      defaults.requireTemplateOutsideWindow
    ),
    defaultTemplateLanguageCode: toStringValue(
      map.get("outbound_default_template_language"),
      defaults.defaultTemplateLanguageCode
    ),
    dryRun: toBoolean(map.get("outbound_dry_run"), defaults.dryRun),
  };
};

const mapConversationContext = (row: ConversationContextRow): ConversationContext | null => {
  const leads = row.leads;
  const leadData = Array.isArray(leads) ? leads[0] : leads;

  if (!leadData?.id || !leadData.telefono) {
    return null;
  }

  return {
    conversationId: row.id,
    leadId: leadData.id,
    leadName: leadData.nombre?.trim() || "cliente",
    leadPhone: normalizePhone(leadData.telefono),
    leadCountry: leadData.pais?.trim() || "",
    leadStatus: leadData.estado_actual?.trim() || "",
    lastInboundAt: null,
  };
};

const getConversationContext = async (conversationId: string): Promise<ConversationContext> => {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, leads(id, nombre, telefono, pais, estado_actual)")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("No se encontró la conversación");
  }

  const context = mapConversationContext(data as ConversationContextRow);
  if (!context) {
    throw new Error("La conversación no tiene un lead con teléfono válido");
  }

  const { data: inboundData } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inboundData && typeof (inboundData as { created_at?: unknown }).created_at === "string") {
    context.lastInboundAt = (inboundData as { created_at: string }).created_at;
  }

  return context;
};

const getTemplateById = async (templateId: string): Promise<TemplateRecord | null> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    body: String(row.body ?? ""),
    send_mode: typeof row.send_mode === "string" ? row.send_mode : null,
    provider_template_name:
      typeof row.provider_template_name === "string" ? row.provider_template_name : null,
    provider_language_code:
      typeof row.provider_language_code === "string" ? row.provider_language_code : null,
    variable_defaults:
      row.variable_defaults && typeof row.variable_defaults === "object"
        ? (row.variable_defaults as Record<string, unknown>)
        : null,
  };
};

const extractPlaceholderKeys = (text: string): string[] => {
  const keys: string[] = [];
  const seen = new Set<string>();
  const regex = /\{\{\s*([^{}\[\]]+)\s*\}\}|\[\[\s*([^{}\[\]]+)\s*\]\]/g;
  let match: RegExpExecArray | null;

  match = regex.exec(text);
  while (match) {
    const key = (match[1] ?? match[2] ?? "").trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    match = regex.exec(text);
  }

  return keys;
};

const interpolateVariables = (text: string, variables: Record<string, string>): string => {
  return text.replace(/\{\{\s*([^{}\[\]]+)\s*\}\}|\[\[\s*([^{}\[\]]+)\s*\]\]/g, (_full, a, b) => {
    const key = String(a ?? b ?? "").trim().toLowerCase();
    return variables[key] ?? _full;
  });
};

const buildVariables = (
  context: ConversationContext,
  template: TemplateRecord | null,
  customVariables: Record<string, string>
): Record<string, string> => {
  const firstName = context.leadName.split(" ").filter(Boolean)[0] ?? context.leadName;
  const today = new Date().toISOString().slice(0, 10);

  const baseVariables: Record<string, string> = {
    nombre: context.leadName,
    first_name: firstName,
    telefono: context.leadPhone,
    pais: context.leadCountry,
    estado: context.leadStatus,
    fecha: today,
  };

  const templateDefaults: Record<string, string> = {};
  if (template?.variable_defaults) {
    for (const [key, value] of Object.entries(template.variable_defaults)) {
      if (typeof value === "string") {
        templateDefaults[key.trim().toLowerCase()] = value;
      }
    }
  }

  const normalizedCustomVariables: Record<string, string> = {};
  for (const [key, value] of Object.entries(customVariables)) {
    normalizedCustomVariables[key.trim().toLowerCase()] = value;
  }

  return {
    ...baseVariables,
    ...templateDefaults,
    ...normalizedCustomVariables,
  };
};

const isConversationWindowOpen = (lastInboundAt: string | null, windowHours: number): boolean => {
  if (!lastInboundAt) {
    return false;
  }
  const inboundTime = new Date(lastInboundAt).getTime();
  if (Number.isNaN(inboundTime)) {
    return false;
  }
  const now = Date.now();
  const diffHours = (now - inboundTime) / 1000 / 60 / 60;
  return diffHours <= windowHours;
};

const decideMode = (
  inputMode: SendMode | undefined,
  templateMode: string | null | undefined,
  runtime: RuntimeConfig,
  context: ConversationContext,
  hasProviderTemplate: boolean
): SendMode => {
  const preferred = inputMode ?? toSendMode(templateMode, runtime.defaultSendMode);

  if (preferred === "text" || preferred === "template") {
    return preferred;
  }

  const insideWindow = isConversationWindowOpen(
    context.lastInboundAt,
    runtime.conversationWindowHours
  );

  if (insideWindow) {
    return "text";
  }

  if (hasProviderTemplate) {
    return "template";
  }

  if (runtime.allowTextOutsideWindow && !runtime.requireTemplateOutsideWindow) {
    return "text";
  }

  return "template";
};

const sendTextMessage = async (
  phone: string,
  text: string,
  accessToken: string,
  phoneNumberId: string,
  graphApiVersion: string
): Promise<ProviderResult> => {
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    }
  );

  const providerPayload = (await response.json().catch(() => null)) as
    | {
        messages?: Array<{ id?: string }>;
        error?: { message?: string; error_user_msg?: string };
      }
    | null;

  if (!response.ok) {
    return {
      success: false,
      providerMessageId: null,
      providerPayload,
      providerError:
        providerPayload?.error?.error_user_msg ??
        providerPayload?.error?.message ??
        "No se pudo enviar mensaje de texto",
    };
  }

  return {
    success: true,
    providerMessageId: providerPayload?.messages?.[0]?.id ?? null,
    providerPayload,
    providerError: null,
  };
};

const sendTemplateMessage = async (
  phone: string,
  templateName: string,
  languageCode: string,
  orderedVariableValues: string[],
  accessToken: string,
  phoneNumberId: string,
  graphApiVersion: string
): Promise<ProviderResult> => {
  const bodyParameters = orderedVariableValues.map((value) => ({
    type: "text",
    text: value,
  }));

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: bodyParameters.length
            ? [
                {
                  type: "body",
                  parameters: bodyParameters,
                },
              ]
            : undefined,
        },
      }),
    }
  );

  const providerPayload = (await response.json().catch(() => null)) as
    | {
        messages?: Array<{ id?: string }>;
        error?: { message?: string; error_user_msg?: string };
      }
    | null;

  if (!response.ok) {
    return {
      success: false,
      providerMessageId: null,
      providerPayload,
      providerError:
        providerPayload?.error?.error_user_msg ??
        providerPayload?.error?.message ??
        "No se pudo enviar plantilla de WhatsApp",
    };
  }

  return {
    success: true,
    providerMessageId: providerPayload?.messages?.[0]?.id ?? null,
    providerPayload,
    providerError: null,
  };
};

const persistOutboundMessage = async (
  conversationId: string,
  body: string,
  sentAt: string,
  providerMessageId: string | null,
  sendMode: SendMode,
  templateName: string | null,
  providerPayload: unknown,
  providerError: string | null
): Promise<MessageRow> => {
  const supabase = createSupabaseAdminClient();

  const richInsert = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      body,
      direction: "outbound",
      created_at: sentAt,
      status: providerError ? "failed" : "sent",
      provider: "whatsapp",
      provider_message_id: providerMessageId,
      template_name: templateName,
      metadata: {
        send_mode: sendMode,
        provider_payload: providerPayload,
        provider_error: providerError,
      },
    })
    .select("id, conversation_id, body, direction, created_at")
    .single();

  if (!richInsert.error && richInsert.data) {
    return richInsert.data as MessageRow;
  }

  const minimalInsert = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      body,
      direction: "outbound",
      created_at: sentAt,
    })
    .select("id, conversation_id, body, direction, created_at")
    .single();

  if (minimalInsert.error || !minimalInsert.data) {
    throw new Error(minimalInsert.error?.message ?? "No se pudo persistir mensaje outbound");
  }

  return minimalInsert.data as MessageRow;
};

const persistOutboundLog = async (
  conversationId: string,
  leadId: string,
  phone: string,
  sendMode: SendMode,
  providerResult: ProviderResult,
  providerPayload: unknown
) => {
  const supabase = createSupabaseAdminClient();
  await supabase.from("webhook_events").insert({
    provider: "whatsapp",
    event_type: "message_outbound",
    message_id: providerResult.providerMessageId,
    phone,
    payload_original: {
      conversationId,
      leadId,
      sendMode,
      providerPayload,
      providerSuccess: providerResult.success,
      providerError: providerResult.providerError,
    },
    processed: providerResult.success,
    error: providerResult.providerError,
    processed_at: new Date().toISOString(),
  });
};

const updateConversationLastMessage = async (
  conversationId: string,
  body: string,
  sentAt: string
) => {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("conversations")
    .update({
      last_message: body,
      updated_at: sentAt,
    })
    .eq("id", conversationId);
};

export const sendOutboundWhatsAppMessage = async (input: SendOutboundMessageInput) => {
  const conversationId = input.conversationId.trim();
  const body = input.body.trim();

  if (!conversationId || !body) {
    throw new Error("`conversationId` y `body` son obligatorios");
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new Error("Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID");
  }

  const runtime = await getRuntimeConfig();
  const context = await getConversationContext(conversationId);
  const template = input.templateId ? await getTemplateById(input.templateId) : null;

  const customVariables = input.customVariables ?? {};
  const variables = buildVariables(context, template, customVariables);

  const resolvedBody = interpolateVariables(body, variables);

  const hasProviderTemplate = Boolean(template?.provider_template_name);
  const selectedMode = decideMode(input.forceMode, template?.send_mode, runtime, context, hasProviderTemplate);

  const sentAt = new Date().toISOString();
  let providerResult: ProviderResult;

  if (runtime.dryRun) {
    providerResult = {
      success: true,
      providerMessageId: `dryrun-${crypto.randomUUID()}`,
      providerPayload: { dryRun: true, mode: selectedMode },
      providerError: null,
    };
  } else if (selectedMode === "template") {
    if (!template?.provider_template_name) {
      throw new Error("La plantilla seleccionada no tiene `provider_template_name` configurado");
    }

    const orderedKeys = extractPlaceholderKeys(template.body?.trim() ? template.body : body);
    const orderedValues = orderedKeys.map((key) => variables[key] ?? "");

    providerResult = await sendTemplateMessage(
      context.leadPhone,
      template.provider_template_name,
      template.provider_language_code ?? runtime.defaultTemplateLanguageCode,
      orderedValues,
      accessToken,
      phoneNumberId,
      runtime.graphApiVersion
    );
  } else {
    providerResult = await sendTextMessage(
      context.leadPhone,
      resolvedBody,
      accessToken,
      phoneNumberId,
      runtime.graphApiVersion
    );
  }

  const persistedMessage = await persistOutboundMessage(
    conversationId,
    resolvedBody,
    sentAt,
    providerResult.providerMessageId,
    selectedMode,
    template?.provider_template_name ?? null,
    providerResult.providerPayload,
    providerResult.providerError
  );

  await updateConversationLastMessage(conversationId, resolvedBody, sentAt);
  await persistOutboundLog(
    conversationId,
    context.leadId,
    context.leadPhone,
    selectedMode,
    providerResult,
    providerResult.providerPayload
  );

  if (!providerResult.success) {
    throw new Error(providerResult.providerError ?? "Falló el envío en WhatsApp API");
  }

  return {
    message: persistedMessage,
    meta: {
      mode: selectedMode,
      providerMessageId: providerResult.providerMessageId,
      dryRun: runtime.dryRun,
      resolvedBody,
      usedTemplateId: template?.id ?? null,
    },
  };
};