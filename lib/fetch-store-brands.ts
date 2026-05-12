import type { SupabaseClient } from "@supabase/supabase-js";

export type StoreBrandSummary = {
  /** Valor exacto de `products.brand` (trim) para enlazar a `/products?brand=`. */
  name: string;
  productCount: number;
};

/**
 * Marcas con al menos un producto publicado, orden alfabético (es).
 */
export async function fetchPublishedBrandsWithCounts(
  supabase: SupabaseClient,
): Promise<StoreBrandSummary[]> {
  const { data: rows, error } = await supabase
    .from("products")
    .select("brand")
    .eq("is_published", true);

  if (error || !rows?.length) return [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = String(row.brand ?? "").trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, productCount]) => ({ name, productCount }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
