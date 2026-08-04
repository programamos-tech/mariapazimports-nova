import type { SupabaseClient } from "@supabase/supabase-js";
import {
  expandCategoryIdsFromRows,
  expandManyCategoryIdsFromRows,
  fetchExpandedCategoryIds,
} from "@/lib/store-category-group";
import { storeProductNameOrBrandSearchOr } from "@/lib/store-product-search";

/** Productos por página en listados filtrados. */
export const STORE_CATALOG_PAGE_SIZE = 24;

/** Legacy (`size_value`/`size_unit`) o cualquier entrada en `size_options`. */
export function productMatchesSizeFilterClause(s: {
  value: number;
  unit: string;
}): string {
  const blob = JSON.stringify([{ value: s.value, unit: s.unit }]);
  return `and(size_value.eq.${s.value},size_unit.eq.${s.unit}),size_options.cs.${blob}`;
}

export type StoreListingProductRow = {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  image_paths?: unknown;
  stock_quantity: number;
  size_options?: unknown;
  size_value: number | null;
  size_unit: string | null;
  fragrance_options: string[] | null;
  variant_axis?: string | null;
  import_origin?: string | null;
  created_at: string;
  category_id?: string | null;
};

/** Mezcla in-place (Fisher–Yates) para vitrinas “descubrimiento”. */
export function shuffleStoreListingProducts<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export type StoreListingQueryInput = {
  categoryFilterId: string | null;
  filterCategoryIds: string[];
  activeBrands: string[];
  activeColors: string[];
  activeSizes: { value: number; unit: string }[];
  priceMin: number | null;
  priceMax: number | null;
  q: string;
  sort: string;
  allCategoryRows:
    | { id: string; name: string; sort_order: number }[]
    | null
    | undefined;
  /** 1-based. Si se omite, se devuelve la primera página. */
  page?: number;
  pageSize?: number;
  /** Sin `range` (p. ej. `/marcas` agrupa todo el catálogo). */
  unpaged?: boolean;
};

/**
 * Listado publicado con los mismos filtros / orden que `/products` (sin modo “browse por categorías”).
 */
export async function fetchPublishedProductsForListing(
  supabase: SupabaseClient,
  input: StoreListingQueryInput,
): Promise<{ products: StoreListingProductRow[]; total: number }> {
  let expandedCategoryIds: string[] | null = null;
  if (input.categoryFilterId) {
    expandedCategoryIds =
      input.allCategoryRows?.length ?
        expandCategoryIdsFromRows(
          input.allCategoryRows,
          input.categoryFilterId,
        )
      : await fetchExpandedCategoryIds(supabase, input.categoryFilterId);
  }

  let query = supabase
    .from("products")
    .select(
      // Sin description: las cards no la muestran y ahorra payload HTML/RSC.
      "id,name,brand,price_cents,image_path,image_paths,stock_quantity,size_options,size_value,size_unit,fragrance_options,variant_axis,import_origin,created_at,category_id",
      { count: "exact" },
    )
    .eq("is_published", true);

  if (input.categoryFilterId && expandedCategoryIds?.length) {
    query = query.in("category_id", expandedCategoryIds);
  } else if (
    !input.categoryFilterId &&
    input.filterCategoryIds.length > 0 &&
    input.allCategoryRows?.length
  ) {
    const expandedFilter = expandManyCategoryIdsFromRows(
      input.allCategoryRows,
      input.filterCategoryIds,
    );
    if (expandedFilter.length) {
      query = query.in("category_id", expandedFilter);
    }
  }

  if (input.activeBrands.length === 1) {
    query = query.eq("brand", input.activeBrands[0]!);
  } else if (input.activeBrands.length > 1) {
    query = query.in("brand", input.activeBrands);
  }

  if (input.activeColors.length > 0) {
    query = query.overlaps("colors", input.activeColors);
  }

  if (input.activeSizes.length >= 1) {
    query = query.or(
      input.activeSizes.map(productMatchesSizeFilterClause).join(","),
    );
  }

  if (input.priceMin != null) {
    query = query.gte("price_cents", input.priceMin);
  }
  if (input.priceMax != null) {
    query = query.lte("price_cents", input.priceMax);
  }

  if (input.q) {
    const orClause = storeProductNameOrBrandSearchOr(input.q);
    if (orClause) query = query.or(orClause);
  }

  switch (input.sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (input.unpaged) {
    // PostgREST `max_rows` (p. ej. 1000): paginar hasta vaciar el set.
    const pageSize = 1000;
    const all: StoreListingProductRow[] = [];
    for (let from = 0; ; from += pageSize) {
      const to = from + pageSize - 1;
      const { data: products, error: productsError } = await query.range(
        from,
        to,
      );
      if (productsError) {
        console.error(
          "[store-products-listing]",
          productsError.message,
          productsError.code,
        );
        break;
      }
      const batch = (products ?? []).map((p) => ({
        ...p,
        description: null,
      })) as StoreListingProductRow[];
      all.push(...batch);
      if (batch.length < pageSize) break;
    }
    return { products: all, total: all.length };
  }

  const pageSize = Math.max(1, input.pageSize ?? STORE_CATALOG_PAGE_SIZE);
  const page = Math.max(1, input.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: products, count, error: productsError } = await query.range(
    from,
    to,
  );
  if (productsError) {
    console.error(
      "[store-products-listing]",
      productsError.message,
      productsError.code,
    );
  }
  return {
    products: (products ?? []).map((p) => ({
      ...p,
      description: null,
    })) as StoreListingProductRow[],
    total: typeof count === "number" ? count : (products?.length ?? 0),
  };
}
