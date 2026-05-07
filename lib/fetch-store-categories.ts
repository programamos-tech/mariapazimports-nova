import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCategoryIconKey, type CategoryIconKey } from "@/lib/category-icons";
import {
  getStoreCategoryVisual,
  type StoreCategoryVisual,
} from "@/lib/store-category-visuals";

export type StoreCategoryMenuItem = {
  id: string;
  name: string;
  sort_order: number;
  iconKey: CategoryIconKey;
  productCount: number;
} & StoreCategoryVisual;

/**
 * Categorias publicadas en admin, con conteo de productos publicados por categoria.
 */
export async function fetchStoreCategoriesWithCounts(
  supabase: SupabaseClient,
): Promise<StoreCategoryMenuItem[]> {
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id,name,sort_order,icon_key")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (catErr || !categories?.length) return [];

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_published", true);

  if (prodErr) return [];

  const countByCategory = new Map<string, number>();
  for (const row of products ?? []) {
    const cid = row.category_id as string | null;
    if (!cid) continue;
    countByCategory.set(cid, (countByCategory.get(cid) ?? 0) + 1);
  }

  return categories.map((c, i) => {
    const visual = getStoreCategoryVisual(c.name, i);
    return {
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      iconKey: resolveCategoryIconKey(c.icon_key),
      productCount: countByCategory.get(c.id) ?? 0,
      ...visual,
    };
  });
}
