import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env");

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function normalizePhone(value) {
  return (value || "").replace(/\D/g, "");
}

function keyCount(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

const VALID_LEAD_STATUS = new Set([
  "nuevo",
  "contactado",
  "seguimiento",
  "llamada",
  "venta",
  "no_interesado",
  "cerrado_tiempo",
]);

const VALID_LEAD_ORIGIN = new Set(["whatsapp", "facebook_ads", "manual", "campaign"]);
const VALID_TASK_STATUS = new Set(["pendiente", "completada", "vencida", "cancelada"]);
const VALID_CALL_RESULT = new Set([
  "venta",
  "interesado",
  "no_interesado",
  "no_contesta",
  "cortada",
  "numero_incorrecto",
]);

async function fetchAll(client, table, select) {
  const pageSize = 1000;
  let from = 0;
  let done = false;
  const rows = [];

  while (!done) {
    const to = from + pageSize - 1;
    const { data, error } = await client.from(table).select(select).range(from, to);
    if (error) {
      throw new Error(`[${table}] ${error.message}`);
    }
    if (!data || data.length === 0) {
      done = true;
    } else {
      rows.push(...data);
      if (data.length < pageSize) {
        done = true;
      }
      from += pageSize;
    }
  }

  return rows;
}

async function tableExists(client, table) {
  const { error } = await client.from(table).select("*").limit(1);
  return !error;
}

async function main() {
  if (!fs.existsSync(envPath)) {
    throw new Error("No se encontro .env en la raiz del proyecto.");
  }

  const env = loadEnv(envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false },
  });

  const requiredTables = [
    "countries",
    "profiles",
    "leads",
    "conversations",
    "messages",
    "tasks",
    "calls",
    "lead_status_history",
    "task_history",
    "audit_logs",
  ];

  const tableChecks = await Promise.all(
    requiredTables.map(async (t) => ({ table: t, ok: await tableExists(supabase, t) }))
  );

  const missingTables = tableChecks.filter((item) => !item.ok).map((item) => item.table);

  if (missingTables.length > 0) {
    console.log(JSON.stringify({ ok: false, phase: "schema", missingTables }, null, 2));
    process.exitCode = 1;
    return;
  }

  const [countries, profiles, leads, conversations, messages, tasks, calls, leadHistory] =
    await Promise.all([
      fetchAll(supabase, "countries", "id,name,code"),
      fetchAll(supabase, "profiles", "id,email,role,country_id"),
      fetchAll(
        supabase,
        "leads",
        "id,nombre,telefono,pais,origen,administrador_id,agente_id,estado_actual,fecha_estado,created_at"
      ),
      fetchAll(supabase, "conversations", "id,lead_id,last_message,updated_at"),
      fetchAll(supabase, "messages", "id,conversation_id,body,direction,created_at"),
      fetchAll(supabase, "tasks", "id,lead_id,agente_id,tipo_tarea,estado,fecha_creacion"),
      fetchAll(supabase, "calls", "id,lead_id,result"),
      fetchAll(supabase, "lead_status_history", "id,lead_id,estado,usuario_id"),
    ]);

  const leadIds = new Set(leads.map((l) => l.id));
  const conversationIds = new Set(conversations.map((c) => c.id));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const countryById = new Map(countries.map((c) => [c.id, c]));

  const orphanConversations = conversations.filter((c) => !leadIds.has(c.lead_id));
  const orphanMessages = messages.filter((m) => !conversationIds.has(m.conversation_id));
  const orphanTasks = tasks.filter((t) => !leadIds.has(t.lead_id));
  const orphanCalls = calls.filter((c) => !leadIds.has(c.lead_id));
  const orphanLeadHistory = leadHistory.filter((h) => !leadIds.has(h.lead_id));

  const leadById = new Map(leads.map((lead) => [lead.id, lead]));

  const leadsWithoutConversation = leads.filter(
    (lead) => !conversations.some((conversation) => conversation.lead_id === lead.id)
  );

  const phoneCounts = keyCount(leads, (lead) => normalizePhone(lead.telefono));
  const duplicatePhones = [...phoneCounts.entries()]
    .filter(([phone, count]) => phone && count > 1)
    .map(([phone, count]) => ({ phone, count }));

  const pendingTaskCounts = keyCount(
    tasks.filter((task) => task.estado === "pendiente"),
    (task) => `${task.lead_id}::${task.tipo_tarea}`
  );
  const duplicatePendingTasks = [...pendingTaskCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => {
      const [leadId, tipo] = key.split("::");
      return { leadId, tipoTarea: tipo, count };
    });

  const invalidLeadStatus = leads
    .filter((lead) => !VALID_LEAD_STATUS.has(lead.estado_actual))
    .map((lead) => ({ leadId: lead.id, estado: lead.estado_actual }));

  const invalidLeadOrigin = leads
    .filter((lead) => lead.origen && !VALID_LEAD_ORIGIN.has(lead.origen))
    .map((lead) => ({ leadId: lead.id, origen: lead.origen }));

  const invalidTaskStatus = tasks
    .filter((task) => !VALID_TASK_STATUS.has(task.estado))
    .map((task) => ({ taskId: task.id, estado: task.estado }));

  const invalidCallResult = calls
    .filter((call) => !VALID_CALL_RESULT.has(call.result))
    .map((call) => ({ callId: call.id, result: call.result }));

  const invalidMessageDirection = messages
    .filter((message) => message.direction !== "inbound" && message.direction !== "outbound")
    .map((message) => ({ messageId: message.id, direction: message.direction }));

  const adminAssignmentIssues = [];
  const agentAssignmentIssues = [];
  const countryAssignmentMismatches = [];

  for (const lead of leads) {
    const admin = profileById.get(lead.administrador_id);
    const agent = profileById.get(lead.agente_id);

    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      adminAssignmentIssues.push({ leadId: lead.id, adminId: lead.administrador_id });
    }

    if (!agent || agent.role !== "agente") {
      agentAssignmentIssues.push({ leadId: lead.id, agentId: lead.agente_id });
    }

    if (admin?.country_id) {
      const adminCountry = countryById.get(admin.country_id)?.name || null;
      if (adminCountry && adminCountry !== lead.pais) {
        countryAssignmentMismatches.push({
          leadId: lead.id,
          scope: "admin",
          leadPais: lead.pais,
          profileCountry: adminCountry,
        });
      }
    }

    if (agent?.country_id) {
      const agentCountry = countryById.get(agent.country_id)?.name || null;
      if (agentCountry && agentCountry !== lead.pais) {
        countryAssignmentMismatches.push({
          leadId: lead.id,
          scope: "agente",
          leadPais: lead.pais,
          profileCountry: agentCountry,
        });
      }
    }
  }

  const latestMessageByConversation = new Map();
  for (const message of messages) {
    const current = latestMessageByConversation.get(message.conversation_id);
    if (!current || new Date(message.created_at).getTime() > new Date(current.created_at).getTime()) {
      latestMessageByConversation.set(message.conversation_id, message);
    }
  }

  const conversationLastMessageMismatch = conversations
    .map((conversation) => {
      const lastMessage = latestMessageByConversation.get(conversation.id);
      if (!lastMessage) return null;
      const dbLast = (conversation.last_message || "").trim();
      const realLast = (lastMessage.body || "").trim();
      if (dbLast !== realLast) {
        return {
          conversationId: conversation.id,
          stored: dbLast,
          actual: realLast,
        };
      }
      return null;
    })
    .filter(Boolean);

  const summary = {
    ok:
      orphanConversations.length === 0 &&
      orphanMessages.length === 0 &&
      orphanTasks.length === 0 &&
      orphanCalls.length === 0 &&
      orphanLeadHistory.length === 0 &&
      invalidLeadStatus.length === 0 &&
      invalidLeadOrigin.length === 0 &&
      invalidTaskStatus.length === 0 &&
      invalidCallResult.length === 0 &&
      invalidMessageDirection.length === 0 &&
      adminAssignmentIssues.length === 0 &&
      agentAssignmentIssues.length === 0 &&
      duplicatePendingTasks.length === 0,
    totals: {
      countries: countries.length,
      profiles: profiles.length,
      leads: leads.length,
      conversations: conversations.length,
      messages: messages.length,
      tasks: tasks.length,
      calls: calls.length,
      leadStatusHistory: leadHistory.length,
    },
    issues: {
      orphanConversations: orphanConversations.length,
      orphanMessages: orphanMessages.length,
      orphanTasks: orphanTasks.length,
      orphanCalls: orphanCalls.length,
      orphanLeadHistory: orphanLeadHistory.length,
      leadsWithoutConversation: leadsWithoutConversation.length,
      duplicatePhones: duplicatePhones.length,
      duplicatePendingTasks: duplicatePendingTasks.length,
      invalidLeadStatus: invalidLeadStatus.length,
      invalidLeadOrigin: invalidLeadOrigin.length,
      invalidTaskStatus: invalidTaskStatus.length,
      invalidCallResult: invalidCallResult.length,
      invalidMessageDirection: invalidMessageDirection.length,
      adminAssignmentIssues: adminAssignmentIssues.length,
      agentAssignmentIssues: agentAssignmentIssues.length,
      countryAssignmentMismatches: countryAssignmentMismatches.length,
      conversationLastMessageMismatch: conversationLastMessageMismatch.length,
    },
    samples: {
      duplicatePhones: duplicatePhones.slice(0, 10),
      duplicatePendingTasks: duplicatePendingTasks.slice(0, 10),
      adminAssignmentIssues: adminAssignmentIssues.slice(0, 10),
      agentAssignmentIssues: agentAssignmentIssues.slice(0, 10),
      countryAssignmentMismatches: countryAssignmentMismatches.slice(0, 10),
      conversationLastMessageMismatch: conversationLastMessageMismatch.slice(0, 10),
      leadsWithoutConversation: leadsWithoutConversation.slice(0, 10).map((lead) => ({
        leadId: lead.id,
        telefono: lead.telefono,
        pais: lead.pais,
      })),
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("[supabase-consistency-check]", error.message);
  process.exitCode = 1;
});
