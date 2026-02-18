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
};

type LeadLookupRow = {
  id: string;
  telefono: string;
};

type ConversationLookupRow = {
  id: string;
};

const normalizePhone = (value: string): string => {
  return value.replace(/[^\d]/g, "");
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

      const messageList = Array.isArray(value?.messages)
        ? (value?.messages as Record<string, unknown>[])
        : [];

      for (const message of messageList) {
        const from = typeof message.from === "string" ? message.from : "";
        const timestampRaw = typeof message.timestamp === "string" ? message.timestamp : "";
        const messageId = typeof message.id === "string" ? message.id : crypto.randomUUID();
        const textBody =
          message.text && typeof message.text === "object" && typeof (message.text as { body?: unknown }).body === "string"
            ? ((message.text as { body: string }).body ?? "")
            : "";

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

  for (const incomingMessage of incomingMessages) {
    const eventId = await saveWebhookEvent(
      "message_received",
      payload,
      incomingMessage.messageId,
      incomingMessage.from
    );

    try {
      const leadId = await findLeadByPhone(incomingMessage.from);

      if (!leadId) {
        ignoredCount += 1;
        if (eventId) {
          await markWebhookEvent(eventId, false, "Lead no encontrado para teléfono entrante");
        }
        continue;
      }

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
  };
};

export const logWebhookEvent = async (event: ParsedWebhookEvent): Promise<void> => {
  console.info("[webhook][whatsapp] event received", {
    object: event.object,
    entryCount: event.entryCount,
    receivedAt: event.receivedAt,
  });
};