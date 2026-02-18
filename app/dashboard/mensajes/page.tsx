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
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationOrder, setConversationOrder] = useState<"recent" | "oldest" | "name_asc" | "name_desc">("recent");
  const [conversationPage, setConversationPage] = useState(1);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateOrder, setTemplateOrder] = useState<"name_asc" | "name_desc">("name_asc");
  const [templatePage, setTemplatePage] = useState(1);
  const [messageValue, setMessageValue] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const CONVERSATION_PAGE_SIZE = 8;
  const TEMPLATE_PAGE_SIZE = 8;

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

  const filteredConversations = useMemo(() => {
    const normalizedSearch = conversationSearch.trim().toLowerCase();
    const filtered = conversations.filter((conversation) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        conversation.leadName.toLowerCase().includes(normalizedSearch) ||
        conversation.leadPhone.toLowerCase().includes(normalizedSearch) ||
        conversation.lastMessage.toLowerCase().includes(normalizedSearch)
      );
    });

    filtered.sort((a, b) => {
      if (conversationOrder === "oldest") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      if (conversationOrder === "name_asc") {
        return a.leadName.localeCompare(b.leadName, "es");
      }

      if (conversationOrder === "name_desc") {
        return b.leadName.localeCompare(a.leadName, "es");
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return filtered;
  }, [conversations, conversationSearch, conversationOrder]);

  const conversationTotalPages = Math.max(
    1,
    Math.ceil(filteredConversations.length / CONVERSATION_PAGE_SIZE)
  );
  const safeConversationPage = Math.min(conversationPage, conversationTotalPages);

  const paginatedConversations = useMemo(() => {
    const start = (safeConversationPage - 1) * CONVERSATION_PAGE_SIZE;
    return filteredConversations.slice(start, start + CONVERSATION_PAGE_SIZE);
  }, [filteredConversations, safeConversationPage]);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = templateSearch.trim().toLowerCase();
    const filtered = templates.filter((template) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        template.name.toLowerCase().includes(normalizedSearch) ||
        template.preview.toLowerCase().includes(normalizedSearch)
      );
    });

    filtered.sort((a, b) => {
      if (templateOrder === "name_desc") {
        return b.name.localeCompare(a.name, "es");
      }

      return a.name.localeCompare(b.name, "es");
    });

    return filtered;
  }, [templates, templateSearch, templateOrder]);

  const templateTotalPages = Math.max(1, Math.ceil(filteredTemplates.length / TEMPLATE_PAGE_SIZE));
  const safeTemplatePage = Math.min(templatePage, templateTotalPages);

  const paginatedTemplates = useMemo(() => {
    const start = (safeTemplatePage - 1) * TEMPLATE_PAGE_SIZE;
    return filteredTemplates.slice(start, start + TEMPLATE_PAGE_SIZE);
  }, [filteredTemplates, safeTemplatePage]);

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
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Conversaciones
            </p>
            <input
              value={conversationSearch}
              onChange={(event) => {
                setConversationSearch(event.target.value);
                setConversationPage(1);
              }}
              placeholder="Buscar por lead, teléfono o mensaje"
              className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800 placeholder:text-botanical-400"
            />
            <select
              value={conversationOrder}
              onChange={(event) => {
                setConversationOrder(event.target.value as typeof conversationOrder);
                setConversationPage(1);
              }}
              className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="name_asc">Lead A-Z</option>
              <option value="name_desc">Lead Z-A</option>
            </select>
          </div>
          <ConversationList
            conversations={paginatedConversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
          {conversationTotalPages > 1 ? (
            <div className="mt-1 flex items-center justify-between text-xs text-botanical-700">
              <span>
                Página {safeConversationPage} de {conversationTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConversationPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeConversationPage === 1}
                  className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConversationPage((prev) => Math.min(conversationTotalPages, prev + 1))
                  }
                  disabled={safeConversationPage === conversationTotalPages}
                  className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
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

        <div className="space-y-2">
          <input
            value={templateSearch}
            onChange={(event) => {
              setTemplateSearch(event.target.value);
              setTemplatePage(1);
            }}
            placeholder="Buscar plantillas"
            className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800 placeholder:text-botanical-400"
          />
          <select
            value={templateOrder}
            onChange={(event) => {
              setTemplateOrder(event.target.value as typeof templateOrder);
              setTemplatePage(1);
            }}
            className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
          >
            <option value="name_asc">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
          </select>
          <TemplateList templates={paginatedTemplates} onSelect={handleTemplateSelect} />
          {templateTotalPages > 1 ? (
            <div className="mt-1 flex items-center justify-between text-xs text-botanical-700">
              <span>
                Página {safeTemplatePage} de {templateTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTemplatePage((prev) => Math.max(1, prev - 1))}
                  disabled={safeTemplatePage === 1}
                  className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setTemplatePage((prev) => Math.min(templateTotalPages, prev + 1))}
                  disabled={safeTemplatePage === templateTotalPages}
                  className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
