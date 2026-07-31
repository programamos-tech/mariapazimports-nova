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
import { storageOriginalObjectUrl } from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import { resolveCategoryListingHeroSrc } from "@/lib/category-listing-hero-url";

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
  // Original de Storage (sin resize agresivo) para póster HD.
  return storageOriginalObjectUrl(pub) ?? pub ?? resolveCategoryListingHeroSrc(first);
}

/**
 * Categorías para la vitrina Netflix del home.
 * Imagen: preferimos la de un producto publicado de esa categoría
 * (incluye IDs sinónimos/duplicados). Fallback: listing_hero.
 */
export async function fetchHomeCategoryCards(
  supabase: SupabaseClient,
): Promise<HomeCategoryCard[]> {
  const [{ data: categories, error: catErr }, { data: products, error: prodErr }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id,name,sort_order,icon_key,listing_hero_image_path")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("products")
        .select("category_id,image_path,image_paths,created_at")
        .eq("is_published", true)
        .not("category_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(400),
    ]);

  if (catErr || !categories?.length) return [];

  const groups = new Map<string, typeof categories>();
  for (const c of categories) {
    const k = categoryGroupKey(c.name);
    const arr = groups.get(k) ?? [];
    arr.push(c);
    groups.set(k, arr);
  }

  const idToGroupKey = new Map<string, string>();
  for (const c of categories) {
    idToGroupKey.set(c.id, categoryGroupKey(c.name));
  }

  /** groupKey → URL de portada tomada de un producto del grupo. */
  const productCoverByGroup = new Map<string, string>();
  const countByCategoryId = new Map<string, number>();

  if (!prodErr) {
    for (const row of products ?? []) {
      const cid = row.category_id as string | null;
      if (!cid) continue;
      countByCategoryId.set(cid, (countByCategoryId.get(cid) ?? 0) + 1);

      const gKey = idToGroupKey.get(cid);
      if (!gKey || productCoverByGroup.has(gKey)) continue;

      const cover = resolveProductCoverUrl(
        row.image_path as string | null,
        row.image_paths,
      );
      if (cover) productCoverByGroup.set(gKey, cover);
    }
  }

  type Row = HomeCategoryCard & { sort_order: number };
  const merged: Row[] = [];
  let visualIndex = 0;

  for (const [gKey, arr] of groups) {
    const productCount = arr.reduce(
      (sum, c) => sum + (countByCategoryId.get(c.id) ?? 0),
      0,
    );

    const canonicalId = pickCanonicalCategoryId(arr) ?? arr[0]!.id;
    const winner = arr.find((c) => c.id === canonicalId) ?? arr[0]!;
    const visual = getStoreCategoryVisual(winner.name, visualIndex);
    visualIndex += 1;

    const productCover = productCoverByGroup.get(gKey) ?? null;
    const heroFallback = resolveCategoryListingHeroSrc(
      typeof winner.listing_hero_image_path === "string"
        ? winner.listing_hero_image_path
        : null,
    );

    merged.push({
      id: canonicalId,
      name: winner.name,
      sort_order: Math.min(...arr.map((c) => c.sort_order)),
      iconKey: resolveCategoryIconKey(winner.icon_key),
      productCount,
      imageSrc: productCover ?? heroFallback,
      ...visual,
    });
  }

  merged.sort(
    (a, b) =>
      a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"),
  );

  return merged.map(({ sort_order: _, ...card }) => card);
}
