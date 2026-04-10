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

async function tableExists(client, table) {
  const { error } = await client.from(table).select("id").limit(1);
  return !error;
}

async function getCount(client, table) {
  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`[${table}] count error: ${error.message}`);
  }

  return count || 0;
}

async function deleteAll(client, table) {
  const { error } = await client
    .from(table)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`[${table}] delete error: ${error.message}`);
  }
}

async function main() {
  const force = process.argv.includes("--yes");
  if (!force) {
    console.error("This operation deletes operational data. Re-run with --yes to confirm.");
    process.exit(1);
  }

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

  // Only operational/testing data. Keeps config catalogs and users.
  const cleanupOrder = [
    "messages",
    "conversations",
    "task_history",
    "tasks",
    "calls",
    "lead_status_history",
    "leads",
    "campaign_logs",
    "campaigns",
    "webhook_events",
    "audit_logs",
  ];

  const existingTables = [];
  for (const table of cleanupOrder) {
    if (await tableExists(supabase, table)) {
      existingTables.push(table);
    }
  }

  const before = {};
  for (const table of existingTables) {
    before[table] = await getCount(supabase, table);
  }

  for (const table of existingTables) {
    await deleteAll(supabase, table);
  }

  const after = {};
  for (const table of existingTables) {
    after[table] = await getCount(supabase, table);
  }

  const report = {
    ok: Object.values(after).every((value) => value === 0),
    tablesProcessed: existingTables,
    before,
    after,
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("[reset-operational-data]", error.message);
  process.exit(1);
});
