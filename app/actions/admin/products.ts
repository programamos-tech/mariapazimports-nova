"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import {
  STOCK_LOCAL_SHORT_LABEL,
  STOCK_TRANSFER_TO_LOCAL,
  STOCK_TRANSFER_TO_WAREHOUSE,
  STOCK_WAREHOUSE_SHORT_LABEL,
} from "@/lib/stock-locations";
import {
  MAX_PRODUCT_IMAGES_PER_GROUP,
  parseFragranceImagesExistingField,
  primaryImagePath,
} from "@/lib/product-images";
import {
  parseVariantAxisFromForm,
  parseVariantRowsFromFormData,
  syncProductVariantsFromForm,
} from "@/lib/admin-product-variants";
import {
  legacySizeFromOptions,
  parseSizeOptionsFromFormData,
} from "@/lib/product-size-options";
import type { ProductVariantAxis } from "@/lib/product-variants";
import {
  adjustVariantStockLocation,
  fetchProductVariantStockContext,
  transferVariantStock,
} from "@/lib/product-stock";
import { assertActionPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

function extFromFilename(name: string) {
  const i = name.lastIndexOf(".");
  if (i < 0) return "jpg";
  return name.slice(i + 1).toLowerCase().slice(0, 8) || "jpg";
}

type ImageUploadResult =
  | { status: "none" }
  | { status: "ok"; imagePath: string }
  | { status: "error"; message: string };

async function uploadProductImageBlob(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  blob: Blob,
  filenameHint?: string,
): Promise<ImageUploadResult> {
  if (!(blob instanceof Blob) || blob.size <= 0) {
    return { status: "none" };
  }

  const ext =
    typeof File !== "undefined" && blob instanceof File
      ? extFromFilename(blob.name)
      : filenameHint
        ? extFromFilename(filenameHint)
        : "jpg";
  const buf = Buffer.from(await blob.arrayBuffer());
  const objectPath = `${productId}/${randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(objectPath, buf, {
      contentType: blob.type || undefined,
      upsert: true,
    });

  if (upErr) {
    console.error("product-images upload", upErr.message, upErr);
    return { status: "error", message: upErr.message };
  }

  return { status: "ok", imagePath: `product-images/${objectPath}` };
}

async function buildProductImagePathsFromForm(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  formData: FormData,
): Promise<{ paths: string[]; uploadError: boolean }> {
  const existing = formData
    .getAll("image_paths_existing")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const p of existing) {
    if (seen.has(p) || paths.length >= MAX_PRODUCT_IMAGES_PER_GROUP) continue;
    seen.add(p);
    paths.push(p);
  }

  let uploadError = false;
  const files = formData.getAll("image");
  for (const file of files) {
    if (paths.length >= MAX_PRODUCT_IMAGES_PER_GROUP) break;
    if (!(file instanceof Blob) || file.size <= 0) continue;
    const up = await uploadProductImageBlob(
      supabase,
      productId,
      file,
      typeof File !== "undefined" && file instanceof File ? file.name : undefined,
    );
    if (up.status === "ok" && !seen.has(up.imagePath)) {
      seen.add(up.imagePath);
      paths.push(up.imagePath);
    } else if (up.status === "error") {
      console.error("product image upload", up.message);
      uploadError = true;
    }
  }

  return { paths, uploadError };
}

/** Imágenes por fila de fragancia (hasta 5 por opción). */
async function buildFragranceOptionImagesFromForm(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  formData: FormData,
  fragrance_options: string[],
): Promise<Record<string, string[]>> {
  const rawLabels = formData.getAll("fragrance_option").map((v) => String(v));
  const existingRows = formData
    .getAll("fragrance_images_existing")
    .map((v) => parseFragranceImagesExistingField(String(v)));
  const n = Math.max(rawLabels.length, existingRows.length);
  const rowPathsList: string[][] = [];

  for (let i = 0; i < n; i++) {
    const seen = new Set<string>();
    const paths: string[] = [];
    for (const p of existingRows[i] ?? []) {
      if (seen.has(p) || paths.length >= MAX_PRODUCT_IMAGES_PER_GROUP) continue;
      seen.add(p);
      paths.push(p);
    }

    const files = formData.getAll(`fragrance_option_image_${i}`);
    for (const file of files) {
      if (paths.length >= MAX_PRODUCT_IMAGES_PER_GROUP) break;
      if (!(file instanceof Blob) || file.size <= 0) continue;
      const up = await uploadProductImageBlob(
        supabase,
        productId,
        file,
        typeof File !== "undefined" && file instanceof File ? file.name : undefined,
      );
      if (up.status === "ok" && !seen.has(up.imagePath)) {
        seen.add(up.imagePath);
        paths.push(up.imagePath);
      } else if (up.status === "error") {
        console.error("fragrance image upload", up.message);
      }
    }
    rowPathsList.push(paths);
  }

  const out: Record<string, string[]> = {};
  for (const canon of fragrance_options) {
    const k = canon.toLowerCase();
    for (let j = 0; j < rawLabels.length; j++) {
      const t = rawLabels[j]?.trim().slice(0, 160) ?? "";
      if (!t || t.toLowerCase() !== k) continue;
      const list = rowPathsList[j];
      if (list?.length) out[canon] = list;
      break;
    }
  }
  return out;
}

function parseNonNegInt(v: FormDataEntryValue | null) {
  return Math.max(0, Math.floor(Number(v ?? 0)));
}

function parseMoneyCents(v: FormDataEntryValue | null) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function parseExpirationDate(v: FormDataEntryValue | null): string | null {
  const raw = String(v ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function parseVatPercent(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const clamped = Math.min(100, Math.max(0, n));
  return Number(clamped.toFixed(2));
}

function parseColors(v: FormDataEntryValue | null): string[] {
  const raw = String(v ?? "").trim();
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const c = part.trim().slice(0, 32);
    if (!c) continue;
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function parseColorsFromFormData(formData: FormData): string[] {
  const raw = formData
    .getAll("colors")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (raw.length === 0) {
    return parseColors(formData.get("colors_csv"));
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of raw) {
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c.slice(0, 32));
  }
  return out;
}

function parseFragranceOptionsFromFormData(formData: FormData): string[] {
  const multi = formData
    .getAll("fragrance_option")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (multi.length > 0) {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const f of multi) {
      const t = f.slice(0, 160);
      const k = t.toLowerCase();
      if (!t || seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }
  const raw = String(formData.get("fragrance_options_csv") ?? "").trim();
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    const f = part.trim().slice(0, 160);
    if (!f) continue;
    const key = f.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

function isSchemaColumnError(err: { message?: string; code?: string } | null) {
  if (err?.code === "42703") return true;
  const m = err?.message ?? "";
  if (m.includes("schema cache") || m.includes("Could not find the")) return true;
  if (/column .* does not exist/i.test(m)) return true;
  if (
    /column/i.test(m) &&
    /reference|brand|cost_cents|stock_warehouse|stock_local|category_id|size_value|size_unit|size_options|has_expiration|expiration_date|colors|fragrance_options|fragrance_option_images|image_paths|has_vat|vat_percent|variant_axis/i.test(m)
  ) {
    return true;
  }
  return false;
}

function isGeneratedStockError(err: { message?: string; code?: string } | null) {
  const m = (err?.message ?? "").toLowerCase();
  return (
    err?.code === "428C9" ||
    m.includes("generated column") ||
    (m.includes("cannot insert a non-default value") && m.includes("stock_quantity"))
  );
}

function isFkCategoryError(err: { message?: string } | null) {
  const m = (err?.message ?? "").toLowerCase();
  return m.includes("category_id") && m.includes("foreign key");
}

/** Rutas seguras post stock / traslado (evita open redirect). */
function safeStockAdjustReturnTo(raw: string): string {
  const s = raw.trim();
  if (s === "/admin/products") return s;
  if (/^\/admin\/products\/[0-9a-f-]{36}(\/(stock|transfer))?$/i.test(s)) return s;
  return "/admin/products";
}

function legacyOptionsFromVariants(
  variantAxis: ProductVariantAxis,
  labels: string[],
) {
  if (variantAxis === "fragrance" || variantAxis === "tone") {
    return { fragrance_options: labels, size_options: [] as { value: number; unit: string }[] };
  }
  if (variantAxis === "size") {
    const size_options = labels
      .map((label) => {
        const m = label.trim().match(/^([\d.,]+)\s*(\S+)$/);
        if (!m) return null;
        const value = Number(m[1]!.replace(",", "."));
        const unit = m[2]!.toLowerCase();
        if (!Number.isFinite(value) || value <= 0 || !unit) return null;
        return { value, unit };
      })
      .filter((x): x is { value: number; unit: string } => x !== null);
    const { size_value, size_unit } = legacySizeFromOptions(size_options);
    return {
      fragrance_options: [] as string[],
      size_options,
      size_value,
      size_unit,
    };
  }
  return {
    fragrance_options: [] as string[],
    size_options: [] as { value: number; unit: string }[],
  };
}

async function applyVariantSyncFromForm(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  formData: FormData,
  variantAxis: ProductVariantAxis,
  fallbackPriceCents: number,
  fallbackCostCents: number,
  fallbackStockWh: number,
  fallbackStockLoc: number,
) {
  const sync = await syncProductVariantsFromForm(
    supabase,
    productId,
    formData,
    variantAxis,
  );
  const parsed = parseVariantRowsFromFormData(formData);
  const labels = parsed.map((r) => r.label);
  const legacy = legacyOptionsFromVariants(variantAxis, labels);

  const patch: Record<string, unknown> = {
    variant_axis: variantAxis,
    ...legacy,
  };

  if (variantAxis !== "none" && parsed.length > 0) {
    patch.price_cents = sync.minPriceCents || fallbackPriceCents;
    patch.cost_cents = sync.minCostCents || fallbackCostCents;
    patch.stock_warehouse = sync.totalStockWh;
    patch.stock_local = sync.totalStockLoc;
  } else {
    patch.price_cents = fallbackPriceCents;
    patch.cost_cents = fallbackCostCents;
    patch.stock_warehouse = fallbackStockWh;
    patch.stock_local = fallbackStockLoc;
  }

  await supabase.from("products").update(patch).eq("id", productId);
}

function isRlsError(err: { message?: string; code?: string } | null) {
  const m = (err?.message ?? "").toLowerCase();
  return (
    m.includes("row-level security") ||
    m.includes("rls policy") ||
    m.includes("violates row-level") ||
    m.includes("permission denied") ||
    err?.code === "42501"
  );
}

async function insertProductWithOptionalCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>,
) {
  let { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();
  if (error && isFkCategoryError(error) && payload.category_id) {
    ({ data, error } = await supabase
      .from("products")
      .insert({ ...payload, category_id: null })
      .select("id")
      .single());
  }
  return { data, error };
}

export async function createProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("productos_crear");

  const name = String(formData.get("name") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const price_cents = parseMoneyCents(formData.get("price_cents"));
  const cost_cents = parseMoneyCents(formData.get("cost_cents"));
  const stockWarehouse = parseNonNegInt(formData.get("stock_warehouse"));
  const stockLocal = parseNonNegInt(formData.get("stock_local"));
  const isPublished = formData.get("is_published") === "on";
  const categoryRaw = String(formData.get("category_id") ?? "").trim();
  const category_id = categoryRaw ? categoryRaw : null;
  const size_options = parseSizeOptionsFromFormData(formData);
  const { size_value, size_unit } = legacySizeFromOptions(size_options);
  const has_expiration = formData.get("has_expiration") === "on";
  const expiration_date = has_expiration
    ? parseExpirationDate(formData.get("expiration_date"))
    : null;
  const has_vat = formData.get("has_vat") === "on";
  const vat_percent = has_vat ? parseVatPercent(formData.get("vat_percent")) : null;
  const colors = parseColorsFromFormData(formData);
  const fragrance_options = parseFragranceOptionsFromFormData(formData);
  const variantAxis = parseVariantAxisFromForm(formData);

  if (!name) {
    redirect("/admin/products/new?error=name");
  }
  if (!reference) {
    redirect("/admin/products/new?error=reference");
  }

  const baseRow = {
    name,
    description,
    price_cents,
    stock_warehouse: stockWarehouse,
    stock_local: stockLocal,
    is_published: isPublished,
    category_id,
    size_value,
    size_unit,
    size_options,
    has_expiration,
    expiration_date,
    has_vat,
    vat_percent,
    colors,
    fragrance_options,
    fragrance_option_images: {} as Record<string, string>,
    variant_axis: variantAxis,
  };

  const extendedRow = {
    ...baseRow,
    reference,
    brand,
    cost_cents,
  };

  const { size_options: _omitSizeExt, ...extendedRowNoSizeOptions } =
    extendedRow as Record<string, unknown>;
  const { size_options: _omitSizeBase, ...baseRowNoSizeOptions } = baseRow as Record<
    string,
    unknown
  >;

  const legacyStockRow = {
    name,
    description,
    price_cents,
    stock_quantity: stockWarehouse + stockLocal,
    is_published: isPublished,
    category_id,
  };

  const legacyStockRowNoCategory = {
    name,
    description,
    price_cents,
    stock_quantity: stockWarehouse + stockLocal,
    is_published: isPublished,
  };

  const payloads: Record<string, unknown>[] = [
    extendedRow,
    extendedRowNoSizeOptions,
    baseRow,
    baseRowNoSizeOptions,
    legacyStockRow,
    legacyStockRowNoCategory,
  ];

  let row: { id: string } | null = null;
  let error: { message?: string; code?: string } | null = null;

  for (const payload of payloads) {
    const res = await insertProductWithOptionalCategory(supabase, payload);
    error = res.error;
    if (!res.error && res.data) {
      row = res.data as { id: string };
      break;
    }
    if (error && isRlsError(error)) break;
    if (error && isGeneratedStockError(error)) break;
    if (error && !isSchemaColumnError(error)) break;
  }

  if (error || !row) {
    console.error("createProduct", error?.code, error?.message ?? error);
    if (isRlsError(error)) {
      redirect("/admin/products/new?error=rls");
    }
    redirect("/admin/products/new?error=db");
  }

  const id = row.id as string;
  await logAdminActivity(supabase, {
    actorId: user.id,
    actionType: "product_created",
    entityType: "product",
    entityId: id,
    summary: `Nuevo producto: ${name} (${reference})`,
    metadata: { price_cents, stock_warehouse: stockWarehouse, stock_local: stockLocal },
  });
  revalidatePath("/admin/actividades");
  const fragranceImagesMap = await buildFragranceOptionImagesFromForm(
    supabase,
    id,
    formData,
    fragrance_options,
  );
  const { paths: imagePaths, uploadError: catalogUploadError } =
    await buildProductImagePathsFromForm(supabase, id, formData);

  const imagePatch: Record<string, unknown> = {
    image_paths: imagePaths,
    image_path: primaryImagePath(imagePaths),
  };
  if (Object.keys(fragranceImagesMap).length > 0) {
    imagePatch.fragrance_option_images = fragranceImagesMap;
  }
  await supabase.from("products").update(imagePatch).eq("id", id);

  await applyVariantSyncFromForm(
    supabase,
    id,
    formData,
    variantAxis,
    price_cents,
    cost_cents,
    stockWarehouse,
    stockLocal,
  );

  if (catalogUploadError) {
    revalidatePath("/products");
    revalidatePath("/admin/products");
    redirect(
      `/admin/products?saved=1&uploadError=1&created=${encodeURIComponent(id)}`,
    );
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect(`/admin/products?saved=1&created=${encodeURIComponent(id)}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("productos_editar");

  const name = String(formData.get("name") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const price_cents = parseMoneyCents(formData.get("price_cents"));
  const cost_cents = parseMoneyCents(formData.get("cost_cents"));
  const stockWarehouse = parseNonNegInt(formData.get("stock_warehouse"));
  const stockLocal = parseNonNegInt(formData.get("stock_local"));
  const isPublished = formData.get("is_published") === "on";
  const categoryRaw = String(formData.get("category_id") ?? "").trim();
  const category_id = categoryRaw ? categoryRaw : null;
  const size_options = parseSizeOptionsFromFormData(formData);
  const { size_value, size_unit } = legacySizeFromOptions(size_options);
  const has_expiration = formData.get("has_expiration") === "on";
  const expiration_date = has_expiration
    ? parseExpirationDate(formData.get("expiration_date"))
    : null;
  const has_vat = formData.get("has_vat") === "on";
  const vat_percent = has_vat ? parseVatPercent(formData.get("vat_percent")) : null;
  const colors = parseColorsFromFormData(formData);
  const fragrance_options = parseFragranceOptionsFromFormData(formData);
  const variantAxis = parseVariantAxisFromForm(formData);

  if (!name) {
    redirect(`/admin/products/${productId}/edit?error=name`);
  }
  if (!reference) {
    redirect(`/admin/products/${productId}/edit?error=reference`);
  }

  const fragrance_option_images = await buildFragranceOptionImagesFromForm(
    supabase,
    productId,
    formData,
    fragrance_options,
  );
  const { paths: imagePaths, uploadError: catalogUploadError } =
    await buildProductImagePathsFromForm(supabase, productId, formData);

  const baseUpdate = {
    name,
    description,
    price_cents,
    stock_warehouse: stockWarehouse,
    stock_local: stockLocal,
    is_published: isPublished,
    category_id,
    size_value,
    size_unit,
    size_options,
    has_expiration,
    expiration_date,
    has_vat,
    vat_percent,
    colors,
    fragrance_options,
    fragrance_option_images,
    image_paths: imagePaths,
    image_path: primaryImagePath(imagePaths),
    variant_axis: variantAxis,
  };

  const extendedUpdate = {
    ...baseUpdate,
    reference,
    brand,
    cost_cents,
  };

  let { error } = await supabase
    .from("products")
    .update(extendedUpdate)
    .eq("id", productId);

  if (error && isSchemaColumnError(error)) {
    ({ error } = await supabase
      .from("products")
      .update(baseUpdate)
      .eq("id", productId));
  }

  if (error && isSchemaColumnError(error)) {
    const { size_options: _x, ...extendedNoSize } = extendedUpdate as Record<
      string,
      unknown
    >;
    ({ error } = await supabase
      .from("products")
      .update(extendedNoSize)
      .eq("id", productId));
  }

  if (error && isSchemaColumnError(error)) {
    const { size_options: _y, ...baseNoSize } = baseUpdate as Record<
      string,
      unknown
    >;
    ({ error } = await supabase
      .from("products")
      .update(baseNoSize)
      .eq("id", productId));
  }

  if (error) {
    console.error("updateProduct", error?.message ?? error);
    if (isRlsError(error)) {
      redirect(`/admin/products/${productId}/edit?error=rls`);
    }
    redirect(`/admin/products/${productId}/edit?error=db`);
  }

  await applyVariantSyncFromForm(
    supabase,
    productId,
    formData,
    variantAxis,
    price_cents,
    cost_cents,
    stockWarehouse,
    stockLocal,
  );

  await logAdminActivity(supabase, {
    actorId: user.id,
    actionType: "product_updated",
    entityType: "product",
    entityId: productId,
    summary: `Producto actualizado: ${name} (${reference})`,
    metadata: { price_cents, stock_warehouse: stockWarehouse, stock_local: stockLocal },
  });
  revalidatePath("/admin/actividades");

  if (catalogUploadError) {
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/admin/products");
    redirect(
      `/admin/products?saved=1&uploadError=1&updated=${encodeURIComponent(productId)}`,
    );
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
  redirect(
    `/admin/products?saved=1&updated=${encodeURIComponent(productId)}`,
  );
}

export async function deleteProduct(productId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("productos_editar");

  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect("/admin/products");
}

export async function adjustProductStock(productId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("stock_actualizar");

  const location = String(formData.get("location") ?? "local");
  const movementMode = String(formData.get("movement_mode") ?? "replace");
  const qty = parseNonNegInt(
    formData.get("quantity") ?? formData.get("new_quantity"),
  );
  const variantIdRaw = String(formData.get("variant_id") ?? "").trim();
  const isWarehouse = location === "warehouse";
  const isAdd = movementMode === "add";
  const loc = isWarehouse ? ("warehouse" as const) : ("local" as const);
  const mode = isAdd ? ("add" as const) : ("replace" as const);

  const { usesVariants, variants } = await fetchProductVariantStockContext(
    supabase,
    productId,
  );

  if (usesVariants) {
    const variantId =
      variantIdRaw ||
      (variants.length === 1 ? variants[0]!.id : "");
    if (!variantId || !variants.some((v) => v.id === variantId)) {
      redirect(`/admin/products/${productId}/stock?error=variant`);
    }

    const before = variants.find((v) => v.id === variantId)!;
    const result = await adjustVariantStockLocation(
      supabase,
      variantId,
      loc,
      mode,
      qty,
    );
    if (!result.ok) redirect("/admin/products?error=stock");

    const { variants: afterVariants } = await fetchProductVariantStockContext(
      supabase,
      productId,
    );
    const after = afterVariants.find((v) => v.id === variantId);

    await logAdminActivity(supabase, {
      actorId: user.id,
      actionType: "stock_adjusted",
      entityType: "product",
      entityId: productId,
      summary: `Stock ${isWarehouse ? STOCK_WAREHOUSE_SHORT_LABEL : STOCK_LOCAL_SHORT_LABEL} · ${before.label} · ${isAdd ? "suma" : "reemplazo"} (${qty})`,
      metadata: {
        variant_id: variantId,
        variant_label: before.label,
        location: isWarehouse ? "warehouse" : "local",
        movement_mode: movementMode,
        quantity: qty,
        previous_local: before.stockLocal,
        previous_warehouse: before.stockWarehouse,
        next_local: after?.stockLocal ?? 0,
        next_warehouse: after?.stockWarehouse ?? 0,
      },
    });
  } else {
    const { data: row, error: fetchErr } = await supabase
      .from("products")
      .select("stock_local, stock_warehouse")
      .eq("id", productId)
      .maybeSingle();

    if (fetchErr || !row) {
      console.error("adjustProductStock fetch", fetchErr);
      redirect("/admin/products?error=stock");
    }

    const curLocal = Math.max(0, Math.floor(Number(row.stock_local ?? 0)));
    const curWh = Math.max(0, Math.floor(Number(row.stock_warehouse ?? 0)));

    let nextLocal = curLocal;
    let nextWh = curWh;

    if (isWarehouse) {
      nextWh = isAdd ? curWh + qty : qty;
    } else {
      nextLocal = isAdd ? curLocal + qty : qty;
    }

    nextLocal = Math.min(Math.max(0, nextLocal), Number.MAX_SAFE_INTEGER);
    nextWh = Math.min(Math.max(0, nextWh), Number.MAX_SAFE_INTEGER);

    const { error } = await supabase
      .from("products")
      .update({
        stock_local: nextLocal,
        stock_warehouse: nextWh,
      })
      .eq("id", productId);

    if (error) redirect("/admin/products?error=stock");

    await logAdminActivity(supabase, {
      actorId: user.id,
      actionType: "stock_adjusted",
      entityType: "product",
      entityId: productId,
      summary: `Stock ${isWarehouse ? STOCK_WAREHOUSE_SHORT_LABEL : STOCK_LOCAL_SHORT_LABEL} · ${isAdd ? "suma" : "reemplazo"} (${qty})`,
      metadata: {
        location: isWarehouse ? "warehouse" : "local",
        movement_mode: movementMode,
        quantity: qty,
        previous_local: curLocal,
        previous_warehouse: curWh,
        next_local: nextLocal,
        next_warehouse: nextWh,
      },
    });
  }

  revalidatePath("/admin/actividades");

  const returnTo = safeStockAdjustReturnTo(String(formData.get("return_to") ?? ""));

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/stock`);
  revalidatePath(`/admin/products/${productId}/transfer`);
  redirect(returnTo);
}

export async function transferProductStock(productId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("stock_transferir");

  const direction = String(formData.get("direction") ?? "local_to_warehouse");
  const qty = parseNonNegInt(formData.get("quantity"));
  const variantIdRaw = String(formData.get("variant_id") ?? "").trim();
  const transferDir =
    direction === "warehouse_to_local"
      ? ("warehouse_to_local" as const)
      : ("local_to_warehouse" as const);

  const transferPage = `/admin/products/${productId}/transfer`;
  const { usesVariants, variants } = await fetchProductVariantStockContext(
    supabase,
    productId,
  );

  if (usesVariants) {
    const variantId =
      variantIdRaw ||
      (variants.length === 1 ? variants[0]!.id : "");
    if (!variantId || !variants.some((v) => v.id === variantId)) {
      redirect(`${transferPage}?error=variant`);
    }

    const before = variants.find((v) => v.id === variantId)!;
    const result = await transferVariantStock(
      supabase,
      variantId,
      transferDir,
      qty,
    );
    if (!result.ok) redirect(`${transferPage}?error=transfer`);

    const { variants: afterVariants } = await fetchProductVariantStockContext(
      supabase,
      productId,
    );
    const after = afterVariants.find((v) => v.id === variantId);
    const fromLocal = transferDir === "local_to_warehouse";

    await logAdminActivity(supabase, {
      actorId: user.id,
      actionType: "stock_transferred",
      entityType: "product",
      entityId: productId,
      summary: `${fromLocal ? STOCK_TRANSFER_TO_WAREHOUSE : STOCK_TRANSFER_TO_LOCAL} · ${before.label} · ${qty} u.`,
      metadata: {
        variant_id: variantId,
        variant_label: before.label,
        direction,
        quantity: qty,
        previous_local: before.stockLocal,
        previous_warehouse: before.stockWarehouse,
        next_local: after?.stockLocal ?? 0,
        next_warehouse: after?.stockWarehouse ?? 0,
      },
    });
  } else {
    const { data: row, error: fetchErr } = await supabase
      .from("products")
      .select("stock_local, stock_warehouse")
      .eq("id", productId)
      .maybeSingle();

    if (fetchErr || !row) {
      console.error("transferProductStock fetch", fetchErr);
      redirect("/admin/products?error=stock");
    }

    const curLocal = Math.max(0, Math.floor(Number(row.stock_local ?? 0)));
    const curWh = Math.max(0, Math.floor(Number(row.stock_warehouse ?? 0)));

    const fromLocal = transferDir === "local_to_warehouse";
    const available = fromLocal ? curLocal : curWh;

    if (qty < 1 || qty > available) {
      redirect(`${transferPage}?error=transfer`);
    }

    let nextLocal = curLocal;
    let nextWh = curWh;
    if (fromLocal) {
      nextLocal = curLocal - qty;
      nextWh = curWh + qty;
    } else {
      nextWh = curWh - qty;
      nextLocal = curLocal + qty;
    }

    const { error } = await supabase
      .from("products")
      .update({
        stock_local: nextLocal,
        stock_warehouse: nextWh,
      })
      .eq("id", productId);

    if (error) redirect(`${transferPage}?error=transfer`);

    await logAdminActivity(supabase, {
      actorId: user.id,
      actionType: "stock_transferred",
      entityType: "product",
      entityId: productId,
      summary: `${fromLocal ? STOCK_TRANSFER_TO_WAREHOUSE : STOCK_TRANSFER_TO_LOCAL} · ${qty} u.`,
      metadata: {
        direction,
        quantity: qty,
        previous_local: curLocal,
        previous_warehouse: curWh,
        next_local: nextLocal,
        next_warehouse: nextWh,
      },
    });
  }

  revalidatePath("/admin/actividades");

  const returnTo = safeStockAdjustReturnTo(String(formData.get("return_to") ?? ""));

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/transfer`);
  redirect(returnTo);
}
