import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCategoryIconKey, type CategoryIconKey } from "@/lib/category-icons";
import {
  categoryGroupKey,
  pickCanonicalCategoryId,
} from "@/lib/store-category-group";
import {
  getStoreCategoryVisual,
  type StoreCategoryVisual,
} from "@/lib/store-category-visuals";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type StoreCategoryMenuItem = {
  id: string;
  name: string;
  sort_order: number;
  iconKey: CategoryIconKey;
  productCount: number;
} & StoreCategoryVisual;

async function loadStoreCategoriesWithCounts(
  supabase: SupabaseClient,
): Promise<StoreCategoryMenuItem[]> {
  const [{ data: categories, error: catErr }, countsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,sort_order,icon_key")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.rpc("store_category_product_counts"),
  ]);

  if (catErr || !categories?.length) return [];

  const countByCategory = new Map<string, number>();
  const { data: countRows, error: countErr } = countsRes;
  if (countErr) {
    console.error(
      "[store-categories] counts rpc:",
      countErr.message,
      countErr.code,
    );
  } else {
    for (const row of countRows ?? []) {
      const cid = row.category_id as string | null;
      if (!cid) continue;
      countByCategory.set(cid, Number(row.product_count) || 0);
    }
  }

  const groups = new Map<string, typeof categories>();
  for (const c of categories) {
    const k = categoryGroupKey(c.name);
    const arr = groups.get(k) ?? [];
    arr.push(c);
    groups.set(k, arr);
  }

  const merged: StoreCategoryMenuItem[] = [];
  let visualIndex = 0;
  for (const [, arr] of groups) {
    const productCount = arr.reduce(
      (sum, c) => sum + (countByCategory.get(c.id) ?? 0),
      0,
    );

    const canonicalId = pickCanonicalCategoryId(arr) ?? arr[0]!.id;
    const winner = arr.find((c) => c.id === canonicalId) ?? arr[0]!;
    const minSort = Math.min(...arr.map((c) => c.sort_order));

    const visual = getStoreCategoryVisual(winner.name, visualIndex);
    visualIndex += 1;

    merged.push({
      id: canonicalId,
      name: winner.name,
      sort_order: minSort,
      iconKey: resolveCategoryIconKey(winner.icon_key),
      productCount,
      ...visual,
    });
  }

  merged.sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.name.localeCompare(b.name, "es"),
  );

  return merged;
}

/** Cache entre requests (menú Shop casi estático). */
const getCachedStoreCategoriesWithCounts = unstable_cache(
  async () => {
    const supabase = createSupabaseServiceClient();
    return loadStoreCategoriesWithCounts(supabase);
  },
  ["store-categories-with-counts-v1"],
  { revalidate: 60 },
);

/**
 * Categorías del catálogo para el menú Shop (fusiona duplicados / sinónimos).
 * Dedup por request + cache 60s entre navegaciones.
 */
export const fetchStoreCategoriesWithCounts = cache(
  async (_supabase?: SupabaseClient): Promise<StoreCategoryMenuItem[]> => {
    try {
      return await getCachedStoreCategoriesWithCounts();
    } catch (err) {
      console.error("[store-categories] cache fallback", err);
      const supabase = _supabase ?? createSupabaseServiceClient();
      return loadStoreCategoriesWithCounts(supabase);
    }
  },
);
