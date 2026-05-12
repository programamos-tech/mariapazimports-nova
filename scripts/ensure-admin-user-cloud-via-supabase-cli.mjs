#!/usr/bin/env node
/**
 * Igual que `seed-produtos-cloud-via-supabase-cli.mjs`: usa `supabase link` + CLI
 * para apuntar al proyecto remoto y ejecuta ensure-admin-user.mjs.
 *
 * Uso:
 *   npm run admin:ensure:remote -- mp@imports.com tuContraseña
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
const script = join(__dirname, "ensure-admin-user.mjs");

const r = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  },
});

process.exit(r.status ?? 1);
