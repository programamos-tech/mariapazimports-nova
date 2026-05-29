import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api";
import {
  fetchProductVariantsForProduct,
  getVariantAxisLabel,
  parseProductVariantAxis,
} from "@/lib/product-variants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const gate = await requireAdminApiSession();
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const productId = String(id ?? "").trim();
  if (!productId) {
    return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
  }

  const { supabase } = gate;
  const { data: product, error } = await supabase
    .from("products")
    .select("id,variant_axis")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const axis = parseProductVariantAxis(product.variant_axis);
  const variants = await fetchProductVariantsForProduct(supabase, productId);
  const usesVariants = axis !== "none" && variants.length > 0;

  return NextResponse.json({
    variantAxis: axis,
    variantAxisLabel: getVariantAxisLabel(axis),
    usesVariants,
    variants: variants.map((v) => ({
      id: v.id,
      label: v.label,
      priceCents: v.priceCents,
      stockLocal: v.stockLocal,
      stockWarehouse: v.stockWarehouse,
    })),
  });
}
