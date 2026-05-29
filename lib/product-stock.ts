import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchProductVariantsForProduct,
  parseProductVariantAxis,
  type ProductVariant,
} from "@/lib/product-variants";

export type StockLocations = {
  stockLocal: number;
  stockWarehouse: number;
};

/** Descuenta cantidad: primero local, luego bodega. */
export function deductFromStockLocations(
  local: number,
  warehouse: number,
  quantity: number,
): StockLocations {
  let l = Math.max(0, Math.floor(local));
  let w = Math.max(0, Math.floor(warehouse));
  let q = Math.max(0, Math.floor(quantity));

  const takeL = Math.min(l, q);
  l -= takeL;
  q -= takeL;
  const takeW = Math.min(w, q);
  w -= takeW;

  return { stockLocal: l, stockWarehouse: w };
}

export async function fetchProductVariantStockContext(
  supabase: SupabaseClient,
  productId: string,
): Promise<{ usesVariants: boolean; variants: ProductVariant[] }> {
  const { data: product } = await supabase
    .from("products")
    .select("variant_axis")
    .eq("id", productId)
    .maybeSingle();

  const axis = parseProductVariantAxis(product?.variant_axis);
  const variants = await fetchProductVariantsForProduct(supabase, productId);
  return {
    usesVariants: axis !== "none" && variants.length > 0,
    variants,
  };
}

/** Sincroniza products.stock_local / stock_warehouse con la suma de variantes. */
export async function syncProductStockTotalsFromVariants(
  supabase: SupabaseClient,
  productId: string,
): Promise<StockLocations> {
  const { data: rows, error } = await supabase
    .from("product_variants")
    .select("stock_local,stock_warehouse")
    .eq("product_id", productId);

  if (error) {
    console.error("[syncProductStockTotalsFromVariants]", error.message);
    return { stockLocal: 0, stockWarehouse: 0 };
  }

  let stockLocal = 0;
  let stockWarehouse = 0;
  for (const row of rows ?? []) {
    stockLocal += Math.max(0, Math.floor(Number(row.stock_local ?? 0)));
    stockWarehouse += Math.max(0, Math.floor(Number(row.stock_warehouse ?? 0)));
  }

  await supabase
    .from("products")
    .update({
      stock_local: stockLocal,
      stock_warehouse: stockWarehouse,
    })
    .eq("id", productId);

  return { stockLocal, stockWarehouse };
}

async function updateVariantStock(
  supabase: SupabaseClient,
  variantId: string,
  stockLocal: number,
  stockWarehouse: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("product_variants")
    .update({
      stock_local: Math.max(0, Math.floor(stockLocal)),
      stock_warehouse: Math.max(0, Math.floor(stockWarehouse)),
    })
    .eq("id", variantId)
    .select("product_id")
    .maybeSingle();

  if (error) {
    console.error("[updateVariantStock]", error.message);
    return null;
  }
  return (data?.product_id as string | undefined) ?? null;
}

/** Descuenta stock de una variante (local → bodega) y sincroniza el producto padre. */
export async function deductVariantStock(
  supabase: SupabaseClient,
  variantId: string,
  quantity: number,
): Promise<boolean> {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty <= 0) return true;

  const { data: row, error } = await supabase
    .from("product_variants")
    .select("id,product_id,stock_local,stock_warehouse")
    .eq("id", variantId)
    .maybeSingle();

  if (error || !row) {
    console.error("[deductVariantStock] fetch", error?.message);
    return false;
  }

  const next = deductFromStockLocations(
    Number(row.stock_local ?? 0),
    Number(row.stock_warehouse ?? 0),
    qty,
  );

  const productId = await updateVariantStock(
    supabase,
    variantId,
    next.stockLocal,
    next.stockWarehouse,
  );
  if (!productId) return false;

  await syncProductStockTotalsFromVariants(supabase, productId);
  return true;
}

/** Descuenta stock del producto sin variantes (local → bodega). */
export async function deductProductStock(
  supabase: SupabaseClient,
  productId: string,
  quantity: number,
): Promise<boolean> {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty <= 0) return true;

  const { data: prod, error } = await supabase
    .from("products")
    .select("stock_local,stock_warehouse")
    .eq("id", productId)
    .maybeSingle();

  if (error || !prod) {
    console.error("[deductProductStock] fetch", error?.message);
    return false;
  }

  const next = deductFromStockLocations(
    Number(prod.stock_local ?? 0),
    Number(prod.stock_warehouse ?? 0),
    qty,
  );

  const { error: updErr } = await supabase
    .from("products")
    .update({
      stock_local: next.stockLocal,
      stock_warehouse: next.stockWarehouse,
    })
    .eq("id", productId);

  if (updErr) {
    console.error("[deductProductStock] update", updErr.message);
    return false;
  }
  return true;
}

/**
 * POS / ventas sin variant_id: descuenta solo del stock local de variantes, en orden.
 */
export async function deductVariantLocalStockInOrder(
  supabase: SupabaseClient,
  productId: string,
  quantity: number,
): Promise<boolean> {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty <= 0) return true;

  const { variants } = await fetchProductVariantStockContext(supabase, productId);
  let remaining = qty;

  for (const v of variants) {
    if (remaining <= 0) break;
    const available = Math.max(0, v.stockLocal);
    const take = Math.min(available, remaining);
    if (take <= 0) continue;

    const productIdFromRow = await updateVariantStock(
      supabase,
      v.id,
      v.stockLocal - take,
      v.stockWarehouse,
    );
    if (!productIdFromRow) return false;
    remaining -= take;
  }

  if (remaining > 0) return false;

  await syncProductStockTotalsFromVariants(supabase, productId);
  return true;
}

/** Descuenta una línea de pedido (tienda online con variant_id o producto simple). */
export async function deductStockForOrderItem(
  supabase: SupabaseClient,
  productId: string,
  variantId: string | null | undefined,
  quantity: number,
): Promise<boolean> {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty <= 0) return true;

  if (variantId) {
    return deductVariantStock(supabase, variantId, qty);
  }

  const { usesVariants, variants } = await fetchProductVariantStockContext(
    supabase,
    productId,
  );

  if (usesVariants) {
    if (variants.length === 1) {
      return deductVariantStock(supabase, variants[0]!.id, qty);
    }
    console.warn(
      "[deductStockForOrderItem] producto con variantes sin variant_id",
      productId,
    );
    return deductVariantLocalStockInOrder(supabase, productId, qty);
  }

  return deductProductStock(supabase, productId, qty);
}

export type VariantStockRow = {
  id: string;
  label: string;
  stockLocal: number;
  stockWarehouse: number;
};

export async function fetchVariantStockRowsForAdmin(
  supabase: SupabaseClient,
  productId: string,
): Promise<{ usesVariants: boolean; variants: VariantStockRow[] }> {
  const ctx = await fetchProductVariantStockContext(supabase, productId);
  return {
    usesVariants: ctx.usesVariants,
    variants: ctx.variants.map((v) => ({
      id: v.id,
      label: v.label,
      stockLocal: v.stockLocal,
      stockWarehouse: v.stockWarehouse,
    })),
  };
}

export async function adjustVariantStockLocation(
  supabase: SupabaseClient,
  variantId: string,
  location: "local" | "warehouse",
  movementMode: "replace" | "add",
  quantity: number,
): Promise<{ ok: true; productId: string } | { ok: false }> {
  const { data: row, error } = await supabase
    .from("product_variants")
    .select("id,product_id,stock_local,stock_warehouse")
    .eq("id", variantId)
    .maybeSingle();

  if (error || !row) return { ok: false };

  const curLocal = Math.max(0, Math.floor(Number(row.stock_local ?? 0)));
  const curWh = Math.max(0, Math.floor(Number(row.stock_warehouse ?? 0)));
  const qty = Math.max(0, Math.floor(quantity));

  let nextLocal = curLocal;
  let nextWh = curWh;

  if (location === "warehouse") {
    nextWh = movementMode === "add" ? curWh + qty : qty;
  } else {
    nextLocal = movementMode === "add" ? curLocal + qty : qty;
  }

  const productId = await updateVariantStock(
    supabase,
    variantId,
    nextLocal,
    nextWh,
  );
  if (!productId) return { ok: false };

  await syncProductStockTotalsFromVariants(supabase, productId);
  return { ok: true, productId };
}

export async function transferVariantStock(
  supabase: SupabaseClient,
  variantId: string,
  direction: "local_to_warehouse" | "warehouse_to_local",
  quantity: number,
): Promise<{ ok: true; productId: string } | { ok: false }> {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty < 1) return { ok: false };

  const { data: row, error } = await supabase
    .from("product_variants")
    .select("id,product_id,stock_local,stock_warehouse")
    .eq("id", variantId)
    .maybeSingle();

  if (error || !row) return { ok: false };

  let curLocal = Math.max(0, Math.floor(Number(row.stock_local ?? 0)));
  let curWh = Math.max(0, Math.floor(Number(row.stock_warehouse ?? 0)));

  const fromLocal = direction === "local_to_warehouse";
  const available = fromLocal ? curLocal : curWh;
  if (qty > available) return { ok: false };

  if (fromLocal) {
    curLocal -= qty;
    curWh += qty;
  } else {
    curWh -= qty;
    curLocal += qty;
  }

  const productId = await updateVariantStock(
    supabase,
    variantId,
    curLocal,
    curWh,
  );
  if (!productId) return { ok: false };

  await syncProductStockTotalsFromVariants(supabase, productId);
  return { ok: true, productId };
}

export type VariantStockSnapshot = {
  id: string;
  stockLocal: number;
  stockWarehouse: number;
};

export async function snapshotVariantStockForProduct(
  supabase: SupabaseClient,
  productId: string,
): Promise<VariantStockSnapshot[]> {
  const { data } = await supabase
    .from("product_variants")
    .select("id,stock_local,stock_warehouse")
    .eq("product_id", productId);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    stockLocal: Math.max(0, Math.floor(Number(row.stock_local ?? 0))),
    stockWarehouse: Math.max(0, Math.floor(Number(row.stock_warehouse ?? 0))),
  }));
}

export async function restoreVariantStockSnapshots(
  supabase: SupabaseClient,
  productId: string,
  snapshots: VariantStockSnapshot[],
): Promise<void> {
  for (const snap of snapshots) {
    await updateVariantStock(
      supabase,
      snap.id,
      snap.stockLocal,
      snap.stockWarehouse,
    );
  }
  await syncProductStockTotalsFromVariants(supabase, productId);
}
