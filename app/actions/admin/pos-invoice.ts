"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import {
  deductStockForOrderItem,
  fetchProductVariantStockContext,
  restoreVariantStockSnapshots,
  snapshotVariantStockForProduct,
} from "@/lib/product-stock";
import { findVariantById } from "@/lib/product-variants";
import {
  computeLineDiscountCents,
  type LineDiscountMode,
} from "@/lib/pos-line-discount";
import { assertActionPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PosInvoicePayload = {
  customerId: string;
  lines: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPriceCents?: number;
    lineDiscountMode?: LineDiscountMode;
    lineDiscountValue?: number;
    lineDiscountCents?: number;
  }[];
  paymentMethod: "cash" | "transfer" | "mixed";
  shippingAddress: string | null;
  shippingPhone: string | null;
};

type ResolvedPosLine = {
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  unitBaseCents: number;
  lineDiscountCents: number;
  lineTotalCents: number;
  storedUnitPriceCents: number;
  productName: string;
};

function redirectError(code: string): never {
  redirect(`/admin/ventas/nueva?error=${encodeURIComponent(code)}`);
}

function unitFinalCents(priceCents: number, hasVat: boolean, vatPercent: number): number {
  const base = Math.max(0, Math.floor(priceCents));
  if (!hasVat) return base;
  const pct = Math.max(0, vatPercent);
  return Math.round(base * (1 + pct / 100));
}

export async function createPosInvoiceAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/admin/login?error=no_profile");
  await assertActionPermission("ventas_crear");

  let payload: PosInvoicePayload;
  try {
    const raw = String(formData.get("payload") ?? "").trim();
    if (!raw) redirectError("validation");
    payload = JSON.parse(raw) as PosInvoicePayload;
  } catch {
    redirectError("validation");
  }

  const customerId = String(payload.customerId ?? "").trim();
  if (!customerId) redirectError("validation");

  const linesRaw = Array.isArray(payload.lines) ? payload.lines : [];
  const lines = linesRaw
    .map((row) => ({
      productId: String((row as { productId?: string }).productId ?? "").trim(),
      variantId: String((row as { variantId?: string }).variantId ?? "").trim() || null,
      quantity: Math.floor(Number((row as { quantity?: number }).quantity)),
      unitPriceCents: Math.max(
        0,
        Math.floor(Number((row as { unitPriceCents?: number }).unitPriceCents ?? 0)),
      ),
      lineDiscountMode: (
        (row as { lineDiscountMode?: string }).lineDiscountMode === "percent"
          ? "percent"
          : "money"
      ) as LineDiscountMode,
      lineDiscountValue: Math.max(
        0,
        Math.floor(Number((row as { lineDiscountValue?: number }).lineDiscountValue ?? 0)),
      ),
    }))
    .filter((r) => r.productId && r.quantity > 0);

  if (lines.length === 0) redirectError("validation");

  const paymentMethod = payload.paymentMethod;
  if (paymentMethod !== "cash" && paymentMethod !== "transfer" && paymentMethod !== "mixed") {
    redirectError("validation");
  }

  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("id,name,email,phone")
    .eq("id", customerId)
    .maybeSingle();

  if (cErr || !customer) redirectError("customer");
  const customerRow = customer;

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id,name,price_cents,stock_local,has_vat,vat_percent")
    .in("id", productIds);

  if (pErr || !products || products.length !== productIds.length) {
    redirectError("products");
  }

  const productRows = products;
  const productById = new Map(productRows.map((p) => [p.id as string, p]));

  const resolvedLines: ResolvedPosLine[] = [];
  for (const line of lines) {
    const p = productById.get(line.productId);
    if (!p) redirectError("products");

    const hasVat = Boolean(p.has_vat);
    const vatPercent = Math.max(0, Number(p.vat_percent ?? 0));
    const parentPrice = Math.max(0, Math.floor(Number(p.price_cents ?? 0)));

    const { usesVariants, variants } = await fetchProductVariantStockContext(
      supabase,
      line.productId,
    );

    let variantId = line.variantId;
    let variantLabel: string | null = null;
    let catalogUnitBase = parentPrice;
    let stockLocal = Number(p.stock_local ?? 0);

    if (usesVariants) {
      const chosen = findVariantById(variants, variantId);
      const effective =
        chosen ?? (variants.length === 1 ? variants[0]! : null);
      if (!effective) redirectError("variant");
      variantId = effective.id;
      variantLabel = effective.label;
      catalogUnitBase = effective.priceCents;
      stockLocal = effective.stockLocal;
    } else if (variantId) {
      redirectError("validation");
    }

    if (stockLocal < line.quantity) redirectError("stock");

    const unitBase =
      line.unitPriceCents > 0 ? line.unitPriceCents : catalogUnitBase;
    const unitFinal = unitFinalCents(unitBase, hasVat, vatPercent);
    const lineGross = unitFinal * line.quantity;
    const lineDiscount = computeLineDiscountCents(
      lineGross,
      line.lineDiscountMode,
      line.lineDiscountValue,
    );
    const lineTotal = Math.max(0, lineGross - lineDiscount);
    const storedUnitPrice =
      line.quantity > 0 ? Math.round(lineTotal / line.quantity) : unitFinal;

    resolvedLines.push({
      productId: line.productId,
      variantId,
      variantLabel,
      quantity: line.quantity,
      unitBaseCents: unitBase,
      lineDiscountCents: lineDiscount,
      lineTotalCents: lineTotal,
      storedUnitPriceCents: storedUnitPrice,
      productName: String(p.name ?? "Producto"),
    });
  }

  let subtotalCents = 0;
  let discountCents = 0;
  let totalCents = 0;
  for (const line of resolvedLines) {
    subtotalCents += line.unitBaseCents * line.quantity;
    discountCents += line.lineDiscountCents;
    totalCents += line.lineTotalCents;
  }
  const vatCents = Math.max(0, totalCents + discountCents - subtotalCents);

  if (!Number.isFinite(totalCents) || totalCents < 0) redirectError("validation");

  const emailRaw =
    customerRow.email != null ? String(customerRow.email).trim() : "";
  const customerEmail =
    emailRaw.length > 0 ? emailRaw.toLowerCase() : `pos-${customerId.slice(0, 8)}@local.invalid`;

  const shippingAddress =
    payload.shippingAddress != null && String(payload.shippingAddress).trim().length > 0
      ? String(payload.shippingAddress).trim()
      : null;

  const shippingPhone =
    payload.shippingPhone != null && String(payload.shippingPhone).trim().length > 0
      ? String(payload.shippingPhone).trim()
      : customerRow.phone != null
        ? String(customerRow.phone).trim() || null
        : null;

  const wompiRef = `POS:${paymentMethod}`;

  const { data: orderRow, error: oErr } = await supabase
    .from("orders")
    .insert({
      status: "paid",
      customer_name: String(customerRow.name ?? "Cliente"),
      customer_email: customerEmail,
      customer_id: customerId,
      total_cents: totalCents,
      currency: "COP",
      wompi_reference: wompiRef,
      shipping_address: shippingAddress,
      shipping_phone: shippingPhone,
    })
    .select("id")
    .single();

  if (oErr || !orderRow?.id) {
    redirectError("db");
  }

  const orderId = String(orderRow.id);

  const itemRows = resolvedLines.map((line) => ({
    order_id: orderId,
    product_id: line.productId,
    quantity: line.quantity,
    unit_price_cents: line.storedUnitPriceCents,
    product_name_snapshot: line.productName,
    variant_id: line.variantId,
    variant_label_snapshot: line.variantLabel,
  }));

  const { error: iErr } = await supabase.from("order_items").insert(itemRows);

  if (iErr) {
    await supabase.from("orders").delete().eq("id", orderId);
    redirectError("db");
  }

  const stockRollback: { id: string; prev: number }[] = [];
  const variantRollbacks: {
    productId: string;
    snapshots: Awaited<ReturnType<typeof snapshotVariantStockForProduct>>;
  }[] = [];
  const variantProductsSnapshotted = new Set<string>();

  for (const line of resolvedLines) {
    const p = productById.get(line.productId)!;
    const { usesVariants } = await fetchProductVariantStockContext(
      supabase,
      line.productId,
    );

    if (usesVariants) {
      if (!variantProductsSnapshotted.has(line.productId)) {
        const snapshots = await snapshotVariantStockForProduct(supabase, line.productId);
        variantRollbacks.push({ productId: line.productId, snapshots });
        variantProductsSnapshotted.add(line.productId);
      }
      const ok = await deductStockForOrderItem(
        supabase,
        line.productId,
        line.variantId,
        line.quantity,
      );
      if (!ok) {
        for (const rb of variantRollbacks) {
          await restoreVariantStockSnapshots(supabase, rb.productId, rb.snapshots);
        }
        for (const r of stockRollback) {
          await supabase.from("products").update({ stock_local: r.prev }).eq("id", r.id);
        }
        await supabase.from("orders").delete().eq("id", orderId);
        redirectError("stock");
      }
      continue;
    }

    const prev = Number(p.stock_local ?? 0);
    const next = Math.max(0, prev - line.quantity);
    const { error: uErr } = await supabase
      .from("products")
      .update({ stock_local: next })
      .eq("id", line.productId);
    if (uErr) {
      for (const rb of variantRollbacks) {
        await restoreVariantStockSnapshots(supabase, rb.productId, rb.snapshots);
      }
      for (const r of stockRollback) {
        await supabase.from("products").update({ stock_local: r.prev }).eq("id", r.id);
      }
      await supabase.from("orders").delete().eq("id", orderId);
      redirectError("db");
    }
    stockRollback.push({ id: line.productId, prev });
  }

  const totalFormatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(totalCents / 100);

  await logAdminActivity(supabase, {
    actorId: user.id,
    actionType: "sale_created",
    entityType: "order",
    entityId: orderId,
    summary: `Venta a ${String(customerRow.name ?? "Cliente")} · ${totalFormatted}`,
    metadata: {
      customer_id: customerId,
      subtotal_cents: subtotalCents,
      vat_cents: vatCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      payment_method: paymentMethod,
      line_items: resolvedLines.length,
    },
  });
  revalidatePath("/admin/actividades");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/ventas");
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/orders/${orderId}`);
}
