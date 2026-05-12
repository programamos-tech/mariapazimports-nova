import type { SupabaseClient } from "@supabase/supabase-js";
import {
  expandCategoryIdsFromRows,
  expandManyCategoryIdsFromRows,
  fetchExpandedCategoryIds,
} from "@/lib/store-category-group";

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
  stock_quantity: number;
  size_options?: unknown;
  size_value: number | null;
  size_unit: string | null;
  fragrance_options: string[] | null;
  created_at: string;
};

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
};

/**
 * Listado publicado con los mismos filtros / orden que `/products` (sin modo “browse por categorías”).
 */
export async function fetchPublishedProductsForListing(
  supabase: SupabaseClient,
  input: StoreListingQueryInput,
): Promise<StoreListingProductRow[]> {
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
      "id,name,brand,description,price_cents,image_path,stock_quantity,size_options,size_value,size_unit,fragrance_options,created_at",
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
    query = query.ilike("name", `%${input.q}%`);
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

  const { data: products, error: productsError } = await query;
  if (productsError) {
    console.error(
      "[store-products-listing]",
      productsError.message,
      productsError.code,
    );
  }
  return (products ?? []) as StoreListingProductRow[];
}
