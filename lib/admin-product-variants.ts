import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { syncProductStockTotalsFromVariants } from "@/lib/product-stock";
import {
  MAX_PRODUCT_IMAGES_PER_GROUP,
  parseFragranceImagesExistingField,
  primaryImagePath,
} from "@/lib/product-images";
import {
  parseProductVariantAxis,
  type ProductVariantAxis,
} from "@/lib/product-variants";

function extFromFilename(name: string) {
  const i = name.lastIndexOf(".");
  if (i < 0) return "jpg";
  return name.slice(i + 1).toLowerCase().slice(0, 8) || "jpg";
}

async function uploadVariantImage(
  supabase: SupabaseClient,
  productId: string,
  blob: Blob,
): Promise<string | null> {
  if (!(blob instanceof Blob) || blob.size <= 0) return null;
  const ext =
    typeof File !== "undefined" && blob instanceof File
      ? extFromFilename(blob.name)
      : "jpg";
  const buf = Buffer.from(await blob.arrayBuffer());
  const objectPath = `${productId}/variants/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(objectPath, buf, {
      contentType: blob.type || undefined,
      upsert: true,
    });
  if (error) {
    console.error("variant image upload", error.message);
    return null;
  }
  return `product-images/${objectPath}`;
}

export type ParsedVariantFormRow = {
  id: string | null;
  label: string;
  priceCents: number;
  costCents: number;
  stockWarehouse: number;
  stockLocal: number;
  imagePaths: string[];
};

export function parseVariantAxisFromForm(formData: FormData): ProductVariantAxis {
  return parseProductVariantAxis(formData.get("variant_axis"));
}

export function parseVariantRowsFromFormData(
  formData: FormData,
): ParsedVariantFormRow[] {
  const labels = formData.getAll("variant_label").map((v) => String(v).trim());
  const ids = formData.getAll("variant_id").map((v) => String(v).trim());
  const prices = formData.getAll("variant_price_cents");
  const costs = formData.getAll("variant_cost_cents");
  const wh = formData.getAll("variant_stock_warehouse");
  const loc = formData.getAll("variant_stock_local");
  const existingRows = formData
    .getAll("variant_images_existing")
    .map((v) => parseFragranceImagesExistingField(String(v)));

  const n = Math.max(labels.length, ids.length);
  const rows: ParsedVariantFormRow[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < n; i++) {
    const label = (labels[i] ?? "").slice(0, 160);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const idRaw = ids[i]?.trim();
    const id =
      idRaw && /^[0-9a-f-]{36}$/i.test(idRaw) ? idRaw : null;

    rows.push({
      id,
      label,
      priceCents: Math.max(0, Math.round(Number(prices[i] ?? 0))),
      costCents: Math.max(0, Math.round(Number(costs[i] ?? 0))),
      stockWarehouse: Math.max(0, Math.floor(Number(wh[i] ?? 0))),
      stockLocal: Math.max(0, Math.floor(Number(loc[i] ?? 0))),
      imagePaths: (existingRows[i] ?? []).slice(0, MAX_PRODUCT_IMAGES_PER_GROUP),
    });
  }

  return rows;
}

export async function buildVariantImagePathsFromForm(
  supabase: SupabaseClient,
  productId: string,
  formData: FormData,
  rowIndex: number,
  existing: string[],
): Promise<string[]> {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const p of existing) {
    if (!p || seen.has(p) || paths.length >= MAX_PRODUCT_IMAGES_PER_GROUP) continue;
    seen.add(p);
    paths.push(p);
  }
  const files = formData.getAll(`variant_option_image_${rowIndex}`);
  for (const file of files) {
    if (paths.length >= MAX_PRODUCT_IMAGES_PER_GROUP) break;
    if (!(file instanceof Blob) || file.size <= 0) continue;
    const path = await uploadVariantImage(supabase, productId, file);
    if (path && !seen.has(path)) {
      seen.add(path);
      paths.push(path);
    }
  }
  return paths;
}

export async function syncProductVariantsFromForm(
  supabase: SupabaseClient,
  productId: string,
  formData: FormData,
  variantAxis: ProductVariantAxis,
): Promise<{
  minPriceCents: number;
  minCostCents: number;
  totalStockWh: number;
  totalStockLoc: number;
}> {
  const parsed = parseVariantRowsFromFormData(formData);

  if (variantAxis === "none" || parsed.length === 0) {
    await supabase.from("product_variants").delete().eq("product_id", productId);
    return { minPriceCents: 0, minCostCents: 0, totalStockWh: 0, totalStockLoc: 0 };
  }

  const labelsInForm = parsed.map((r) => r.label);
  const { data: existingRows } = await supabase
    .from("product_variants")
    .select("id,label")
    .eq("product_id", productId);

  const keepIds = new Set(parsed.filter((r) => r.id).map((r) => r.id!));
  for (const ex of existingRows ?? []) {
    if (!keepIds.has(ex.id as string)) {
      await supabase.from("product_variants").delete().eq("id", ex.id);
    }
  }

  let minPrice = Number.POSITIVE_INFINITY;
  let minCost = Number.POSITIVE_INFINITY;
  let totalWh = 0;
  let totalLoc = 0;

  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i]!;
    const imagePaths = await buildVariantImagePathsFromForm(
      supabase,
      productId,
      formData,
      i,
      row.imagePaths,
    );

    const payload = {
      product_id: productId,
      label: row.label,
      price_cents: row.priceCents,
      cost_cents: row.costCents,
      stock_warehouse: row.stockWarehouse,
      stock_local: row.stockLocal,
      image_paths: imagePaths,
      sort_order: i,
    };

    if (row.id) {
      await supabase.from("product_variants").update(payload).eq("id", row.id);
    } else {
      await supabase.from("product_variants").insert(payload);
    }

    minPrice = Math.min(minPrice, row.priceCents);
    minCost = Math.min(minCost, row.costCents);
    totalWh += row.stockWarehouse;
    totalLoc += row.stockLocal;
  }

  if (labelsInForm.length > 0) {
    const { data: after } = await supabase
      .from("product_variants")
      .select("id,label")
      .eq("product_id", productId);
    for (const v of after ?? []) {
      const lbl = String(v.label ?? "").trim();
      if (!labelsInForm.some((l) => l.toLowerCase() === lbl.toLowerCase())) {
        await supabase.from("product_variants").delete().eq("id", v.id);
      }
    }
  }

  await syncProductStockTotalsFromVariants(supabase, productId);

  return {
    minPriceCents: Number.isFinite(minPrice) ? minPrice : 0,
    minCostCents: Number.isFinite(minCost) ? minCost : 0,
    totalStockWh: totalWh,
    totalStockLoc: totalLoc,
  };
}