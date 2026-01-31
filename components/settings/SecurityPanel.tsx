import type { SecuritySummary } from "../../types";

type SecurityPanelProps = {
  summary: SecuritySummary | null;
};

export default function SecurityPanel({ summary }: SecurityPanelProps) {
  if (!summary) {
    return (
      <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
        Cargando resumen de seguridad...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Seguridad</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Resumen general del estado de seguridad.
      </p>
      <div className="mt-4 rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-sm text-botanical-700">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Última auditoría
        </p>
        <p className="mt-2 font-semibold text-botanical-900">
          {new Date(summary.lastAuditAt).toLocaleDateString()}
        </p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-botanical-700">
        {summary.notes.map((note) => (
          <div key={note} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-botanical-500" />
            <p>{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
