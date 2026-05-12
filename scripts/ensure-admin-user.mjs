#!/usr/bin/env node
/**
 * Crea usuario en Auth (email + password) y fila admin en public.profiles.
 * Usa NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY desde .env.local.
 * Opcional: archivo .env.cloud en la raíz (sobrescribe URL y service role → proyecto remoto).
 *
 * Uso:
 *   node scripts/ensure-admin-user.mjs correo@dominio.com contraseña
 *   npm run admin:ensure:remote -- correo@dominio.com contraseña
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvFromFile(absPath, { overwrite } = { overwrite: false }) {
  if (!existsSync(absPath)) return;
  const raw = readFileSync(absPath, "utf8");
  for (const line of raw.split("\n")) {
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
    if (overwrite) process.env[key] = val;
    else if (!process.env[key]) process.env[key] = val;
  }
}

function loadEnvLocal() {
  loadEnvFromFile(join(root, ".env.local"), { overwrite: false });
}

function loadEnvCloud() {
  loadEnvFromFile(join(root, ".env.cloud"), { overwrite: true });
}

loadEnvLocal();
loadEnvCloud();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.argv[2]?.trim();
const password = process.argv[3]?.trim();

if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local, .env.cloud o entorno).",
  );
  process.exit(1);
}
if (!email?.includes("@") || !password) {
  console.error(
    "Uso: node scripts/ensure-admin-user.mjs correo@dominio.com contraseña",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUserByEmail(target) {
  const want = target.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const users = data.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === want);
    if (hit) return hit;
    if (users.length < perPage) return null;
    page += 1;
    if (page > 50) return null;
  }
}

try {
  let userId;
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    userId = existing.id;
    const { error: uerr } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (uerr) throw uerr;
    console.log("Usuario ya existía; contraseña actualizada.");
  } else {
    const { data, error: cerr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cerr) throw cerr;
    userId = data.user.id;
    console.log("Usuario creado en Authentication.");
  }

  const { error: perr } = await supabase.from("profiles").upsert(
    { id: userId, role: "admin" },
    { onConflict: "id" },
  );

  if (perr) throw perr;

  console.log("\nAdmin listo:");
  console.log(`  email: ${email}`);
  console.log(`  id:    ${userId}`);
  console.log(
    "\nLa fila public.profiles quedó alineada con auth.users. Entrá en /admin/login (cerrá sesión de tienda si hace falta).",
  );
} catch (e) {
  console.error(e?.message ?? e);
  process.exit(1);
}
