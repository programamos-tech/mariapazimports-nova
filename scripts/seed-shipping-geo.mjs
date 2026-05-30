#!/usr/bin/env node
/**
 * Carga departamentos y municipios DIVIPOLA desde lib/data/colombia-divipola.json.
 * Usa SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (.env.local).
 *
 * Uso: node scripts/seed-shipping-geo.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const dataPath = join(root, "lib/data/colombia-divipola.json");
if (!existsSync(dataPath)) {
  console.error("Falta lib/data/colombia-divipola.json");
  process.exit(1);
}

/** @type {{ cod_dpto: string; dpto: string; cod_mpio: string; nom_mpio: string }[]} */
const rows = JSON.parse(readFileSync(dataPath, "utf8"));

function titleCaseWords(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const deptMap = new Map();
for (const r of rows) {
  const code = String(r.cod_dpto).padStart(2, "0");
  if (!deptMap.has(code)) {
    deptMap.set(code, titleCaseWords(String(r.dpto ?? "").trim()));
  }
}

const departments = [...deptMap.entries()]
  .map(([code, name]) => ({ code, name, sort_order: Number(code) }))
  .sort((a, b) => a.code.localeCompare(b.code));

const municipalities = rows.map((r) => {
  const department_code = String(r.cod_dpto).padStart(2, "0");
  const code = String(r.cod_mpio).padStart(5, "0");
  const name = titleCaseWords(String(r.nom_mpio ?? "").trim());
  const sort_order = Number(code.slice(2)) || 0;
  return {
    code,
    department_code,
    name,
    cost_cents: 0,
    is_delivery_enabled: true,
    sort_order,
  };
});

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH = 200;

async function upsertBatches(table, items, onConflict) {
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw error;
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH, items.length)}/${items.length}\r`);
  }
  process.stdout.write("\n");
}

try {
  console.log(`Supabase: ${url}`);
  console.log(`Departamentos: ${departments.length}, municipios: ${municipalities.length}`);

  await upsertBatches("shipping_departments", departments, "code");
  await upsertBatches("shipping_municipalities", municipalities, "code");

  console.log("\nListo. Configura tarifas en /admin/envios");
} catch (e) {
  console.error(e?.message ?? e);
  process.exit(1);
}
