import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUsableStoreBrand } from "@/lib/fetch-store-catalog-by-brand";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type StoreBrandSummary = {
  /** Valor exacto de `products.brand` (trim) para enlazar a `/products?brand=`. */
  name: string;
  productCount: number;
};

/**
 * Marcas con al menos un producto publicado, orden alfabético (es).
 * Ignora placeholders (“-”, “sin marca”, etc.).
 */
async function loadPublishedBrandsWithCounts(
  supabase: SupabaseClient,
): Promise<StoreBrandSummary[]> {
  const { data: rows, error } = await supabase
    .from("products")
    .select("brand")
    .eq("is_published", true);

  if (error || !rows?.length) return [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!isUsableStoreBrand(row.brand)) continue;
    const name = String(row.brand ?? "").trim();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, productCount]) => ({ name, productCount }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Cache entre requests (menú Marcas). */
const getCachedPublishedBrandsWithCounts = unstable_cache(
  async () => {
    const supabase = createSupabaseServiceClient();
    return loadPublishedBrandsWithCounts(supabase);
  },
  ["store-published-brands-with-counts-v1"],
  { revalidate: 60 },
);

/**
 * Marcas con al menos un producto publicado, orden alfabético (es).
 * Ignora placeholders (“-”, “sin marca”, etc.).
 */
export const fetchPublishedBrandsWithCounts = cache(
  async (_supabase?: SupabaseClient): Promise<StoreBrandSummary[]> => {
    try {
      return await getCachedPublishedBrandsWithCounts();
    } catch (err) {
      console.error("[store-brands] cache fallback", err);
      const supabase = _supabase ?? createSupabaseServiceClient();
      return loadPublishedBrandsWithCounts(supabase);
    }
  },
);
