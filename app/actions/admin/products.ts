"use server";

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

async function uploadProductImageFromForm(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  formData: FormData,
): Promise<ImageUploadResult> {
  const raw = formData.get("image");
  if (raw == null || typeof raw === "string") {
    return { status: "none" };
  }
  if (!(raw instanceof Blob) || raw.size <= 0) {
    return { status: "none" };
  }

  const ext =
    typeof File !== "undefined" && raw instanceof File
      ? extFromFilename(raw.name)
      : "jpg";
  const buf = Buffer.from(await raw.arrayBuffer());
  const objectPath = `${productId}/${randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(objectPath, buf, {
      contentType: raw.type || undefined,
      upsert: true,
    });

  if (upErr) {
    console.error("product-images upload", upErr.message, upErr);
    return { status: "error", message: upErr.message };
  }

  return { status: "ok", imagePath: `product-images/${objectPath}` };
}

function parseNonNegInt(v: FormDataEntryValue | null) {
  return Math.max(0, Math.floor(Number(v ?? 0)));
}

function parseMoneyCents(v: FormDataEntryValue | null) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function isSchemaColumnError(err: { message?: string; code?: string } | null) {
  if (err?.code === "42703") return true;
  const m = err?.message ?? "";
  if (m.includes("schema cache") || m.includes("Could not find the")) return true;
  if (/column .* does not exist/i.test(m)) return true;
  if (
    /column/i.test(m) &&
    /reference|brand|cost_cents|stock_warehouse|stock_local|category_id/i.test(m)
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
  };

  const extendedRow = {
    ...baseRow,
    reference,
    brand,
    cost_cents,
  };

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
    baseRow,
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
  const uploaded = await uploadProductImageFromForm(supabase, id, formData);
  if (uploaded.status === "ok") {
    await supabase
      .from("products")
      .update({ image_path: uploaded.imagePath })
      .eq("id", id);
  } else if (uploaded.status === "error") {
    revalidatePath("/products");
    revalidatePath("/admin/products");
    redirect("/admin/products?saved=1&uploadError=1");
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

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

  if (!name) {
    redirect(`/admin/products/${productId}/edit?error=name`);
  }
  if (!reference) {
    redirect(`/admin/products/${productId}/edit?error=reference`);
  }

  const baseUpdate = {
    name,
    description,
    price_cents,
    stock_warehouse: stockWarehouse,
    stock_local: stockLocal,
    is_published: isPublished,
    category_id,
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

  if (error) {
    console.error("updateProduct", error?.message ?? error);
    if (isRlsError(error)) {
      redirect(`/admin/products/${productId}/edit?error=rls`);
    }
    redirect(`/admin/products/${productId}/edit?error=db`);
  }

  const uploaded = await uploadProductImageFromForm(supabase, productId, formData);
  if (uploaded.status === "ok") {
    await supabase
      .from("products")
      .update({ image_path: uploaded.imagePath })
      .eq("id", productId);
  } else if (uploaded.status === "error") {
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/admin/products");
    redirect("/admin/products?saved=1&uploadError=1");
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(productId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

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

  const location = String(formData.get("location") ?? "local");
  const movementMode = String(formData.get("movement_mode") ?? "replace");
  const qty = parseNonNegInt(
    formData.get("quantity") ?? formData.get("new_quantity"),
  );

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

  const isWarehouse = location === "warehouse";
  const isAdd = movementMode === "add";

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

  const direction = String(formData.get("direction") ?? "local_to_warehouse");
  const qty = parseNonNegInt(formData.get("quantity"));

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

  const fromLocal = direction === "local_to_warehouse";
  const available = fromLocal ? curLocal : curWh;

  const transferPage = `/admin/products/${productId}/transfer`;
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

  const returnTo = safeStockAdjustReturnTo(String(formData.get("return_to") ?? ""));

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/transfer`);
  redirect(returnTo);
}
