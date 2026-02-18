"use client";

import { useMemo, useState } from "react";
import type { MessageTemplate } from "../../types";

type EditableTemplate = {
  name: string;
  preview: string;
  body: string;
  sendMode: "auto" | "text" | "template";
  providerTemplateName: string;
  providerLanguageCode: string;
  defaultVariablesJson: string;
};

const PAGE_SIZE = 5;

type TemplateSettingsPanelProps = {
  templates: MessageTemplate[];
  onCreateTemplate: (payload: { name: string; preview: string; body: string }) => Promise<void>;
  onSaveTemplate: (
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
  ) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
};

export default function TemplateSettingsPanel({
  templates,
  onCreateTemplate,
  onSaveTemplate,
  onDeleteTemplate,
}: TemplateSettingsPanelProps) {
  const [name, setName] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, EditableTemplate>>({});

  const mergedDrafts = useMemo(() => {
    const output: Record<string, EditableTemplate> = {};

    for (const template of templates) {
      const existing = drafts[template.id];
      output[template.id] =
        existing ?? {
          name: template.name,
          preview: template.preview,
          body: template.body,
          sendMode: template.sendMode ?? "auto",
          providerTemplateName: template.providerTemplateName ?? "",
          providerLanguageCode: template.providerLanguageCode ?? "es",
          defaultVariablesJson: JSON.stringify(template.defaultVariables ?? {}, null, 2),
        };
    }

    return output;
  }, [drafts, templates]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return templates;
    }

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(normalizedQuery) ||
        template.preview.toLowerCase().includes(normalizedQuery)
    );
  }, [query, templates]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleCreateTemplate = async () => {
    setErrorMessage(null);
    if (!name.trim() || !preview.trim() || !body.trim()) {
      setErrorMessage("Nombre, preview y body son obligatorios.");
      return;
    }

    setCreating(true);
    try {
      await onCreateTemplate({
        name: name.trim(),
        preview: preview.trim(),
        body: body.trim(),
      });
      setName("");
      setPreview("");
      setBody("");
      setPage(1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear la plantilla.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveTemplate = async (templateId: string) => {
    setErrorMessage(null);
    const draft = mergedDrafts[templateId];
    if (!draft) {
      return;
    }

    let parsedVariables: Record<string, string> = {};
    try {
      const candidate = JSON.parse(draft.defaultVariablesJson) as Record<string, unknown>;
      parsedVariables = Object.entries(candidate).reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === "string") {
          acc[key] = value;
        }
        return acc;
      }, {});
    } catch {
      setErrorMessage("`Variables JSON` debe ser un objeto JSON válido.");
      return;
    }

    setSavingTemplateId(templateId);
    try {
      await onSaveTemplate(templateId, {
        name: draft.name,
        preview: draft.preview,
        body: draft.body,
        sendMode: draft.sendMode,
        providerTemplateName: draft.providerTemplateName.trim() || null,
        providerLanguageCode: draft.providerLanguageCode.trim() || null,
        defaultVariables: parsedVariables,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la plantilla.");
    } finally {
      setSavingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setErrorMessage(null);
    setDeletingTemplateId(templateId);
    try {
      await onDeleteTemplate(templateId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar la plantilla.");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Plantillas WhatsApp</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Configura modo de envío y plantilla Meta sin cambios de código.
      </p>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          className="rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
        />
        <input
          value={preview}
          onChange={(event) => setPreview(event.target.value)}
          placeholder="Preview"
          className="rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Body con variables {{nombre}}"
          rows={3}
          className="rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
        />
        <button
          type="button"
          onClick={handleCreateTemplate}
          disabled={creating}
          className="w-fit rounded-xl bg-botanical-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 disabled:opacity-60"
        >
          {creating ? "Creando..." : "Crear plantilla"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar plantilla"
          className="w-full rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
        />

        {pagedTemplates.map((template) => {
          const draft = mergedDrafts[template.id];
          if (!draft) {
            return null;
          }

          return (
            <div
              key={template.id}
              className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4"
            >
              <p className="text-sm font-semibold text-botanical-900">{template.name}</p>
              <p className="text-xs text-botanical-600">{template.preview}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={draft.name}
                  onChange={(event) => {
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, name: event.target.value },
                    }));
                  }}
                  placeholder="Nombre"
                  className="sm:col-span-2 rounded-xl border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                />

                <input
                  value={draft.preview}
                  onChange={(event) => {
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, preview: event.target.value },
                    }));
                  }}
                  placeholder="Preview"
                  className="sm:col-span-2 rounded-xl border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                />

                <textarea
                  value={draft.body}
                  onChange={(event) => {
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, body: event.target.value },
                    }));
                  }}
                  rows={3}
                  placeholder="Body"
                  className="sm:col-span-2 rounded-xl border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                />

                <select
                  value={draft.sendMode}
                  onChange={(event) => {
                    const sendMode = event.target.value as "auto" | "text" | "template";
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, sendMode },
                    }));
                  }}
                  className="rounded-xl border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                >
                  <option value="auto">auto</option>
                  <option value="text">text</option>
                  <option value="template">template</option>
                </select>

                <input
                  value={draft.providerLanguageCode}
                  onChange={(event) => {
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, providerLanguageCode: event.target.value },
                    }));
                  }}
                  placeholder="Idioma (ej: es)"
                  className="rounded-xl border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                />

                <input
                  value={draft.providerTemplateName}
                  onChange={(event) => {
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, providerTemplateName: event.target.value },
                    }));
                  }}
                  placeholder="Nombre plantilla Meta"
                  className="sm:col-span-2 rounded-xl border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                />

                <textarea
                  value={draft.defaultVariablesJson}
                  onChange={(event) => {
                    setDrafts((current) => ({
                      ...current,
                      [template.id]: { ...draft, defaultVariablesJson: event.target.value },
                    }));
                  }}
                  rows={4}
                  placeholder='{"agente":"Equipo"}'
                  className="sm:col-span-2 rounded-xl border border-botanical-200 bg-white px-3 py-2 text-xs text-botanical-800"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTemplate(template.id)}
                  disabled={savingTemplateId === template.id}
                  className="rounded-xl bg-botanical-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 disabled:opacity-60"
                >
                  {savingTemplateId === template.id ? "Guardando..." : "Guardar ajustes"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(template.id)}
                  disabled={deletingTemplateId === template.id}
                  className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
                >
                  {deletingTemplateId === template.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          );
        })}

        {pagedTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-botanical-200 bg-botanical-50 px-4 py-3 text-sm text-botanical-700">
            No hay plantillas para los filtros actuales.
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between text-xs text-botanical-700">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
