import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { AuditAction, AuditLog } from "../types";

type AuditLogRow = {
  id: string;
  action: string;
  actor: string;
  entity_id: string;
  entity_type: string;
  summary: string;
  created_at: string;
};

const mapAuditRow = (row: AuditLogRow): AuditLog => {
  return {
    id: row.id,
    action: row.action as AuditAction,
    actor: row.actor,
    entityId: row.entity_id,
    entityType: row.entity_type,
    summary: row.summary,
    createdAt: row.created_at,
  };
};

export const addAuditLog = async (
  action: AuditAction,
  entityType: string,
  entityId: string,
  summary: string,
  actor = "Sistema"
): Promise<AuditLog> => {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      action,
      actor,
      entity_id: entityId,
      entity_type: entityType,
      summary,
    })
    .select("id, action, actor, entity_id, entity_type, summary, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo registrar auditoría");
  }

  return mapAuditRow(data as AuditLogRow);
};

export const listAuditLogs = async (): Promise<AuditLog[]> => {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, actor, entity_id, entity_type, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error("[audit] listAuditLogs error", error);
    return [];
  }

  return (data as AuditLogRow[]).map(mapAuditRow);
};
