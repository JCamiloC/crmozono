import { createSupabaseAdminClient } from "../../lib/supabase/admin";

type ParsedWebhookEvent = {
  provider: "whatsapp";
  object: string;
  entryCount: number;
  receivedAt: string;
  payload: unknown;
};

type IncomingMessage = {
  messageId: string;
  from: string;
  text: string;
  timestamp: string;
  contactName: string | null;
};

type LeadLookupRow = {
  id: string;
  telefono: string;
};

type ConversationLookupRow = {
  id: string;
};

type CountryRow = {
  id: string;
  name: string;
  code: string;
};

type ProfileAssignmentRow = {
  id: string;
  role: string;
  country_id: string | null;
  created_at: string;
};

type LeadAssignment = {
  countryName: string;
  adminId: string;
  agentId: string;
};

type WebhookEventRow = {
  id: string;
  processed: boolean;
};

const callingCodeToCountryCode: Array<{ callingCode: string; countryCode: string }> = [
  { callingCode: "57", countryCode: "CO" },
  { callingCode: "52", countryCode: "MX" },
  { callingCode: "56", countryCode: "CL" },
  { callingCode: "51", countryCode: "PE" },
  { callingCode: "54", countryCode: "AR" },
  { callingCode: "58", countryCode: "VE" },
  { callingCode: "593", countryCode: "EC" },
  { callingCode: "591", countryCode: "BO" },
  { callingCode: "595", countryCode: "PY" },
  { callingCode: "598", countryCode: "UY" },
  { callingCode: "55", countryCode: "BR" },
];

const normalizePhone = (value: string): string => {
  return value.replace(/[^\d]/g, "");
};

const isPlaceholderUuid = (value: string): boolean => {
  return value === "00000000-0000-0000-0000-000000000001" || value === "00000000-0000-0000-0000-000000000002";
};

const getMessageBodyByType = (message: Record<string, unknown>): string => {
  const type = typeof message.type === "string" ? message.type : "text";

  if (
    type === "text" &&
    message.text &&
    typeof message.text === "object" &&
    typeof (message.text as { body?: unknown }).body === "string"
  ) {
    return String((message.text as { body: string }).body ?? "").trim();
  }

  if (
    type === "button" &&
    message.button &&
    typeof message.button === "object" &&
    typeof (message.button as { text?: unknown }).text === "string"
  ) {
    return `[button] ${(message.button as { text: string }).text}`;
  }

  if (type === "interactive" && message.interactive && typeof message.interactive === "object") {
    const interactive = message.interactive as {
      button_reply?: { title?: string };
      list_reply?: { title?: string };
    };

    if (interactive.button_reply?.title) {
      return `[interactive] ${interactive.button_reply.title}`;
    }

    if (interactive.list_reply?.title) {
      return `[interactive] ${interactive.list_reply.title}`;
    }
  }

  if (
    (type === "image" || type === "video" || type === "document") &&
    message[type] &&
    typeof message[type] === "object" &&
    typeof (message[type] as { caption?: unknown }).caption === "string"
  ) {
    return `[${type}] ${(message[type] as { caption: string }).caption}`;
  }

  return `[${type}] Mensaje no textual recibido`;
};

const getWebhookDefaultAssignments = () => {
  const defaultCountry = process.env.WHATSAPP_DEFAULT_LEAD_COUNTRY ?? "No definido";
  const defaultAdminId =
    process.env.WHATSAPP_DEFAULT_ADMIN_ID ?? "00000000-0000-0000-0000-000000000001";
  const defaultAgentId =
    process.env.WHATSAPP_DEFAULT_AGENT_ID ?? "00000000-0000-0000-0000-000000000002";

  return {
    defaultCountry,
    defaultAdminId,
    defaultAgentId,
  };
};

const detectCountryCodeByPhone = (phone: string): string | null => {
  const normalized = normalizePhone(phone);
  const sortedMapping = [...callingCodeToCountryCode].sort(
    (leftItem, rightItem) => rightItem.callingCode.length - leftItem.callingCode.length
  );

  const match = sortedMapping.find((item) => normalized.startsWith(item.callingCode));
  return match?.countryCode ?? null;
};

const findCountryByPhone = async (phone: string): Promise<CountryRow | null> => {
  const countryCode = detectCountryCodeByPhone(phone);
  if (!countryCode) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("countries")
    .select("id, name, code")
    .eq("code", countryCode)
    .maybeSingle();

  if (error || !data) {
    console.error("[webhook][whatsapp] country lookup error", error);
    return null;
  }

  return data as CountryRow;
};

const resolveLeadAssignment = async (phone: string): Promise<LeadAssignment> => {
  const supabase = createSupabaseAdminClient();
  const fallback = getWebhookDefaultAssignments();
  const detectedCountry = await findCountryByPhone(phone);

  if (!detectedCountry) {
    if (isPlaceholderUuid(fallback.defaultAdminId) || isPlaceholderUuid(fallback.defaultAgentId)) {
      throw new Error(
        "No se detectó país por indicativo y faltan WHATSAPP_DEFAULT_ADMIN_ID/WHATSAPP_DEFAULT_AGENT_ID válidos"
      );
    }

    return {
      countryName: fallback.defaultCountry,
      adminId: fallback.defaultAdminId,
      agentId: fallback.defaultAgentId,
    };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("profiles")
    .select("id, role, country_id, created_at")
    .eq("country_id", detectedCountry.id)
    .in("role", ["admin", "agente"])
    .order("created_at", { ascending: true });

  if (assignmentsError || !assignments) {
    console.error("[webhook][whatsapp] profile assignment lookup error", assignmentsError);
    return {
      countryName: detectedCountry.name,
      adminId: fallback.defaultAdminId,
      agentId: fallback.defaultAgentId,
    };
  }

  const rows = assignments as ProfileAssignmentRow[];
  const admin = rows.find((row) => row.role === "admin");
  const agent = rows.find((row) => row.role === "agente");

  return {
    countryName: detectedCountry.name,
    adminId: admin?.id ?? fallback.defaultAdminId,
    agentId: agent?.id ?? fallback.defaultAgentId,
  };
};

const extractContactNameMap = (value: Record<string, unknown> | undefined): Map<string, string> => {
  const map = new Map<string, string>();
  const contacts = Array.isArray(value?.contacts) ? (value?.contacts as Record<string, unknown>[]) : [];

  for (const contact of contacts) {
    const waId = typeof contact.wa_id === "string" ? contact.wa_id : "";
    const profileName =
      contact.profile &&
      typeof contact.profile === "object" &&
      typeof (contact.profile as { name?: unknown }).name === "string"
        ? (contact.profile as { name: string }).name
        : "";

    if (waId && profileName) {
      map.set(waId, profileName);
    }
  }

  return map;
};

const extractIncomingMessages = (payload: unknown): IncomingMessage[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const entries = Array.isArray((payload as { entry?: unknown[] }).entry)
    ? ((payload as { entry: unknown[] }).entry ?? [])
    : [];

  const messages: IncomingMessage[] = [];

  for (const entry of entries) {
    const changes =
      entry && typeof entry === "object" && Array.isArray((entry as { changes?: unknown[] }).changes)
        ? ((entry as { changes: unknown[] }).changes ?? [])
        : [];

    for (const change of changes) {
      const value =
        change && typeof change === "object"
          ? ((change as { value?: unknown }).value as Record<string, unknown> | undefined)
          : undefined;

      const contactNames = extractContactNameMap(value);

      const messageList = Array.isArray(value?.messages)
        ? (value?.messages as Record<string, unknown>[])
        : [];

      for (const message of messageList) {
        const from = typeof message.from === "string" ? message.from : "";
        const timestampRaw = typeof message.timestamp === "string" ? message.timestamp : "";
        const messageId = typeof message.id === "string" ? message.id : crypto.randomUUID();
        const textBody = getMessageBodyByType(message);

        if (!from || !textBody) {
          continue;
        }

        const timestamp = timestampRaw
          ? new Date(Number(timestampRaw) * 1000).toISOString()
          : new Date().toISOString();

        messages.push({
          messageId,
          from,
          text: textBody,
          timestamp,
          contactName: contactNames.get(from) ?? null,
        });
      }
    }
  }

  return messages;
};

export const parseWhatsAppWebhookPayload = (payload: unknown): ParsedWebhookEvent => {
  const object =
    typeof payload === "object" && payload !== null && "object" in payload
      ? String((payload as { object?: unknown }).object ?? "unknown")
      : "unknown";

  const entryCount =
    typeof payload === "object" &&
    payload !== null &&
    "entry" in payload &&
    Array.isArray((payload as { entry?: unknown[] }).entry)
      ? (payload as { entry: unknown[] }).entry.length
      : 0;

  return {
    provider: "whatsapp",
    object,
    entryCount,
    receivedAt: new Date().toISOString(),
    payload,
  };
};

const findLeadByPhone = async (phone: string): Promise<string | null> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, telefono");

  if (error || !data) {
    console.error("[webhook][whatsapp] lead lookup error", error);
    return null;
  }

  const normalizedIncoming = normalizePhone(phone);
  const lead = (data as LeadLookupRow[]).find(
    (item) => normalizePhone(item.telefono) === normalizedIncoming
  );

  return lead?.id ?? null;
};

const createLeadFromInboundPhone = async (
  phone: string,
  contactName: string | null
): Promise<string> => {
  const supabase = createSupabaseAdminClient();
  const assignment = await resolveLeadAssignment(phone);

  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre: contactName,
      telefono: phone,
      pais: assignment.countryName,
      administrador_id: assignment.adminId,
      agente_id: assignment.agentId,
      estado_actual: "nuevo",
      fecha_estado: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo auto-crear lead desde webhook");
  }

  const leadId = (data as { id: string }).id;

  const { error: historyError } = await supabase.from("lead_status_history").insert({
    lead_id: leadId,
    estado: "nuevo",
    fecha: new Date().toISOString(),
    usuario_id: assignment.agentId,
  });

  if (historyError) {
    console.error("[webhook][whatsapp] lead history insert error", historyError);
  }

  return leadId;
};

const getOrCreateConversation = async (leadId: string, lastMessage: string, updatedAt: string) => {
  const supabase = createSupabaseAdminClient();

  const { data: existingConversation, error: existingConversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (existingConversationError) {
    throw new Error(existingConversationError.message);
  }

  if (existingConversation) {
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        last_message: lastMessage,
        updated_at: updatedAt,
      })
      .eq("id", (existingConversation as ConversationLookupRow).id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return (existingConversation as ConversationLookupRow).id;
  }

  const { data: newConversation, error: newConversationError } = await supabase
    .from("conversations")
    .insert({
      lead_id: leadId,
      last_message: lastMessage,
      updated_at: updatedAt,
    })
    .select("id")
    .single();

  if (newConversationError || !newConversation) {
    throw new Error(newConversationError?.message ?? "No se pudo crear conversación");
  }

  return (newConversation as ConversationLookupRow).id;
};

const saveWebhookEvent = async (
  eventType: string,
  payload: unknown,
  messageId?: string,
  phone?: string
) => {
  const supabase = createSupabaseAdminClient();

  if (messageId) {
    const { data: existingEvent, error: existingEventError } = await supabase
      .from("webhook_events")
      .select("id, processed")
      .eq("provider", "whatsapp")
      .eq("event_type", eventType)
      .eq("message_id", messageId)
      .maybeSingle();

    if (existingEventError) {
      console.error("[webhook][whatsapp] check existing event error", existingEventError);
    }

    if (existingEvent) {
      return (existingEvent as WebhookEventRow).id;
    }
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      provider: "whatsapp",
      event_type: eventType,
      payload_original: payload,
      message_id: messageId ?? null,
      phone: phone ?? null,
      processed: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[webhook][whatsapp] save event error", error);
    return null;
  }

  return (data as { id: string }).id;
};

const markWebhookEvent = async (eventId: string, processed: boolean, errorMessage?: string) => {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("webhook_events")
    .update({
      processed,
      processed_at: new Date().toISOString(),
      error: errorMessage ?? null,
    })
    .eq("id", eventId);
};

export const processWhatsAppWebhook = async (payload: unknown) => {
  const incomingMessages = extractIncomingMessages(payload);

  let processedCount = 0;
  let ignoredCount = 0;
  let duplicateCount = 0;

  for (const incomingMessage of incomingMessages) {
    const supabase = createSupabaseAdminClient();
    const { data: existingProcessedEvent } = await supabase
      .from("webhook_events")
      .select("id, processed")
      .eq("provider", "whatsapp")
      .eq("event_type", "message_received")
      .eq("message_id", incomingMessage.messageId)
      .eq("processed", true)
      .maybeSingle();

    if (existingProcessedEvent) {
      duplicateCount += 1;
      continue;
    }

    const eventId = await saveWebhookEvent(
      "message_received",
      payload,
      incomingMessage.messageId,
      incomingMessage.from
    );

    try {
      const existingLeadId = await findLeadByPhone(incomingMessage.from);
      const leadId =
        existingLeadId ??
        (await createLeadFromInboundPhone(incomingMessage.from, incomingMessage.contactName));

      const conversationId = await getOrCreateConversation(
        leadId,
        incomingMessage.text,
        incomingMessage.timestamp
      );

      const supabase = createSupabaseAdminClient();
      const { error: insertMessageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          body: incomingMessage.text,
          direction: "inbound",
          created_at: incomingMessage.timestamp,
        });

      if (insertMessageError) {
        throw new Error(insertMessageError.message);
      }

      processedCount += 1;
      if (eventId) {
        await markWebhookEvent(eventId, true);
      }
    } catch (error) {
      ignoredCount += 1;
      if (eventId) {
        await markWebhookEvent(
          eventId,
          false,
          error instanceof Error ? error.message : "Error no identificado"
        );
      }
    }
  }

  return {
    incomingCount: incomingMessages.length,
    processedCount,
    ignoredCount,
    duplicateCount,
  };
};

export const logWebhookEvent = async (event: ParsedWebhookEvent): Promise<void> => {
  console.info("[webhook][whatsapp] event received", {
    object: event.object,
    entryCount: event.entryCount,
    receivedAt: event.receivedAt,
  });
};