import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeProductImagePaths } from "@/lib/product-images";

export const PRODUCT_VARIANT_AXES = [
  "none",
  "fragrance",
  "size",
  "tone",
  "color",
] as const;

export type ProductVariantAxis = (typeof PRODUCT_VARIANT_AXES)[number];

export type ProductVariantRow = {
  id: string;
  product_id: string;
  label: string;
  price_cents: number;
  cost_cents: number;
  stock_warehouse: number;
  stock_local: number;
  image_paths: unknown;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  label: string;
  priceCents: number;
  costCents: number;
  stockWarehouse: number;
  stockLocal: number;
  stockQuantity: number;
  imagePaths: string[];
  sortOrder: number;
};

export type ProductWithVariantsSummary = {
  variantAxis: ProductVariantAxis;
  variants: ProductVariant[];
};

const AXIS_UI_LABELS: Record<
  Exclude<ProductVariantAxis, "none">,
  string
> = {
  fragrance: "Fragancia",
  size: "Presentación",
  tone: "Tono",
  color: "Color",
};

export function parseProductVariantAxis(raw: unknown): ProductVariantAxis {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (
    s === "fragrance" ||
    s === "size" ||
    s === "tone" ||
    s === "color"
  ) {
    return s;
  }
  return "none";
}

export function getVariantAxisLabel(axis: ProductVariantAxis): string | null {
  if (axis === "none") return null;
  return AXIS_UI_LABELS[axis];
}

export function getVariantPickerTitle(axis: ProductVariantAxis): string {
  return getVariantAxisLabel(axis) ?? "Opción";
}

export function mapProductVariantRow(row: ProductVariantRow): ProductVariant {
  const stockWarehouse = Math.max(
    0,
    Math.floor(Number(row.stock_warehouse ?? 0)),
  );
  const stockLocal = Math.max(0, Math.floor(Number(row.stock_local ?? 0)));
  return {
    id: row.id,
    productId: row.product_id,
    label: row.label,
    priceCents: Math.max(0, Math.floor(Number(row.price_cents ?? 0))),
    costCents: Math.max(0, Math.floor(Number(row.cost_cents ?? 0))),
    stockWarehouse,
    stockLocal,
    stockQuantity: stockWarehouse + stockLocal,
    imagePaths: normalizeProductImagePaths(null, row.image_paths),
    sortOrder: Math.floor(Number(row.sort_order ?? 0)),
  };
}

export function variantRequiresChoice(
  axis: ProductVariantAxis,
  variants: ProductVariant[],
): boolean {
  return axis !== "none" && variants.length > 1;
}

/** Hay al menos una presentación activa en la ficha (1 o más SKUs). */
export function hasStorefrontVariants(
  axis: ProductVariantAxis,
  variants: readonly { label: string }[],
): boolean {
  return axis !== "none" && variants.length >= 1;
}

export function minVariantPriceCents(variants: ProductVariant[]): number | null {
  if (!variants.length) return null;
  return Math.min(...variants.map((v) => v.priceCents));
}

export function sortVariants(variants: ProductVariant[]): ProductVariant[] {
  return [...variants].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "es"),
  );
}

export function findVariantById(
  variants: ProductVariant[],
  variantId: string | null | undefined,
): ProductVariant | null {
  if (!variantId) return null;
  return variants.find((v) => v.id === variantId) ?? null;
}

/** Etiqueta de variante para carrito legacy (fragrance → variantId). */
export function findVariantByLabel(
  variants: ProductVariant[],
  label: string | null | undefined,
): ProductVariant | null {
  const t = label?.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  return (
    variants.find((v) => v.label.trim().toLowerCase() === lower) ?? null
  );
}

export async function fetchProductVariantsByProductIds(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, ProductVariant[]>> {
  const out = new Map<string, ProductVariant[]>();
  if (!productIds.length) return out;

  const unique = [...new Set(productIds)];
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id,product_id,label,price_cents,cost_cents,stock_warehouse,stock_local,image_paths,sort_order",
    )
    .in("product_id", unique)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("[fetchProductVariantsByProductIds]", error.message);
    return out;
  }

  for (const row of data ?? []) {
    const v = mapProductVariantRow(row as ProductVariantRow);
    const list = out.get(v.productId) ?? [];
    list.push(v);
    out.set(v.productId, list);
  }

  for (const [pid, list] of out) {
    out.set(pid, sortVariants(list));
  }

  return out;
}

export async function fetchProductVariantsForProduct(
  supabase: SupabaseClient,
  productId: string,
): Promise<ProductVariant[]> {
  const map = await fetchProductVariantsByProductIds(supabase, [productId]);
  return map.get(productId) ?? [];
}

export function resolveLinePriceCents(
  productPriceCents: number,
  variant: ProductVariant | null,
  axis: ProductVariantAxis,
): number {
  if (axis !== "none" && variant) return variant.priceCents;
  return Math.max(0, Math.floor(productPriceCents));
}

export function resolveLineStockQuantity(
  productStock: number,
  variant: ProductVariant | null,
  axis: ProductVariantAxis,
): number {
  if (axis !== "none" && variant) return variant.stockQuantity;
  return Math.max(0, Math.floor(productStock));
}

export type StorefrontProductVariantMeta = {
  variantAxis: ProductVariantAxis;
  variants: ProductVariant[];
  minPriceCents: number | null;
  requiresVariantChoice: boolean;
};

export function buildStorefrontVariantMeta(
  variantAxisRaw: unknown,
  variants: ProductVariant[],
): StorefrontProductVariantMeta {
  const variantAxis = parseProductVariantAxis(variantAxisRaw);
  const sorted = sortVariants(variants);
  return {
    variantAxis,
    variants: sorted,
    minPriceCents: minVariantPriceCents(sorted),
    requiresVariantChoice: variantRequiresChoice(variantAxis, sorted),
  };
}

export function formatSizeVariantLabel(value: number, unit: string): string {
  const v = Number(value);
  const u = unit.trim().toLowerCase();
  if (!Number.isFinite(v) || v <= 0 || !u) return "";
  const num = String(v).replace(/\.0+$/, "");
  return `${num} ${u}`;
}

export const VARIANT_AXIS_OPTIONS: {
  value: ProductVariantAxis;
  label: string;
}[] = [
  { value: "none", label: "Sin variantes (precio único)" },
  { value: "fragrance", label: "Fragancia" },
  { value: "size", label: "Tamaño / cápsula / presentación" },
  { value: "tone", label: "Tono" },
  { value: "color", label: "Color" },
];
