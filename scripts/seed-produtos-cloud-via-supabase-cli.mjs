#!/usr/bin/env node
/**
 * Ejecuta el seed del Excel contra el proyecto Supabase enlazado (`supabase link`),
 * usando la CLI para obtener la service role (no hace falta .env.cloud).
 *
 * Requiere: `supabase` en PATH y sesión iniciada; carpeta `supabase/.temp/project-ref`
 * tras `supabase link` (no se commitea).
 *
 * Opcional: SUPABASE_PROJECT_REF=xxxx si no existe project-ref local.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const refFromEnv = process.env.SUPABASE_PROJECT_REF?.trim();
const refPath = join(root, "supabase", ".temp", "project-ref");
const ref =
  refFromEnv ||
  (existsSync(refPath) ? readFileSync(refPath, "utf8").trim() : "");

if (!ref) {
  console.error(
    "No hay project ref: ejecuta `supabase link` en el repo o exporta SUPABASE_PROJECT_REF.",
  );
  process.exit(1);
}

const json = spawnSync(
  "supabase",
  ["projects", "api-keys", "--project-ref", ref, "-o", "json"],
  { encoding: "utf8", cwd: root },
);

if (json.status !== 0) {
  console.error(json.stderr || json.stdout || "supabase api-keys falló");
  process.exit(json.status ?? 1);
}

let keys;
try {
  keys = JSON.parse(json.stdout);
} catch {
  console.error("Respuesta JSON inválida de supabase projects api-keys");
  process.exit(1);
}

const serviceKey =
  keys.find(
    (k) =>
      typeof k.description === "string" &&
      k.description.toLowerCase().includes("service"),
  )?.api_key ?? keys.find((k) => k.name === "service_role")?.api_key;

if (!serviceKey) {
  console.error("No se encontró service_role en la salida de api-keys.");
  process.exit(1);
}

const url = `https://${ref}.supabase.co`;
const seedScript = join(__dirname, "seed-produtos-xlsx.mjs");

const r = spawnSync(process.execPath, [seedScript, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  },
});

process.exit(r.status ?? 1);
