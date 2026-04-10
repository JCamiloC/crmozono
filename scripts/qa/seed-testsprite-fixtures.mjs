import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env");

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function isoMinusDays(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  if (!fs.existsSync(envPath)) {
    throw new Error("No se encontro .env en la raiz del proyecto.");
  }

  const env = loadEnv(envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  const promoteAdmin = process.argv.includes("--promote-admin-superadmin");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const [{ data: countries, error: countriesError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase.from("countries").select("id,name,code").order("name", { ascending: true }),
      supabase.from("profiles").select("id,email,role,country_id"),
    ]);

  if (countriesError) throw new Error(countriesError.message);
  if (profilesError) throw new Error(profilesError.message);

  if (!countries || countries.length === 0) {
    throw new Error("No hay paises en la tabla countries.");
  }

  const adminProfile =
    profiles.find((p) => (p.email || "").toLowerCase() === "admin@superozono.local") ||
    profiles.find((p) => p.role === "admin") ||
    profiles.find((p) => p.role === "superadmin");

  if (!adminProfile) {
    throw new Error("No se encontro perfil admin/superadmin para sembrar fixtures.");
  }

  const agentProfile = profiles.find((p) => p.role === "agente") || adminProfile;

  if (promoteAdmin && adminProfile.role !== "superadmin") {
    const { error: promoteError } = await supabase
      .from("profiles")
      .update({ role: "superadmin" })
      .eq("id", adminProfile.id);

    if (promoteError) {
      throw new Error(`No se pudo promover admin para QA: ${promoteError.message}`);
    }
  }

  const countryA = countries[0].name;
  const countryB = countries[1]?.name || countries[0].name;

  const suffix = Date.now().toString().slice(-6);
  const phoneA = `57300111${suffix.slice(-4)}`;
  const phoneB = `57300222${suffix.slice(-4)}`;

  const nowIso = new Date().toISOString();
  const oldIso = isoMinusDays(6);

  const leadsPayload = [
    {
      nombre: `Lead QA Conversacion ${suffix}`,
      telefono: phoneA,
      pais: countryA,
      origen: "manual",
      administrador_id: adminProfile.id,
      agente_id: agentProfile.id,
      estado_actual: "contactado",
      fecha_estado: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: adminProfile.id,
    },
    {
      nombre: `Lead QA SLA ${suffix}`,
      telefono: phoneB,
      pais: countryB,
      origen: "manual",
      administrador_id: adminProfile.id,
      agente_id: agentProfile.id,
      estado_actual: "nuevo",
      fecha_estado: oldIso,
      created_at: oldIso,
      updated_at: oldIso,
      created_by: adminProfile.id,
    },
  ];

  const { data: insertedLeads, error: leadsError } = await supabase
    .from("leads")
    .insert(leadsPayload)
    .select("id,nombre,telefono,pais,estado_actual,created_at,fecha_estado");

  if (leadsError || !insertedLeads) {
    throw new Error(leadsError?.message || "No se pudieron crear leads de fixture");
  }

  const leadA = insertedLeads[0];
  const leadB = insertedLeads[1];

  const { error: leadHistoryError } = await supabase.from("lead_status_history").insert([
    { lead_id: leadA.id, estado: "nuevo", fecha: nowIso, usuario_id: agentProfile.id },
    { lead_id: leadA.id, estado: "contactado", fecha: nowIso, usuario_id: agentProfile.id },
    { lead_id: leadB.id, estado: "nuevo", fecha: oldIso, usuario_id: agentProfile.id },
  ]);

  if (leadHistoryError) {
    throw new Error(`No se pudo crear lead_status_history: ${leadHistoryError.message}`);
  }

  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .insert([
      { lead_id: leadA.id, last_message: "Hola, quiero informacion", updated_at: nowIso },
      { lead_id: leadB.id, last_message: "Necesito cotizacion", updated_at: oldIso },
    ])
    .select("id,lead_id");

  if (convError || !conversations) {
    throw new Error(convError?.message || "No se pudieron crear conversaciones");
  }

  const convByLead = new Map(conversations.map((c) => [c.lead_id, c.id]));

  const { error: msgError } = await supabase.from("messages").insert([
    {
      conversation_id: convByLead.get(leadA.id),
      body: "Hola, quiero informacion del producto",
      direction: "inbound",
      created_at: nowIso,
    },
    {
      conversation_id: convByLead.get(leadA.id),
      body: "Claro, con gusto te comparto detalles.",
      direction: "outbound",
      created_at: nowIso,
    },
    {
      conversation_id: convByLead.get(leadB.id),
      body: "Necesito cotizacion para mi pais",
      direction: "inbound",
      created_at: oldIso,
    },
  ]);

  if (msgError) throw new Error(`No se pudieron crear mensajes: ${msgError.message}`);

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .insert([
      {
        lead_id: leadA.id,
        agente_id: agentProfile.id,
        titulo: `Seguimiento QA ${suffix}`,
        tipo_tarea: "seguimiento",
        descripcion: "Fixture para desbloquear pruebas TestSprite",
        fecha_programada: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        estado: "pendiente",
      },
    ])
    .select("id,fecha_creacion");

  if (taskError || !tasks) throw new Error(taskError?.message || "No se pudo crear tarea");

  const { error: taskHistoryError } = await supabase.from("task_history").insert([
    {
      task_id: tasks[0].id,
      estado: "pendiente",
      fecha: tasks[0].fecha_creacion,
      usuario_id: agentProfile.id,
      comentario: "Tarea de fixture QA",
    },
  ]);

  if (taskHistoryError) {
    throw new Error(`No se pudo crear task_history: ${taskHistoryError.message}`);
  }

  const { error: callError } = await supabase.from("calls").insert([
    {
      lead_id: leadA.id,
      agent_id: agentProfile.id,
      agent_name: adminProfile.email || "admin@superozono.local",
      started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      ended_at: nowIso,
      duration_minutes: 15,
      result: "interesado",
      notes: "Llamada de fixture QA",
    },
  ]);

  if (callError) throw new Error(`No se pudo crear llamada: ${callError.message}`);

  const { error: auditError } = await supabase.from("audit_logs").insert([
    {
      action: "settings_updated",
      actor: "QA Seed",
      entity_id: leadA.id,
      entity_type: "lead",
      summary: "Fixtures QA sembrados para TestSprite",
    },
  ]);

  if (auditError) {
    throw new Error(`No se pudo crear audit log: ${auditError.message}`);
  }

  const report = {
    ok: true,
    promotedAdminToSuperadmin: promoteAdmin,
    created: {
      leads: insertedLeads.map((l) => ({ id: l.id, telefono: l.telefono, pais: l.pais })),
      conversations: conversations.length,
      messages: 3,
      tasks: 1,
      calls: 1,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("[seed-testsprite-fixtures]", error.message);
  process.exit(1);
});
