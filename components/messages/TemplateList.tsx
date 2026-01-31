import type { MessageTemplate } from "../../types";

type TemplateListProps = {
  templates: MessageTemplate[];
  onSelect: (template: MessageTemplate) => void;
};

export default function TemplateList({ templates, onSelect }: TemplateListProps) {
  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
        Plantillas aprobadas
      </p>
      <div className="mt-4 space-y-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="w-full rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-3 text-left text-sm text-botanical-800 transition hover:bg-botanical-100"
          >
            <p className="font-semibold text-botanical-900">{template.name}</p>
            <p className="text-xs text-botanical-600">{template.preview}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
