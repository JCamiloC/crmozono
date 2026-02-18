"use client";

import { useEffect, useMemo, useState } from "react";
import ConversationList from "../../../components/messages/ConversationList";
import MessageComposer from "../../../components/messages/MessageComposer";
import MessageThread from "../../../components/messages/MessageThread";
import TemplateList from "../../../components/messages/TemplateList";
import type { Conversation, Message, MessageTemplate } from "../../../types";
import {
  listConversations,
  listMessages,
  listTemplates,
  sendMessage,
} from "../../../services/mensajes.service";
import { addAuditLog } from "../../../services/auditoria.service";

export default function MensajesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [messageValue, setMessageValue] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyTemplateVariables = (templateBody: string, conversation: Conversation | null) => {
    const leadName = conversation?.leadName?.trim() || "cliente";
    const firstName = leadName.split(" ").filter(Boolean)[0] ?? leadName;
    const leadPhone = conversation?.leadPhone?.trim() || "";

    return templateBody
      .replace(/\{\{\s*nombre\s*\}\}|\[\[\s*nombre\s*\]\]/gi, leadName)
      .replace(/\{\{\s*first_name\s*\}\}|\[\[\s*first_name\s*\]\]/gi, firstName)
      .replace(/\{\{\s*telefono\s*\}\}|\[\[\s*telefono\s*\]\]/gi, leadPhone);
  };

  useEffect(() => {
    const load = async () => {
      const data = await listConversations();
      setConversations(data);
      if (data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
      const templatesData = await listTemplates();
      setTemplates(templatesData);
    };
    load();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) return;
      const data = await listMessages(selectedConversationId);
      setMessages(data);
    };
    loadMessages();
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const handleSend = async () => {
    if (!selectedConversationId || !messageValue.trim() || sending) return;

    try {
      setSending(true);
      setErrorMessage(null);
      const newMessage = await sendMessage(selectedConversationId, messageValue.trim(), {
        templateId: selectedTemplate?.id,
      });
      setMessages((prev) => [...prev, newMessage]);
      setMessageValue("");
      setSelectedTemplate(null);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversationId
            ? { ...conv, lastMessage: newMessage.body, updatedAt: newMessage.createdAt }
            : conv
        )
      );
      await addAuditLog(
        "message_sent",
        "conversation",
        selectedConversationId,
        "Mensaje enviado a WhatsApp",
        "Agente"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo enviar el mensaje";
      setErrorMessage(message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageValue(applyTemplateVariables(template.body, selectedConversation));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Mensajería</h1>
        <p className="text-sm text-botanical-600">
          Conversaciones activas y plantillas aprobadas.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
            Conversaciones
          </p>
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Conversación activa
            </p>
            <h2 className="mt-2 text-lg font-semibold text-botanical-900">
              {selectedConversation?.leadName ?? "Selecciona una conversación"}
            </h2>
            <p className="text-xs text-botanical-600">
              {selectedConversation?.leadPhone ?? ""}
            </p>
          </div>
          <MessageThread messages={messages} />
          <MessageComposer
            value={messageValue}
            onChange={setMessageValue}
            onSend={handleSend}
            disabled={sending}
          />
        </div>

        <TemplateList templates={templates} onSelect={handleTemplateSelect} />
      </div>
    </div>
  );
}
