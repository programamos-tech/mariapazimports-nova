import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreListingProductRow } from "@/lib/store-products-listing-query";

const EMPTY_BRAND_KEY = "__empty_brand__";

export type StoreBrandCatalogProduct = StoreListingProductRow;

export type StoreBrandCatalogSection = {
  id: string;
  title: string;
  brandFilter: string | null;
  products: StoreBrandCatalogProduct[];
};

/** Marca ignorada en la vista por marcas (sin texto o marcador típico). */
export function isUsableStoreBrand(raw: unknown): boolean {
  const s = String(raw ?? "").trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (s === "-" || s === "—" || s === "–" || lower === "n/a" || lower === "sin marca")
    return false;
  return true;
}

function sectionKeyFromBrand(raw: unknown): string {
  const s = String(raw ?? "").trim();
  return s.length ? s : EMPTY_BRAND_KEY;
}

function sectionTitle(key: string): string {
  if (key === EMPTY_BRAND_KEY) return "Sin marca";
  return key;
}

function slugFragment(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Agrupa filas ya filtradas/ordenadas (p. ej. salida de `fetchPublishedProductsForListing`). */
export function groupPublishedProductsByBrand(
  rows: StoreBrandCatalogProduct[],
): StoreBrandCatalogSection[] {
  if (!rows.length) return [];

  const byKey = new Map<string, StoreBrandCatalogProduct[]>();
  for (const row of rows) {
    if (!isUsableStoreBrand(row.brand)) continue;
    const key = sectionKeyFromBrand(row.brand);
    const list = byKey.get(key) ?? [];
    list.push({
      ...row,
      brand: String(row.brand ?? "").trim(),
    });
    byKey.set(key, list);
  }

  const keys = [...byKey.keys()].filter((k) => k !== EMPTY_BRAND_KEY);
  keys.sort((a, b) =>
    sectionTitle(a).localeCompare(sectionTitle(b), "es", {
      sensitivity: "base",
    }),
  );

  return keys.map((key, index) => {
    const products = byKey.get(key) ?? [];
    const frag = slugFragment(sectionTitle(key)) || "marca";
    const id = `${frag}-${index}`;
    const brandFilter = key === EMPTY_BRAND_KEY ? null : key;
    return {
      id,
      title: sectionTitle(key),
      brandFilter,
      products,
    };
  });
}

/**
 * Productos publicados con marca usable, agrupados alfabéticamente por marca.
 */
export async function fetchPublishedCatalogGroupedByBrand(
  supabase: SupabaseClient,
): Promise<StoreBrandCatalogSection[]> {
  const { data: rows, error } = await supabase
    .from("products")
    .select(
      "id,name,brand,description,price_cents,image_path,stock_quantity,size_options,size_value,size_unit,fragrance_options,created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const products: StoreBrandCatalogProduct[] = [];
  for (const row of rows) {
    if (!isUsableStoreBrand(row.brand)) continue;
    products.push({
      id: row.id as string,
      name: row.name as string,
      brand: String(row.brand ?? "").trim(),
      description: row.description as string | null,
      price_cents: row.price_cents as number,
      image_path: row.image_path as string | null,
      stock_quantity: row.stock_quantity as number,
      size_options: row.size_options,
      size_value: row.size_value as number | null,
      size_unit: row.size_unit as string | null,
      fragrance_options: row.fragrance_options as string[] | null,
      created_at: String(row.created_at ?? ""),
    });
  }

  return groupPublishedProductsByBrand(products);
}
