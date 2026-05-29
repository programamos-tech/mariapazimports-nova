import {
  getCart,
  normalizeCartForCheckout,
  setCart,
  type CartLine,
} from "@/lib/cart";
import {
  findVariantForCartLine,
  migrateLegacyFragranceToVariantId,
  resolveCartLineStock,
  type CartNormalizeProduct,
} from "@/lib/store-listing-variant-meta";
import {
  fetchProductVariantsByProductIds,
  parseProductVariantAxis,
  variantRequiresChoice,
} from "@/lib/product-variants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Misma lógica que checkout: publicados, stock por variante, migra fragancia legacy. */
export async function normalizeStorefrontCartLines(
  cart: CartLine[],
): Promise<CartLine[]> {
  if (!cart.length) return [];
  const supabase = await createSupabaseServerClient();
  const ids = [...new Set(cart.map((l) => l.productId))];
  const [{ data: products }, variantMap] = await Promise.all([
    supabase
      .from("products")
      .select("id,is_published,stock_quantity,variant_axis,price_cents")
      .in("id", ids),
    fetchProductVariantsByProductIds(supabase, ids),
  ]);

  const byId = new Map(
    (products ?? []).map((p) => [
      p.id,
      {
        is_published: p.is_published,
        stock_quantity: p.stock_quantity,
        variant_axis: p.variant_axis,
      },
    ]),
  );

  const migrated: CartLine[] = cart.map((line) => {
    const p = byId.get(line.productId);
    if (!p) return line;
    const axis = parseProductVariantAxis(p.variant_axis);
    const variants = variantMap.get(line.productId) ?? [];
    const variantId = migrateLegacyFragranceToVariantId(line, variants, axis);
    return {
      productId: line.productId,
      quantity: line.quantity,
      ...(variantId ? { variantId } : {}),
    };
  });

  const variantStockMap = new Map<string, { id: string; stockQuantity: number }[]>();
  for (const [pid, variants] of variantMap) {
    variantStockMap.set(
      pid,
      variants.map((v) => ({ id: v.id, stockQuantity: v.stockQuantity })),
    );
  }

  return normalizeCartForCheckout(migrated, byId, variantStockMap);
}

export async function getStorefrontCartLines(): Promise<CartLine[]> {
  const raw = await getCart();
  return normalizeStorefrontCartLines(raw);
}

export async function getStorefrontCartItemCount(): Promise<number> {
  const lines = await getStorefrontCartLines();
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Mapa productId → unidades (suma todas las variantes). */
export async function getStorefrontCartQuantityByProductId(): Promise<
  Record<string, number>
> {
  const lines = await getStorefrontCartLines();
  const out: Record<string, number> = {};
  for (const l of lines) {
    out[l.productId] = (out[l.productId] ?? 0) + l.quantity;
  }
  return out;
}

export async function validateCartLineAdd(
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<{ ok: true; line: CartLine } | { ok: false }> {
  const q = Math.max(1, Math.floor(quantity || 1));
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("products")
    .select("id,stock_quantity,is_published,variant_axis,price_cents")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();

  if (!row) return { ok: false };

  const product = row as CartNormalizeProduct;
  const variants = await fetchProductVariantsByProductIds(supabase, [productId]);
  const list = variants.get(productId) ?? [];
  const axis = parseProductVariantAxis(product.variant_axis);

  if (variantRequiresChoice(axis, list) && !variantId) return { ok: false };

  const variant = findVariantForCartLine(list, variantId);
  if (axis !== "none" && variantId && !variant) return { ok: false };

  const stock = resolveCartLineStock(product, variant);
  if (stock <= 0) return { ok: false };

  return {
    ok: true,
    line: {
      productId,
      quantity: Math.min(q, stock),
      ...(variantId ? { variantId } : {}),
    },
  };
}
