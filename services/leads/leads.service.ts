import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import type { Lead, LeadStatus, LeadStatusHistory } from "../../types";

type LeadRow = {
  id: string;
  nombre: string | null;
  telefono: string;
  pais: string;
  origen?: string | null;
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

type CountryLookupRow = {
  id: string;
  name: string;
};

type ProfileAssignmentRow = {
  id: string;
  role: string;
  country_id: string | null;
  created_at: string;
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
    origen: row.origen ?? null,
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

const normalizePhone = (value: string): string => {
  return value.replace(/[^\d]/g, "");
};

const resolveAssignmentsByCountry = async (
  countryName: string
): Promise<{ adminId: string; agentId: string }> => {
  const supabase = createSupabaseBrowserClient();

  const { data: countryData, error: countryError } = await supabase
    .from("countries")
    .select("id, name")
    .eq("name", countryName)
    .maybeSingle();

  if (countryError) {
    throw new Error(countryError.message);
  }

  const countryId = (countryData as CountryLookupRow | null)?.id ?? null;

  let profileQuery = supabase
    .from("profiles")
    .select("id, role, country_id, created_at")
    .in("role", ["admin", "agente"])
    .order("created_at", { ascending: true });

  if (countryId) {
    profileQuery = profileQuery.eq("country_id", countryId);
  }

  const { data: profileData, error: profileError } = await profileQuery;

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileData as ProfileAssignmentRow[] | null) ?? [];
  const admin = profiles.find((item) => item.role === "admin");
  const agent = profiles.find((item) => item.role === "agente");

  if (admin && agent) {
    return { adminId: admin.id, agentId: agent.id };
  }

  const { data: fallbackProfiles, error: fallbackError } = await supabase
    .from("profiles")
    .select("id, role, country_id, created_at")
    .in("role", ["admin", "agente"])
    .order("created_at", { ascending: true });

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  const fallback = (fallbackProfiles as ProfileAssignmentRow[] | null) ?? [];
  const fallbackAdmin = fallback.find((item) => item.role === "admin");
  const fallbackAgent = fallback.find((item) => item.role === "agente");

  if (!fallbackAdmin || !fallbackAgent) {
    throw new Error("No hay usuarios admin/agente configurados para asignar el lead.");
  }

  return {
    adminId: fallbackAdmin.id,
    agentId: fallbackAgent.id,
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
      "id, nombre, telefono, pais, origen, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
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
      "id, nombre, telefono, pais, origen, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre: payload.nombre,
      telefono: normalizePhone(payload.telefono),
      pais: payload.pais,
      administrador_id: payload.administradorId,
      agente_id: payload.agenteId,
      estado_actual: payload.estadoActual,
      fecha_estado: payload.fechaEstado,
      origen: payload.origen ?? "manual",
      created_by: user?.id ?? null,
    })
    .select(
      "id, nombre, telefono, pais, origen, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el lead");
  }

  return mapLeadRow(data as LeadRow);
};

export const createManualLead = async (payload: {
  nombre: string | null;
  telefono: string;
  pais: string;
  initialMessage?: string | null;
}): Promise<Lead> => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const normalizedPhone = normalizePhone(payload.telefono);

  if (!normalizedPhone) {
    throw new Error("El teléfono es obligatorio.");
  }

  const countryName = payload.pais.trim();
  if (!countryName) {
    throw new Error("El país es obligatorio.");
  }

  const { data: leadRows, error: leadLookupError } = await supabase
    .from("leads")
    .select("id, telefono");

  if (leadLookupError) {
    throw new Error(leadLookupError.message);
  }

  const duplicatedLead = ((leadRows as Pick<LeadRow, "id" | "telefono">[] | null) ?? []).find(
    (item) => normalizePhone(item.telefono) === normalizedPhone
  );

  if (duplicatedLead) {
    throw new Error("Ya existe un lead con ese número telefónico.");
  }

  const assignment = await resolveAssignmentsByCountry(countryName);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre: payload.nombre && payload.nombre.trim() ? payload.nombre.trim() : null,
      telefono: normalizedPhone,
      pais: countryName,
      administrador_id: assignment.adminId,
      agente_id: assignment.agentId,
      estado_actual: "nuevo",
      fecha_estado: now,
      origen: "manual",
      created_by: user?.id ?? null,
    })
    .select(
      "id, nombre, telefono, pais, origen, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el lead manual");
  }

  const createdLead = mapLeadRow(data as LeadRow);

  const { error: historyError } = await supabase.from("lead_status_history").insert({
    lead_id: createdLead.id,
    estado: "nuevo",
    fecha: now,
    usuario_id: assignment.agentId,
  });

  if (historyError) {
    console.error("[leads] manual lead history insert error", historyError);
  }

  const initialMessage =
    payload.initialMessage && payload.initialMessage.trim()
      ? payload.initialMessage.trim()
      : "Lead creado manualmente desde el aplicativo";

  const { data: conversationData, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      lead_id: createdLead.id,
      last_message: initialMessage,
      updated_at: now,
    })
    .select("id")
    .single();

  if (conversationError || !conversationData) {
    console.error("[leads] manual conversation create error", conversationError);
    throw new Error("Lead creado, pero falló la creación de conversación inicial.");
  }

  const conversationId = (conversationData as { id: string }).id;
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    body: initialMessage,
    direction: "inbound",
    created_at: now,
  });

  if (messageError) {
    console.error("[leads] manual initial message create error", messageError);
    throw new Error("Lead creado, pero falló el mensaje inicial de conversación.");
  }

  const welcomeMessage = `Hola ${createdLead.nombre?.trim() || "cliente"}, gracias por contactar a SuperOzono. Te atenderemos en breve.`;
  const { error: welcomeError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    body: welcomeMessage,
    direction: "outbound",
    created_at: new Date(Date.now() + 1000).toISOString(),
  });

  if (welcomeError) {
    console.error("[leads] manual welcome message create error", welcomeError);
  }

  await supabase
    .from("conversations")
    .update({
      last_message: welcomeError ? initialMessage : welcomeMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return createdLead;
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
      "id, nombre, telefono, pais, origen, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
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
      "id, nombre, telefono, pais, origen, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at"
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
