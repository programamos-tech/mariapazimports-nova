import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveCategoryIconKey,
  type CategoryIconKey,
} from "@/lib/category-icons";
import {
  categoryGroupKey,
  pickCanonicalCategoryId,
} from "@/lib/store-category-group";
import { getStoreCategoryVisual } from "@/lib/store-category-visuals";
import { normalizeProductImagePaths } from "@/lib/product-images";
import {
  productStorefrontImageUrl,
  storageOriginalObjectUrl,
} from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import { resolveCategoryListingHeroSrc } from "@/lib/category-listing-hero-url";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type HomeCategoryCard = {
  id: string;
  name: string;
  sub: string;
  tint: string;
  iconKey: CategoryIconKey;
  productCount: number;
  /** URL pública para el póster; null → fallback visual. */
  imageSrc: string | null;
};

/** Tile sintético del home → catálogo completo (`/products`). */
export const HOME_ALL_PRODUCTS_CATEGORY_ID = "__all_products__";

export function isHomeAllProductsCategory(
  category: Pick<HomeCategoryCard, "id" | "name">,
): boolean {
  return (
    category.id === HOME_ALL_PRODUCTS_CATEGORY_ID ||
    category.name.trim().toLowerCase() === "todos los productos"
  );
}

function resolveProductCoverUrl(
  imagePath: string | null | undefined,
  imagePaths: unknown,
): string | null {
  const paths = normalizeProductImagePaths(imagePath, imagePaths);
  const first = paths[0];
  if (!first) return null;
  if (/^https?:\/\//i.test(first)) return first;
  if (first.startsWith("/")) return first;
  const pub = storagePublicObjectUrl(first);
  return storageOriginalObjectUrl(pub) ?? pub ?? resolveCategoryListingHeroSrc(first);
}

async function loadHomeCategoryCards(
  supabase: SupabaseClient,
): Promise<HomeCategoryCard[]> {
  const [{ data: categoriesRaw, error: catErr }, countsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,sort_order,icon_key,listing_hero_image_path,parent_id")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.rpc("store_category_product_counts"),
  ]);

  let categories = categoriesRaw as
    | {
        id: string;
        name: string;
        sort_order: number;
        icon_key: string | null;
        listing_hero_image_path: string | null;
        parent_id: string | null;
      }[]
    | null;

  if (catErr || !categories?.length) {
    if (catErr && /parent_id/i.test(catErr.message)) {
      const flat = await supabase
        .from("categories")
        .select("id,name,sort_order,icon_key,listing_hero_image_path")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (flat.error || !flat.data?.length) return [];
      categories = flat.data.map((c) => ({ ...c, parent_id: null }));
    } else {
      return [];
    }
  }

  const countByCategoryId = new Map<string, number>();
  const { data: countRows, error: countErr } = countsRes;
  if (countErr) {
    console.error(
      "[home-categories] counts rpc:",
      countErr.message,
      countErr.code,
    );
  } else {
    for (const row of countRows ?? []) {
      const cid = row.category_id as string | null;
      if (!cid) continue;
      countByCategoryId.set(cid, Number(row.product_count) || 0);
    }
  }

  // Solo raíces en home; el conteo incluye productos de subcategorías.
  const roots = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, typeof categories>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const arr = childrenByParent.get(c.parent_id) ?? [];
    arr.push(c);
    childrenByParent.set(c.parent_id, arr);
  }

  const groups = new Map<string, typeof categories>();
  for (const c of roots) {
    const k = categoryGroupKey(c.name);
    const arr = groups.get(k) ?? [];
    arr.push(c);
    // Incluir hijos en el grupo para hero/covers/counts
    for (const child of childrenByParent.get(c.id) ?? []) {
      arr.push(child);
    }
    groups.set(k, arr);
  }

  const idToGroupKey = new Map<string, string>();
  for (const [gKey, arr] of groups) {
    for (const c of arr) idToGroupKey.set(c.id, gKey);
  }

  /** Portadas: listing_hero → producto de la categoría → cualquier producto con foto. */
  const groupsNeedingProductCover = new Set<string>();
  for (const [gKey, arr] of groups) {
    const hasHero = arr.some(
      (c) =>
        typeof c.listing_hero_image_path === "string" &&
        c.listing_hero_image_path.trim(),
    );
    if (!hasHero) groupsNeedingProductCover.add(gKey);
  }

  const { data: coverPool, error: prodErr } = await supabase
    .from("products")
    .select("category_id,image_path,image_paths")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(120);

  if (prodErr) {
    console.error(
      "[home-categories] product covers:",
      prodErr.message,
      prodErr.code,
    );
  }

  const productCoverByGroup = new Map<string, string>();
  const spareCovers: string[] = [];
  const usedCovers = new Set<string>();

  for (const row of coverPool ?? []) {
    const cover = resolveProductCoverUrl(
      row.image_path as string | null,
      row.image_paths,
    );
    if (!cover) continue;

    const cid = row.category_id as string | null;
    const gKey = cid ? idToGroupKey.get(cid) : undefined;
    if (
      gKey &&
      groupsNeedingProductCover.has(gKey) &&
      !productCoverByGroup.has(gKey)
    ) {
      productCoverByGroup.set(gKey, cover);
      usedCovers.add(cover);
      continue;
    }
    spareCovers.push(cover);
  }

  for (const gKey of groupsNeedingProductCover) {
    if (productCoverByGroup.has(gKey)) continue;
    const next = spareCovers.find((c) => !usedCovers.has(c));
    if (!next) break;
    productCoverByGroup.set(gKey, next);
    usedCovers.add(next);
  }

  type Row = HomeCategoryCard & { sort_order: number };
  const merged: Row[] = [];
  let visualIndex = 0;

  for (const [gKey, arr] of groups) {
    const productCount = arr.reduce(
      (sum, c) => sum + (countByCategoryId.get(c.id) ?? 0),
      0,
    );

    // Winner = raíz canónica del grupo (no una subcategoría).
    const rootRows = arr.filter((c) => !c.parent_id);
    const canonicalPool = rootRows.length ? rootRows : arr;
    const canonicalId = pickCanonicalCategoryId(canonicalPool) ?? arr[0]!.id;
    const winner = arr.find((c) => c.id === canonicalId) ?? arr[0]!;
    const visual = getStoreCategoryVisual(winner.name, visualIndex);
    visualIndex += 1;

    const heroFallback = resolveCategoryListingHeroSrc(
      typeof winner.listing_hero_image_path === "string"
        ? winner.listing_hero_image_path
        : null,
    );
    const productCover = productCoverByGroup.get(gKey) ?? null;
    const rawCover = heroFallback ?? productCover;

    merged.push({
      id: canonicalId,
      name: winner.name,
      sort_order: Math.min(...canonicalPool.map((c) => c.sort_order)),
      iconKey: resolveCategoryIconKey(winner.icon_key),
      productCount,
      imageSrc: productStorefrontImageUrl(rawCover) ?? rawCover,
      ...visual,
    });
  }

  merged.sort(
    (a, b) =>
      a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"),
  );

  let allProductsCover: string | null = null;
  for (const row of coverPool ?? []) {
    const cover = resolveProductCoverUrl(
      row.image_path as string | null,
      row.image_paths,
    );
    if (cover) {
      allProductsCover = productStorefrontImageUrl(cover) ?? cover;
      break;
    }
  }

  const { count: publishedCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  const allProductsCount = publishedCount ?? 0;

  const cards = merged.map(({ sort_order: _, ...card }) => card);
  cards.unshift({
    id: HOME_ALL_PRODUCTS_CATEGORY_ID,
    name: "Todos los productos",
    sub: "Catálogo completo",
    tint: "bg-[#f4f4f3]",
    iconKey: "tag",
    productCount: allProductsCount,
    imageSrc: allProductsCover,
  });

  return cards;
}

const getCachedHomeCategoryCards = unstable_cache(
  async () => {
    const supabase = createSupabaseServiceClient();
    return loadHomeCategoryCards(supabase);
  },
  ["home-category-cards-v6"],
  { revalidate: 60 },
);

/**
 * Categorías para la vitrina Netflix del home.
 * Preferimos listing_hero; solo pedimos productos si falta portada.
 */
export const fetchHomeCategoryCards = cache(
  async (_supabase?: SupabaseClient): Promise<HomeCategoryCard[]> => {
    try {
      return await getCachedHomeCategoryCards();
    } catch (err) {
      console.error("[home-categories] cache fallback", err);
      const supabase = _supabase ?? createSupabaseServiceClient();
      return loadHomeCategoryCards(supabase);
    }
  },
);
