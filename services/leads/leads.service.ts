import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import type { Lead, LeadStatus, LeadStatusHistory } from "../../types";

type LeadRow = {
  id: string;
  nombre: string | null;
  telefono: string;
  pais: string;
  administrador_id: string;
  agente_id: string;
  estado_actual: string;
  fecha_estado: string;
  created_at: string;
  updated_at: string;
};

type LeadHistoryRow = {
  id: string;
  lead_id: string;
  estado: string;
  fecha: string;
  usuario_id: string;
};

const VALID_LEAD_STATUS: LeadStatus[] = [
  "nuevo",
  "contactado",
  "seguimiento",
  "llamada",
  "venta",
  "no_interesado",
  "cerrado_tiempo",
];

const normalizeLeadStatus = (value: string): LeadStatus => {
  if (VALID_LEAD_STATUS.includes(value as LeadStatus)) {
    return value as LeadStatus;
  }
  return "nuevo";
};

const mapLeadRow = (row: LeadRow): Lead => {
  return {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    pais: row.pais,
    administradorId: row.administrador_id,
    agenteId: row.agente_id,
    estadoActual: normalizeLeadStatus(row.estado_actual),
    fechaEstado: row.fecha_estado,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapLeadHistoryRow = (row: LeadHistoryRow): LeadStatusHistory => {
  return {
    id: row.id,
    leadId: row.lead_id,
    estado: normalizeLeadStatus(row.estado),
    fecha: row.fecha,
    usuarioId: row.usuario_id,
  };
};

const getFallbackActorId = async (lead: Lead): Promise<string> => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? lead.agenteId;
};

export const listLeads = async (): Promise<Lead[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, nombre, telefono, pais, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[leads] listLeads error", error);
    return [];
  }

  return (data as LeadRow[]).map(mapLeadRow);
};

export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, nombre, telefono, pais, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapLeadRow(data as LeadRow);
};

export const createLead = async (
  payload: Omit<Lead, "id" | "createdAt" | "updatedAt">
): Promise<Lead> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre: payload.nombre,
      telefono: payload.telefono,
      pais: payload.pais,
      administrador_id: payload.administradorId,
      agente_id: payload.agenteId,
      estado_actual: payload.estadoActual,
      fecha_estado: payload.fechaEstado,
    })
    .select(
      "id, nombre, telefono, pais, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el lead");
  }

  return mapLeadRow(data as LeadRow);
};

export const updateLeadStatus = async (
  leadId: string,
  status: LeadStatus
): Promise<Lead> => {
  const supabase = createSupabaseBrowserClient();
  const timestamp = new Date().toISOString();

  const { data, error } = await supabase
    .from("leads")
    .update({
      estado_actual: status,
      fecha_estado: timestamp,
      updated_at: timestamp,
    })
    .eq("id", leadId)
    .select(
      "id, nombre, telefono, pais, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar el estado del lead");
  }

  const lead = mapLeadRow(data as LeadRow);
  const actorId = await getFallbackActorId(lead);

  const { error: historyError } = await supabase.from("lead_status_history").insert({
    lead_id: lead.id,
    estado: status,
    fecha: timestamp,
    usuario_id: actorId,
  });

  if (historyError) {
    console.error("[leads] lead_status_history insert error", historyError);
  }

  return lead;
};

export const closeLead = async (leadId: string): Promise<Lead> => {
  return updateLeadStatus(leadId, "venta");
};

export const assignLead = async (leadId: string, agenteId: string): Promise<Lead> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .update({
      agente_id: agenteId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select(
      "id, nombre, telefono, pais, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo asignar el lead");
  }

  return mapLeadRow(data as LeadRow);
};

export const getLeadHistory = async (leadId: string): Promise<LeadStatusHistory[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_status_history")
    .select("id, lead_id, estado, fecha, usuario_id")
    .eq("lead_id", leadId)
    .order("fecha", { ascending: false });

  if (error || !data) {
    console.error("[leads] getLeadHistory error", error);
    return [];
  }

  return (data as LeadHistoryRow[]).map(mapLeadHistoryRow);
};
