import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreListingProductRow } from "@/lib/store-products-listing-query";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PRODUCT_SELECT =
  "id,name,brand,description,price_cents,image_path,image_paths,stock_quantity,fragrance_options,variant_axis,size_options,size_value,size_unit,created_at,category_id";

const HOME_BESTSELLERS_LIMIT = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type QtyByProduct = Map<string, number>;

function tryServiceClient(): SupabaseClient | null {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    return createSupabaseServiceClient();
  } catch {
    return null;
  }
}

async function paidOrderIdsSince(
  service: SupabaseClient,
  sinceIso: string,
): Promise<string[]> {
  const { data, error } = await service
    .from("orders")
    .select("id")
    .eq("status", "paid")
    .gte("created_at", sinceIso)
    .limit(500);
  if (error) {
    console.error("[home] bestsellers orders:", error.message);
    return [];
  }
  return (data ?? [])
    .map((o) => (typeof o.id === "string" ? o.id : null))
    .filter((id): id is string => Boolean(id));
}

async function qtyByProductFromOrders(
  service: SupabaseClient,
  orderIds: string[],
): Promise<QtyByProduct> {
  const qty = new Map<string, number>();
  if (orderIds.length === 0) return qty;

  const chunk = 80;
  for (let i = 0; i < orderIds.length; i += chunk) {
    const slice = orderIds.slice(i, i + chunk);
    const { data, error } = await service
      .from("order_items")
      .select("product_id,quantity")
      .in("order_id", slice);
    if (error) {
      console.error("[home] bestsellers items:", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const pid = row.product_id;
      if (typeof pid !== "string" || !pid) continue;
      const q = Math.max(0, Number(row.quantity ?? 0));
      qty.set(pid, (qty.get(pid) ?? 0) + q);
    }
  }
  return qty;
}

function rankedProductIds(qty: QtyByProduct): string[] {
  return [...qty.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

async function fetchPublishedByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<StoreListingProductRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .in("id", ids);
  if (error) {
    console.error("[home] bestsellers products:", error.message);
    return [];
  }
  const byId = new Map(
    (data ?? []).map((p) => [p.id as string, p as StoreListingProductRow]),
  );
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is StoreListingProductRow => Boolean(p));
}

async function fetchPublishedFallback(
  supabase: SupabaseClient,
  limit: number,
  excludeIds: Set<string>,
): Promise<StoreListingProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(Math.max(limit + excludeIds.size, limit));
  if (error) {
    console.error("[home] bestsellers fallback:", error.message);
    return [];
  }
  return ((data ?? []) as StoreListingProductRow[])
    .filter((p) => !excludeIds.has(p.id))
    .slice(0, limit);
}

/**
 * Productos más vendidos (pedidos `paid`) en la última semana.
 * Si no hay ventas recientes, completa con publicados recientes.
 */
export async function fetchHomeBestsellersWeek(
  storefront: SupabaseClient,
  limit = HOME_BESTSELLERS_LIMIT,
): Promise<StoreListingProductRow[]> {
  const service = tryServiceClient();
  let rankedIds: string[] = [];

  if (service) {
    const weekSince = new Date(Date.now() - WEEK_MS).toISOString();
    let orderIds = await paidOrderIdsSince(service, weekSince);

    if (orderIds.length === 0) {
      const monthSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      orderIds = await paidOrderIdsSince(service, monthSince);
    }

    const qty = await qtyByProductFromOrders(service, orderIds);
    rankedIds = rankedProductIds(qty).slice(0, limit * 2);
  }

  const fromSales = await fetchPublishedByIds(
    storefront,
    rankedIds.slice(0, limit),
  );
  if (fromSales.length >= limit) return fromSales.slice(0, limit);

  const have = new Set(fromSales.map((p) => p.id));
  const fill = await fetchPublishedFallback(
    storefront,
    limit - fromSales.length,
    have,
  );
  return [...fromSales, ...fill].slice(0, limit);
}
