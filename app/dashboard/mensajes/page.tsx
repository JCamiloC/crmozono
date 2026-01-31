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
    if (!selectedConversationId || !messageValue.trim()) return;
    const newMessage = await sendMessage(selectedConversationId, messageValue.trim());
    setMessages((prev) => [...prev, newMessage]);
    setMessageValue("");
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
      "Mensaje enviado (simulado)",
      "Agente"
    );
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setMessageValue(template.body);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Mensajería</h1>
        <p className="text-sm text-botanical-600">
          Conversaciones activas y plantillas aprobadas (simulado).
        </p>
      </div>

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
          />
        </div>

        <TemplateList templates={templates} onSelect={handleTemplateSelect} />
      </div>
    </div>
  );
}
