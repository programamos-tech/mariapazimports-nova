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
import { fetchProductVariantsByProductIds } from "@/lib/product-variants";
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

async function loadCartDrawerSuggestions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  excludeIds: string[],
): Promise<CartDrawerSuggestion[]> {
  return fetchStoreProductSuggestions(supabase, excludeIds, SUGGESTION_LIMIT);
}

function firstColorLabel(colors: unknown): string | null {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  const c = colors[0];
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

/** Líneas del carrito + ítems enriquecidos para el drawer (y `lines` compat). */
export async function GET() {
  const lines = await getStorefrontCartLines();
  const supabase = await createSupabaseServerClient();

  if (lines.length === 0) {
    const empty: CartDrawerItem[] = [];
    const suggestions = await loadCartDrawerSuggestions(supabase, []);
    return NextResponse.json({
      lines: [],
      items: empty,
      subtotalCents: 0,
      suggestions,
    });
  }

  const ids = [...new Set(lines.map((l) => l.productId))];
  const [{ data: products }, variantMap] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,price_cents,image_path,image_paths,fragrance_option_images,colors,stock_quantity,variant_axis",
      )
      .in("id", ids)
      .eq("is_published", true),
    fetchProductVariantsByProductIds(supabase, ids),
  ]);

  const byId = new Map(
    (products ?? []).map((p) => [
      p.id,
      p as {
        id: string;
        name: string;
        price_cents: number;
        image_path: string | null;
        image_paths: unknown;
        fragrance_option_images: unknown;
        colors: unknown;
        stock_quantity: number | null;
        variant_axis?: string | null;
      },
    ]),
  );

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

  const suggestions = await loadCartDrawerSuggestions(supabase, ids);

  return NextResponse.json({ lines, items, subtotalCents, suggestions });
}
