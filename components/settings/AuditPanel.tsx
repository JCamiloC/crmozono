import type { AuditLog } from "../../types";

type AuditPanelProps = {
  logs: AuditLog[];
};

export default function AuditPanel({ logs }: AuditPanelProps) {
  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Auditoría reciente</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Registro simulado de acciones sensibles.
      </p>
      <div className="mt-4 space-y-3 text-sm text-botanical-700">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-botanical-200 bg-botanical-50 p-4 text-sm text-botanical-600">
            Sin eventos recientes.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-botanical-100 bg-botanical-50 px-4 py-3">
              <p className="text-xs text-botanical-500">
                {new Date(log.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 font-semibold text-botanical-900">{log.summary}</p>
              <p className="text-xs text-botanical-600">
                {log.actor} · {log.entityType} #{log.entityId}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
