"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import { isOnlineBankTransferOrder } from "@/lib/bank-transfer";
import {
  isValidFulfillmentStatus,
  type OrderFulfillmentStatus,
} from "@/lib/order-fulfillment";
import { deductStockForOrderItem } from "@/lib/product-stock";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

async function assertVentasVer() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "auth" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { ok: false as const, error: "auth" as const };

  const perm = await loadAdminPermissions();
  if (!perm?.permissions.ventas_ver) {
    return { ok: false as const, error: "forbidden" as const };
  }

  return { ok: true as const, supabase, userId: user.id };
}

async function assertVentasCrear() {
  const gate = await assertVentasVer();
  if (!gate.ok) return gate;

  const perm = await loadAdminPermissions();
  if (!perm?.permissions.ventas_crear) {
    return { ok: false as const, error: "forbidden" as const };
  }

  return gate;
}

export async function acceptBankTransferOrder(orderId: string) {
  const id = String(orderId ?? "").trim();
  if (!id) return { ok: false as const, error: "invalid" as const };

  const gate = await assertVentasCrear();
  if (!gate.ok) return gate;

  const service = createSupabaseServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id, status, payment_method, wompi_reference, fulfillment_status")
    .eq("id", id)
    .maybeSingle();

  if (!order) return { ok: false as const, error: "not_found" as const };

  if (
    !isOnlineBankTransferOrder(order.wompi_reference, order.payment_method)
  ) {
    return { ok: false as const, error: "not_transfer" as const };
  }

  if (order.status === "paid") {
    return { ok: true as const, alreadyPaid: true as const };
  }

  if (order.status === "cancelled") {
    return { ok: false as const, error: "cancelled" as const };
  }

  const { data: items } = await service
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", id);

  for (const item of items ?? []) {
    const productId = String(item.product_id ?? "");
    const variantId =
      item.variant_id != null ? String(item.variant_id) : null;
    const qty = Number(item.quantity ?? 0);
    if (!productId || qty <= 0) continue;

    const ok = await deductStockForOrderItem(
      service,
      productId,
      variantId,
      qty,
    );
    if (!ok) {
      return { ok: false as const, error: "stock" as const };
    }
  }

  const { error } = await service
    .from("orders")
    .update({
      status: "paid",
      fulfillment_status: "accepted",
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: "db" as const };

  await logAdminActivity(gate.supabase, {
    actorId: gate.userId,
    actionType: "sale_created",
    entityType: "order",
    entityId: id,
    summary: "Pedido por transferencia aceptado",
    metadata: { payment_method: "bank_transfer", accepted: true },
  });

  revalidatePathsForOrder(id);
  return { ok: true as const };
}

export async function updateOrderFulfillmentStatus(
  orderId: string,
  fulfillmentStatus: string,
) {
  const id = String(orderId ?? "").trim();
  const next = String(fulfillmentStatus ?? "").trim();

  if (!id || !isValidFulfillmentStatus(next)) {
    return { ok: false as const, error: "invalid" as const };
  }

  const gate = await assertVentasCrear();
  if (!gate.ok) return gate;

  const allowedForPaid: OrderFulfillmentStatus[] = [
    "accepted",
    "preparing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const { data: order } = await gate.supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!order) return { ok: false as const, error: "not_found" as const };

  if (order.status !== "paid" && next !== "cancelled") {
    return { ok: false as const, error: "not_paid" as const };
  }

  if (!allowedForPaid.includes(next) && next !== "cancelled") {
    return { ok: false as const, error: "invalid" as const };
  }

  const payload: {
    fulfillment_status: OrderFulfillmentStatus;
    status?: string;
  } = { fulfillment_status: next };

  if (next === "cancelled") {
    payload.status = "cancelled";
  }

  const { error } = await gate.supabase.from("orders").update(payload).eq("id", id);
  if (error) return { ok: false as const, error: "db" as const };

  revalidatePathsForOrder(id);
  return { ok: true as const };
}

function revalidatePathsForOrder(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/ventas");
  revalidatePath("/cuenta/pedidos");
}

export async function getOrderPaymentProofSignedUrl(storagePath: string) {
  const gate = await assertVentasVer();
  if (!gate.ok) return null;

  const key = storagePath.replace(/^order-payment-proofs\//, "");
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from("order-payment-proofs")
    .createSignedUrl(key, 60 * 10);

  if (error || !data?.signedUrl) {
    console.error("[payment-proof] signed url", error?.message);
    return null;
  }
  return data.signedUrl;
}
