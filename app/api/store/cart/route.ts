import { NextResponse } from "next/server";
import { imagePathForProductLine } from "@/lib/product-line-image";
import {
  fetchStoreProductSuggestions,
  type StoreProductSuggestion,
} from "@/lib/store-product-suggestions";
import {
  findVariantForCartLine,
  resolveCartLinePrice,
  resolveCartLineStock,
  type CartNormalizeProduct,
} from "@/lib/store-listing-variant-meta";
import { getStorefrontCartLines } from "@/lib/storefront-cart";
import {
  fetchProductVariantsByProductIds,
  type ProductVariant,
} from "@/lib/product-variants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type CartDrawerItem = {
  productId: string;
  quantity: number;
  variantId: string | null;
  variantLabel: string | null;
  name: string;
  priceCents: number;
  imagePath: string | null;
  firstColor: string | null;
  lineTotalCents: number;
  maxStock: number;
};

export type CartDrawerSuggestion = StoreProductSuggestion;

const SUGGESTION_LIMIT = 8;

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  image_path: string | null;
  image_paths: unknown;
  fragrance_option_images: unknown;
  colors: unknown;
  stock_quantity: number | null;
  variant_axis?: string | null;
};

function firstColorLabel(colors: unknown): string | null {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  const c = colors[0];
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

function buildCartDrawerItems(
  lines: Awaited<ReturnType<typeof getStorefrontCartLines>>,
  products: ProductRow[],
  variantMap: Map<string, ProductVariant[]>,
): { items: CartDrawerItem[]; subtotalCents: number } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: CartDrawerItem[] = [];
  let subtotalCents = 0;

  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p) continue;
    const variants = variantMap.get(line.productId) ?? [];
    const variant = findVariantForCartLine(variants, line.variantId);
    const priceCents = resolveCartLinePrice(p as CartNormalizeProduct, variant);
    const lineTotalCents = priceCents * line.quantity;
    subtotalCents += lineTotalCents;
    const variantLabel = variant?.label?.trim() || null;
    items.push({
      productId: line.productId,
      quantity: line.quantity,
      variantId: line.variantId ?? null,
      variantLabel,
      name: p.name,
      priceCents,
      imagePath: imagePathForProductLine(
        p.image_path,
        p.fragrance_option_images,
        variantLabel ?? undefined,
        p.image_paths,
        variant,
      ),
      firstColor: firstColorLabel(p.colors),
      lineTotalCents,
      maxStock: resolveCartLineStock(p as CartNormalizeProduct, variant),
    });
  }

  return { items, subtotalCents };
}

/**
 * `?lite=1` — solo ítems (abre la bolsa rápido).
 * Sin lite — ítems + sugerencias en paralelo.
 * `?suggestions=1` — solo sugerencias (carga diferida tras lite).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lite = url.searchParams.get("lite") === "1";
  const suggestionsOnly = url.searchParams.get("suggestions") === "1";

  const linesPromise = getStorefrontCartLines();
  const supabasePromise = createSupabaseServerClient();

  if (suggestionsOnly) {
    const [lines, supabase] = await Promise.all([linesPromise, supabasePromise]);
    const ids = [...new Set(lines.map((l) => l.productId))];
    const suggestions = await fetchStoreProductSuggestions(
      supabase,
      ids,
      SUGGESTION_LIMIT,
    );
    return NextResponse.json({ suggestions });
  }

  const [lines, supabase] = await Promise.all([linesPromise, supabasePromise]);
  const ids = [...new Set(lines.map((l) => l.productId))];

  if (lines.length === 0) {
    if (lite) {
      return NextResponse.json({
        lines: [],
        items: [] as CartDrawerItem[],
        subtotalCents: 0,
        suggestions: [] as CartDrawerSuggestion[],
      });
    }
    const suggestions = await fetchStoreProductSuggestions(
      supabase,
      [],
      SUGGESTION_LIMIT,
    );
    return NextResponse.json({
      lines: [],
      items: [] as CartDrawerItem[],
      subtotalCents: 0,
      suggestions,
    });
  }

  const productsPromise = supabase
    .from("products")
    .select(
      "id,name,price_cents,image_path,image_paths,fragrance_option_images,colors,stock_quantity,variant_axis",
    )
    .in("id", ids)
    .eq("is_published", true);

  const variantsPromise = fetchProductVariantsByProductIds(supabase, ids);
  const suggestionsPromise = lite
    ? Promise.resolve([] as CartDrawerSuggestion[])
    : fetchStoreProductSuggestions(supabase, ids, SUGGESTION_LIMIT);

  const [{ data: products }, variantMap, suggestions] = await Promise.all([
    productsPromise,
    variantsPromise,
    suggestionsPromise,
  ]);

  const { items, subtotalCents } = buildCartDrawerItems(
    lines,
    (products ?? []) as ProductRow[],
    variantMap,
  );

  return NextResponse.json({ lines, items, subtotalCents, suggestions });
}
