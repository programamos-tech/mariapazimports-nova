import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeCategoryRowsForFilterMenu } from "@/lib/product-listing-facets";
import { expandCategoryIdsFromRows } from "@/lib/store-category-group";

const PRODUCT_SELECT =
  "id,name,brand,description,price_cents,image_path,stock_quantity,size_options,size_value,size_unit,fragrance_options,created_at";

/** Incluye `category_id` solo para armar la vitrina en servidor (no se expone al card). */
const PRODUCT_SELECT_WITH_CATEGORY = `${PRODUCT_SELECT},category_id`;

export const CATALOG_ROW_PREVIEW_LIMIT = 12;

export type CatalogBrowseProductRow = {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  stock_quantity: number;
  size_options?: unknown;
  size_value: number | null;
  size_unit: string | null;
  fragrance_options: string[] | null;
  created_at: string;
};

export type CatalogBrowseSection = {
  categoryId: string | null;
  categoryName: string;
  products: CatalogBrowseProductRow[];
  showSeeAll: boolean;
};

function sortProductsByCreatedAtDesc(a: CatalogBrowseProductRow, b: CatalogBrowseProductRow) {
  const ta = a.created_at;
  const tb = b.created_at;
  if (ta < tb) return 1;
  if (ta > tb) return -1;
  return 0;
}

/**
 * Vitrina por categorías: una sola lectura de productos publicados y agrupación en memoria.
 * Evita N consultas `.in("category_id", …)` (menos superficie de error con PostgREST / RLS)
 * y cubre sinónimos de categoría vía `expandCategoryIdsFromRows`.
 */
export async function fetchCatalogBrowseSections(
  supabase: SupabaseClient,
  allCategoryRows: { id: string; name: string; sort_order: number }[],
): Promise<CatalogBrowseSection[]> {
  if (!allCategoryRows.length) return [];

  const merged = mergeCategoryRowsForFilterMenu(allCategoryRows);
  const knownCategoryId = new Set(
    allCategoryRows.map((r) => r.id.trim().toLowerCase()),
  );

  const { data: allRows, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_CATEGORY)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[fetchCatalogBrowseSections] products:",
      error.message,
      error.code,
    );
    return [];
  }

  type RowWithCat = CatalogBrowseProductRow & { category_id: string | null };
  const rawList = (allRows ?? []) as RowWithCat[];

  const byCategoryId = new Map<string, CatalogBrowseProductRow[]>();
  const uncategorized: CatalogBrowseProductRow[] = [];

  for (const row of rawList) {
    const { category_id: cid, ...product } = row;
    const key = typeof cid === "string" ? cid.trim().toLowerCase() : "";
    if (!key || !knownCategoryId.has(key)) {
      uncategorized.push(product);
      continue;
    }
    const bucket = byCategoryId.get(key) ?? [];
    bucket.push(product);
    byCategoryId.set(key, bucket);
  }

  const sections: CatalogBrowseSection[] = [];

  for (const cat of merged) {
    const expandedIds = expandCategoryIdsFromRows(allCategoryRows, cat.id);
    if (!expandedIds.length) continue;

    const seen = new Set<string>();
    const combined: CatalogBrowseProductRow[] = [];
    for (const eid of expandedIds) {
      const bucket = byCategoryId.get(eid.trim().toLowerCase());
      if (!bucket?.length) continue;
      for (const p of bucket) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        combined.push(p);
      }
    }

    combined.sort(sortProductsByCreatedAtDesc);
    const preview = combined.slice(0, CATALOG_ROW_PREVIEW_LIMIT);
    if (!preview.length) continue;

    sections.push({
      categoryId: cat.id,
      categoryName: cat.name,
      products: preview,
      showSeeAll: true,
    });
  }

  uncategorized.sort(sortProductsByCreatedAtDesc);
  const orphanPreview = uncategorized.slice(0, CATALOG_ROW_PREVIEW_LIMIT);
  if (orphanPreview.length) {
    sections.push({
      categoryId: null,
      categoryName: "Sin categoría",
      products: orphanPreview,
      showSeeAll: false,
    });
  }

  return sections;
}
