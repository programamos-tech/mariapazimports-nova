import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { buildCategoryTree } from "@/lib/category-tree";
import { isUsableStoreBrand } from "@/lib/fetch-store-catalog-by-brand";
import { normalizeSizeOptionsFromRow } from "@/lib/product-size-options";

export type SizeFacetOption = {
  key: string;
  label: string;
  value: number;
  unit: string;
};

export type ListingFacets = {
  brands: string[];
  colors: string[];
  sizes: SizeFacetOption[];
  priceMin: number;
  priceMax: number;
};

const EMPTY_LISTING_FACETS: ListingFacets = {
  brands: [],
  colors: [],
  sizes: [],
  priceMin: 0,
  priceMax: 0,
};

type FacetProductRow = {
  brand?: unknown;
  colors?: unknown;
  size_options?: unknown;
  size_value?: unknown;
  size_unit?: unknown;
  price_cents?: unknown;
};

/** Facetas derivadas de filas de producto (evita una segunda query en /products). */
export function computeListingFacetsFromProductRows(
  data: FacetProductRow[],
): ListingFacets {
  if (!data.length) return EMPTY_LISTING_FACETS;

  const brandSeen = new Set<string>();
  const brands: string[] = [];
  const colorSeen = new Set<string>();
  const colors: string[] = [];
  const sizeSeen = new Set<string>();
  const sizes: SizeFacetOption[] = [];
  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = 0;

  for (const row of data) {
    const price = Math.max(0, Math.floor(Number(row.price_cents ?? 0)));
    if (price > 0) {
      priceMin = Math.min(priceMin, price);
      priceMax = Math.max(priceMax, price);
    }

    const b = typeof row.brand === "string" ? row.brand.trim() : "";
    if (b && b.length <= 160 && isUsableStoreBrand(b)) {
      const bk = b.toLowerCase();
      if (!brandSeen.has(bk)) {
        brandSeen.add(bk);
        brands.push(b);
      }
    }

    const arr = Array.isArray(row.colors) ? row.colors : [];
    for (const c of arr) {
      if (typeof c !== "string") continue;
      const t = c.trim();
      if (!t || t.length > 64) continue;
      const ck = t.toLowerCase();
      if (colorSeen.has(ck)) continue;
      colorSeen.add(ck);
      colors.push(t);
    }

    const optRows = normalizeSizeOptionsFromRow({
      size_options: row.size_options,
      size_value: row.size_value as number | null | undefined,
      size_unit: row.size_unit as string | null | undefined,
    });
    for (const opt of optRows) {
      const su = opt.unit.trim().toLowerCase();
      if (!["ml", "l", "g", "kg", "oz", "unidad"].includes(su)) continue;
      const v = Number(Number(opt.value).toFixed(2));
      if (v <= 0) continue;
      const key = `${v}:${su}`;
      if (sizeSeen.has(key)) continue;
      sizeSeen.add(key);
      const numLabel = String(v).replace(/\.0+$/, "");
      sizes.push({
        key,
        label: `${numLabel} ${su}`,
        value: v,
        unit: su,
      });
    }
  }

  brands.sort((a, b) => a.localeCompare(b, "es"));
  colors.sort((a, b) => a.localeCompare(b, "es"));
  sizes.sort((a, b) => a.label.localeCompare(b.label, "es"));

  return {
    brands,
    colors,
    sizes,
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax,
  };
}

/** Categorías fusionadas para checklist en el catálogo completo (con subcategorías). */
export function mergeCategoryRowsForFilterMenu(
  rows: { id: string; name: string; sort_order: number; parent_id?: string | null }[],
): { id: string; name: string }[] {
  const tree = buildCategoryTree(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      parent_id: r.parent_id ?? null,
      sort_order: r.sort_order,
    })),
  );

  const out: { id: string; name: string }[] = [];
  for (const { parent, children } of tree) {
    out.push({ id: parent.id, name: parent.name });
    for (const child of children) {
      out.push({ id: child.id, name: `↳ ${child.name}` });
    }
  }
  return out;
}

export async function fetchListingFacets(
  supabase: SupabaseClient,
  options: { categoryIds: string[] | null },
): Promise<ListingFacets> {
  // Facetas del catálogo completo (sin filtro de categoría): cache 60s.
  if (!options.categoryIds?.length) {
    try {
      return await getCachedGlobalListingFacets();
    } catch (err) {
      console.error("[listing-facets] cache fallback", err);
    }
  }

  return loadListingFacets(supabase, options);
}

async function loadListingFacets(
  supabase: SupabaseClient,
  options: { categoryIds: string[] | null },
): Promise<ListingFacets> {
  let q = supabase
    .from("products")
    .select("brand, colors, size_options, size_value, size_unit, price_cents")
    .eq("is_published", true);
  if (options.categoryIds?.length) {
    q = q.in("category_id", options.categoryIds);
  }
  const { data, error } = await q;
  if (error || !data?.length) {
    return EMPTY_LISTING_FACETS;
  }

  return computeListingFacetsFromProductRows(data);
}

const getCachedGlobalListingFacets = unstable_cache(
  async () => {
    const { createSupabaseServiceClient } = await import(
      "@/lib/supabase/service"
    );
    return loadListingFacets(createSupabaseServiceClient(), {
      categoryIds: null,
    });
  },
  ["store-listing-facets-global-v1"],
  { revalidate: 60 },
);
