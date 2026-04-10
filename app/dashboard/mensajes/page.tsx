"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConversationList from "../../../components/messages/ConversationList";
import MessageComposer from "../../../components/messages/MessageComposer";
import MessageThread from "../../../components/messages/MessageThread";
import TemplateList from "../../../components/messages/TemplateList";
import AlertBanner from "../../../components/ui/AlertBanner";
import EmptyState from "../../../components/ui/EmptyState";
import type { Conversation, Message, MessageTemplate } from "../../../types";
import {
  getOrCreateConversationByLead,
  listConversations,
  listMessages,
  listTemplates,
  sendMessage,
} from "../../../services/mensajes.service";
import { listLeads } from "../../../services/leads/leads.service";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [isBootstrappingConversation, setIsBootstrappingConversation] = useState(false);
  const [autoBootstrapAttempted, setAutoBootstrapAttempted] = useState(false);

  const CONVERSATION_PAGE_SIZE = 8;
  const TEMPLATE_PAGE_SIZE = 8;

  const refreshConversations = useCallback(async () => {
    const data = await listConversations();
    setConversations(data);
    setLastRefreshAt(new Date());

    if (!selectedConversationId && data.length > 0) {
      setSelectedConversationId(data[0].id);
    }
  }, [selectedConversationId]);

  const refreshMessages = useCallback(async (conversationId: string) => {
    const data = await listMessages(conversationId);
    setMessages(data);
  }, []);

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
      await refreshConversations();
      const templatesData = await listTemplates();
      setTemplates(templatesData);
    };
    load();
  }, [refreshConversations]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) return;
      await refreshMessages(selectedConversationId);
    };
    loadMessages();
  }, [refreshMessages, selectedConversationId]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        await refreshConversations();
        if (selectedConversationId) {
          await refreshMessages(selectedConversationId);
        }
      } catch {
        // Avoid interrupting active typing when a polling refresh fails.
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [refreshConversations, refreshMessages, selectedConversationId]);

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
      setSuccessMessage("Mensaje enviado correctamente.");
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

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageValue(applyTemplateVariables(template.body, selectedConversation));
  };

  const handleBootstrapConversation = useCallback(async () => {
    if (isBootstrappingConversation) {
      return;
    }

    setIsBootstrappingConversation(true);
    setErrorMessage(null);

    try {
      const leads = await listLeads();
      if (leads.length === 0) {
        throw new Error("No hay leads disponibles para iniciar conversación.");
      }

      const conversation = await getOrCreateConversationByLead(leads[0].id);
      await refreshConversations();
      setSelectedConversationId(conversation.id);
      await refreshMessages(conversation.id);
      setSuccessMessage("Conversación lista para seguimiento.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo preparar una conversación inicial."
      );
    } finally {
      setIsBootstrappingConversation(false);
    }
  }, [isBootstrappingConversation, refreshConversations, refreshMessages]);

  useEffect(() => {
    if (autoBootstrapAttempted || conversations.length > 0) {
      return;
    }

    setAutoBootstrapAttempted(true);
    void handleBootstrapConversation();
  }, [autoBootstrapAttempted, conversations.length, handleBootstrapConversation]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Mensajería</h1>
        <p className="text-sm text-botanical-600">
          Conversaciones activas y plantillas aprobadas.
        </p>
      </div>

      {errorMessage ? (
        <AlertBanner message={errorMessage} tone="danger" />
      ) : null}

      {successMessage ? (
        <AlertBanner message={successMessage} tone="success" />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="min-w-0 space-y-3">
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
          {filteredConversations.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="No hay conversaciones para mostrar"
                description="Ajusta el filtro, espera nuevos mensajes o crea una conversación base para seguimiento."
              />
              <button
                type="button"
                onClick={() => {
                  void handleBootstrapConversation();
                }}
                disabled={isBootstrappingConversation}
                className="w-full rounded-lg border border-botanical-300 bg-white px-3 py-2 text-xs font-semibold text-botanical-800 transition hover:bg-botanical-50 disabled:opacity-60"
              >
                {isBootstrappingConversation
                  ? "Preparando conversación..."
                  : "Crear conversación inicial"}
              </button>
            </div>
          ) : null}
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

        <div className="min-w-0 flex flex-col gap-4">
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedConversation ? (
                <Link
                  href={`/dashboard/leads?leadId=${selectedConversation.leadId}`}
                  className="rounded-lg bg-botanical-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-botanical-800"
                >
                  Abrir lead
                </Link>
              ) : null}
              <span className="text-xs text-botanical-500">
                {lastRefreshAt
                  ? `Ultima actualizacion ${lastRefreshAt.toLocaleTimeString("es-ES")}`
                  : "Sin sincronizacion reciente"}
              </span>
            </div>
          </div>
          <MessageThread messages={messages} />
          <MessageComposer
            value={messageValue}
            onChange={setMessageValue}
            onSend={handleSend}
            disabled={sending}
          />
        </div>

        <div className="min-w-0 space-y-2">
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
