import type { AuditAction, AuditLog } from "../types";

const auditLogs: AuditLog[] = [
  {
    id: "audit-001",
    action: "lead_status_change",
    actor: "Agente CO-01",
    entityId: "lead-001",
    entityType: "lead",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    summary: "Estado actualizado a Contactado",
  },
];

export const addAuditLog = async (
  action: AuditAction,
  entityType: string,
  entityId: string,
  summary: string,
  actor = "Sistema"
): Promise<AuditLog> => {
  const newLog: AuditLog = {
    id: `audit-${Math.random().toString(36).slice(2, 7)}`,
    action,
    actor,
    entityType,
    entityId,
    summary,
    createdAt: new Date().toISOString(),
  };
  auditLogs.unshift(newLog);
  return newLog;
};

export const listAuditLogs = async (): Promise<AuditLog[]> => {
  return [...auditLogs];
};
