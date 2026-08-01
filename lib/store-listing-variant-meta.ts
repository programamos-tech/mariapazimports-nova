import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStorefrontVariantMeta,
  fetchProductVariantsByProductIds,
  findVariantById,
  findVariantByLabel,
  parseProductVariantAxis,
  resolveLinePriceCents,
  resolveLineStockQuantity,
  type ProductVariant,
} from "@/lib/product-variants";
import type { StoreListingProductRow } from "@/lib/store-products-listing-query";

export type ListingProductWithVariantMeta = StoreListingProductRow & {
  variant_axis?: string | null;
  variantMeta: ReturnType<typeof buildStorefrontVariantMeta>;
  listingPriceCents: number;
  listingStockQuantity: number;
};

export async function enrichListingProductsWithVariants(
  supabase: SupabaseClient,
  products: StoreListingProductRow[],
): Promise<ListingProductWithVariantMeta[]> {
  if (!products.length) return [];
  const ids = products.map((p) => p.id);
  const variantMap = await fetchProductVariantsByProductIds(supabase, ids);

  return products.map((p) => {
    const variants = variantMap.get(p.id) ?? [];
    const variantMeta = buildStorefrontVariantMeta(p.variant_axis, variants);
    const minPrice = variantMeta.minPriceCents;
    const listingPriceCents =
      variantMeta.variantAxis !== "none" && minPrice != null
        ? minPrice
        : p.price_cents;
    const listingStockQuantity =
      variantMeta.variantAxis !== "none" && variants.length > 0
        ? variants.reduce((sum, v) => sum + v.stockQuantity, 0)
        : p.stock_quantity;

    return {
      ...p,
      variant_axis: parseProductVariantAxis(p.variant_axis),
      variantMeta,
      listingPriceCents,
      listingStockQuantity,
    };
  });
}

export type CartNormalizeProduct = {
  price_cents: number;
  stock_quantity: number | null;
  variant_axis?: string | null;
};

export function resolveCartLineStock(
  product: CartNormalizeProduct,
  variant: ProductVariant | null,
): number {
  const axis = parseProductVariantAxis(product.variant_axis);
  const productStock = Math.max(0, Math.floor(Number(product.stock_quantity ?? 0)));
  return resolveLineStockQuantity(productStock, variant, axis);
}

export function resolveCartLinePrice(
  product: CartNormalizeProduct,
  variant: ProductVariant | null,
): number {
  const axis = parseProductVariantAxis(product.variant_axis);
  return resolveLinePriceCents(product.price_cents, variant, axis);
}

export async function fetchVariantsMapForCartProducts(
  supabase: SupabaseClient,
  productIds: string[],
) {
  return fetchProductVariantsByProductIds(supabase, productIds);
}

export function migrateLegacyFragranceToVariantId(
  line: { variantId?: string; fragrance?: string },
  variants: ProductVariant[],
  axis: ReturnType<typeof parseProductVariantAxis>,
): string | undefined {
  if (line.variantId) return line.variantId;
  const legacy = line.fragrance?.trim();
  if (!legacy || axis === "none") return undefined;
  const match = findVariantByLabel(variants, legacy);
  return match?.id;
}

export function findVariantForCartLine(
  variants: ProductVariant[],
  variantId: string | undefined,
): ProductVariant | null {
  return findVariantById(variants, variantId);
}

export function toProductListingCardProps(
  p: StoreListingProductRow & {
    variantMeta?: ListingProductWithVariantMeta["variantMeta"];
    listingPriceCents?: number;
    listingStockQuantity?: number;
    categoryName?: string | null;
  },
) {
  const variantMeta =
    p.variantMeta ??
    buildStorefrontVariantMeta(p.variant_axis, []);
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    categoryName: p.categoryName ?? null,
    description: p.description,
    price_cents: p.price_cents,
    image_path: p.image_path,
    image_paths: p.image_paths,
    stock_quantity: p.stock_quantity,
    size_options: p.size_options,
    size_value: p.size_value,
    size_unit: p.size_unit,
    fragrance_options: p.fragrance_options,
    variant_axis: p.variant_axis,
    listingPriceCents: p.listingPriceCents ?? p.price_cents,
    listingStockQuantity: p.listingStockQuantity ?? p.stock_quantity,
    variantMeta,
  };
}
