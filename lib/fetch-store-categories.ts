import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCategoryIconKey, type CategoryIconKey } from "@/lib/category-icons";
import { buildCategoryTree } from "@/lib/category-tree";
import {
  getStoreCategoryVisual,
  type StoreCategoryVisual,
} from "@/lib/store-category-visuals";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type StoreCategoryMenuChild = {
  id: string;
  name: string;
  productCount: number;
};

export type StoreCategoryMenuItem = {
  id: string;
  name: string;
  sort_order: number;
  iconKey: CategoryIconKey;
  productCount: number;
  children: StoreCategoryMenuChild[];
} & StoreCategoryVisual;

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  icon_key: string | null;
  parent_id: string | null;
};

async function loadStoreCategoriesWithCounts(
  supabase: SupabaseClient,
): Promise<StoreCategoryMenuItem[]> {
  const [{ data: categories, error: catErr }, countsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,sort_order,icon_key,parent_id")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.rpc("store_category_product_counts"),
  ]);

  if (catErr || !categories?.length) {
    // Compat sin parent_id
    if (catErr && /parent_id/i.test(catErr.message)) {
      const flat = await supabase
        .from("categories")
        .select("id,name,sort_order,icon_key")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (flat.error || !flat.data?.length) return [];
      return loadFromRows(
        flat.data.map((c) => ({ ...c, parent_id: null })),
        countsRes,
      );
    }
    return [];
  }

  return loadFromRows(categories as CategoryRow[], countsRes);
}

function loadFromRows(
  categories: CategoryRow[],
  countsRes: {
    data: { category_id: string; product_count: number }[] | null;
    error: { message: string; code?: string } | null;
  },
): StoreCategoryMenuItem[] {
  const countByCategory = new Map<string, number>();
  if (countsRes.error) {
    console.error(
      "[store-categories] counts rpc:",
      countsRes.error.message,
      countsRes.error.code,
    );
  } else {
    for (const row of countsRes.data ?? []) {
      const cid = row.category_id as string | null;
      if (!cid) continue;
      countByCategory.set(cid, Number(row.product_count) || 0);
    }
  }

  const tree = buildCategoryTree(categories);
  const merged: StoreCategoryMenuItem[] = [];
  let visualIndex = 0;

  for (const { parent, children } of tree) {
    const childItems: StoreCategoryMenuChild[] = children.map((child) => ({
      id: child.id,
      name: child.name,
      productCount: countByCategory.get(child.id) ?? 0,
    }));

    const ownCount = countByCategory.get(parent.id) ?? 0;
    const childrenCount = childItems.reduce((s, c) => s + c.productCount, 0);
    const productCount = ownCount + childrenCount;

    const visual = getStoreCategoryVisual(parent.name, visualIndex);
    visualIndex += 1;

    merged.push({
      id: parent.id,
      name: parent.name,
      sort_order: parent.sort_order ?? 0,
      iconKey: resolveCategoryIconKey(parent.icon_key),
      productCount,
      children: childItems.filter((c) => c.productCount > 0),
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

/** Cache entre requests (menú Shop). Incluye jerarquía. */
const getCachedStoreCategoriesWithCounts = unstable_cache(
  async () => {
    const supabase = createSupabaseServiceClient();
    return loadStoreCategoriesWithCounts(supabase);
  },
  ["store-categories-with-counts-v2"],
  { revalidate: 60 },
);

/**
 * Categorías del catálogo para el menú Shop (raíces + subcategorías con stock).
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
