#!/usr/bin/env node
/**
 * Copia catálogo (categorías, productos, variantes e imágenes) desde Supabase
 * PRODUCCIÓN → local. Solo lectura en producción; escritura únicamente en local.
 *
 * Requisitos:
 * - Supabase local corriendo (`supabase start`)
 * - .env.local con URL/keys LOCALES
 * - Credenciales de producción (solo lectura):
 *     SUPABASE_PROD_URL + SUPABASE_PROD_SERVICE_ROLE_KEY
 *   o proyecto enlazado: `supabase link` + npm run sync:catalog:from-prod:remote
 *
 * Uso:
 *   node scripts/sync-catalog-prod-to-local.mjs
 *   node scripts/sync-catalog-prod-to-local.mjs --fresh-catalog
 *   node scripts/sync-catalog-prod-to-local.mjs --skip-images
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BATCH = 400;
const IMAGE_BUCKET = "product-images";

function loadEnvFile(filename) {
  const p = join(root, filename);
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

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function assertLocalTarget(url) {
  const h = hostnameOf(url);
  if (h !== "127.0.0.1" && h !== "localhost") {
    console.error(
      "ABORTO: el destino local debe ser 127.0.0.1 o localhost.",
      `Recibido: ${url}`,
    );
    console.error("No se escribirá nada para evitar tocar producción por error.");
    process.exit(1);
  }
}

function assertRemoteSource(url) {
  const h = hostnameOf(url);
  if (h === "127.0.0.1" || h === "localhost") {
    console.error(
      "ABORTO: la fuente de producción no puede ser localhost.",
    );
    process.exit(1);
  }
}

function normalizeStoragePath(raw) {
  if (typeof raw !== "string") return null;
  const p = raw.trim();
  if (!p || /^https?:\/\//i.test(p)) return null;
  if (p.startsWith(`${IMAGE_BUCKET}/`)) return p;
  return `${IMAGE_BUCKET}/${p.replace(/^\//, "")}`;
}

function collectPathsFromProduct(product) {
  const out = new Set();
  const add = (v) => {
    const n = normalizeStoragePath(v);
    if (n) out.add(n);
  };

  add(product.image_path);

  const paths = product.image_paths;
  if (Array.isArray(paths)) {
    for (const p of paths) add(p);
  }

  const fragImgs = product.fragrance_option_images;
  if (fragImgs && typeof fragImgs === "object" && !Array.isArray(fragImgs)) {
    for (const v of Object.values(fragImgs)) add(v);
  }

  return out;
}

function collectPathsFromVariant(variant) {
  const out = new Set();
  const paths = variant.image_paths;
  if (Array.isArray(paths)) {
    for (const p of paths) {
      const n = normalizeStoragePath(p);
      if (n) out.add(n);
    }
  }
  return out;
}

async function fetchAllRows(client, table, select = "*") {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .range(from, from + BATCH - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return rows;
}

function stripRowForUpsert(table, row) {
  const copy = { ...row };
  if (table === "products") {
    delete copy.stock_quantity;
  }
  return copy;
}

async function upsertBatches(client, table, rows, onConflict = "id") {
  if (!rows.length) return 0;
  let n = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows
      .slice(i, i + BATCH)
      .map((row) => stripRowForUpsert(table, row));
    const { error } = await client.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
    n += chunk.length;
  }
  return n;
}

async function clearLocalCatalog(local) {
  console.log("Limpiando catálogo local (productos, variantes, categorías)…");
  const del = async (table) => {
    const { error } = await local
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`delete ${table}: ${error.message}`);
  };
  await del("product_variants");
  await del("products");
  await del("categories");
}

async function copyImage(prodBase, local, storagePath) {
  const objectKey = storagePath.replace(/^product-images\//, "");
  const publicUrl = `${prodBase.replace(/\/$/, "")}/storage/v1/object/public/${storagePath}`;

  const res = await fetch(publicUrl);
  if (!res.ok) {
    return { ok: false, reason: `HTTP ${res.status}` };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const contentType =
    res.headers.get("content-type") || "application/octet-stream";

  const { error } = await local.storage.from(IMAGE_BUCKET).upload(objectKey, buf, {
    contentType,
    upsert: true,
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env.production.local");

  const args = new Set(process.argv.slice(2));
  const freshCatalog = args.has("--fresh-catalog");
  const skipImages = args.has("--skip-images");

  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const localKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const prodUrl = process.env.SUPABASE_PROD_URL?.trim();
  const prodKey = process.env.SUPABASE_PROD_SERVICE_ROLE_KEY?.trim();

  if (!localUrl || !localKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }
  if (!prodUrl || !prodKey) {
    console.error(
      "Faltan SUPABASE_PROD_URL y SUPABASE_PROD_SERVICE_ROLE_KEY.",
      "Agrégalas a .env.production.local (no se commitean) o usa:",
      "npm run sync:catalog:from-prod:remote",
    );
    process.exit(1);
  }

  assertLocalTarget(localUrl);
  assertRemoteSource(prodUrl);

  if (localUrl === prodUrl) {
    console.error("ABORTO: URL local y producción son iguales.");
    process.exit(1);
  }

  const prod = createClient(prodUrl, prodKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const local = createClient(localUrl, localKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("═".repeat(60));
  console.log("Sincronización PRODUCCIÓN → LOCAL (solo lectura en prod)");
  console.log(`  Origen:  ${prodUrl}`);
  console.log(`  Destino: ${localUrl}`);
  console.log("═".repeat(60));

  if (freshCatalog) {
    await clearLocalCatalog(local);
  }

  console.log("Leyendo categorías de producción…");
  const categories = await fetchAllRows(prod, "categories");
  console.log(`  ${categories.length} categorías`);

  console.log("Leyendo productos de producción…");
  const products = await fetchAllRows(prod, "products");
  console.log(`  ${products.length} productos`);

  console.log("Leyendo variantes de producción…");
  const variants = await fetchAllRows(prod, "product_variants");
  console.log(`  ${variants.length} variantes`);

  console.log("Escribiendo en local…");
  const nCat = await upsertBatches(local, "categories", categories);
  const nProd = await upsertBatches(local, "products", products);
  const nVar = await upsertBatches(local, "product_variants", variants);
  console.log(`  ✓ ${nCat} categorías, ${nProd} productos, ${nVar} variantes`);

  if (skipImages) {
    console.log("Imágenes omitidas (--skip-images).");
    console.log("Listo.");
    return;
  }

  const imagePaths = new Set();
  for (const p of products) {
    for (const path of collectPathsFromProduct(p)) imagePaths.add(path);
  }
  for (const v of variants) {
    for (const path of collectPathsFromVariant(v)) imagePaths.add(path);
  }

  console.log(`Copiando ${imagePaths.size} imágenes a storage local…`);
  let ok = 0;
  let fail = 0;
  let i = 0;
  for (const path of imagePaths) {
    i += 1;
    const result = await copyImage(prodUrl, local, path);
    if (result.ok) {
      ok += 1;
    } else {
      fail += 1;
      console.warn(`  ⚠ ${path}: ${result.reason}`);
    }
    if (i % 25 === 0 || i === imagePaths.size) {
      process.stdout.write(`\r  ${i}/${imagePaths.size} procesadas…`);
    }
  }
  console.log(`\n  ✓ ${ok} imágenes copiadas${fail ? `, ${fail} fallidas` : ""}`);
  console.log("\nListo. Producción no fue modificada.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
