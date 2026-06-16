import type { SupabaseClient } from "@supabase/supabase-js";

export type StoreProductSuggestion = {
  id: string;
  name: string;
  priceCents: number;
  imagePath: string | null;
  colors: string[];
};

function normalizedColorList(colors: unknown): string[] {
  if (!Array.isArray(colors)) return [];
  return colors.filter(
    (c): c is string => typeof c === "string" && c.trim().length > 0,
  );
}

/** Productos publicados con stock para vitrinas tipo bolsa / seguimiento. */
export async function fetchStoreProductSuggestions(
  supabase: SupabaseClient,
  excludeIds: string[] = [],
  limit = 12,
): Promise<StoreProductSuggestion[]> {
  const exclude = new Set(excludeIds.filter(Boolean));
  const pool = Math.min(80, Math.max(32, limit + exclude.size + 16));

  const { data } = await supabase
    .from("products")
    .select("id,name,price_cents,image_path,colors,stock_quantity,created_at")
    .eq("is_published", true)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false })
    .limit(pool);

  return (data ?? [])
    .filter((row) => !exclude.has(row.id))
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: p.price_cents,
      imagePath: p.image_path,
      colors: normalizedColorList(p.colors),
    }));
}
