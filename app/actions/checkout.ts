"use server";

import { storeBrand } from "@/lib/brand";
import { createPendingStoreOrderFromForm } from "@/lib/checkout/create-pending-order";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  createPaymentLink,
  getWompiEnv,
  shouldSkipWompiPayment,
} from "@/lib/wompi";
import { isBankTransferConfigured } from "@/lib/bank-transfer";
import { redirect } from "next/navigation";

function parsePaymentMethod(
  raw: FormDataEntryValue | null,
): "wompi" | "bank_transfer" {
  const v = String(raw ?? "").trim();
  return v === "bank_transfer" ? "bank_transfer" : "wompi";
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/**
 * Checkout server action.
 * - bank_transfer → crea pedido y redirige a /checkout/transferencia
 * - wompi → legacy Payment Link (fallback). El flujo principal in-site usa
 *   `createWompiCheckoutSession` desde el cliente.
 */
export async function startCheckout(formData: FormData) {
  const paymentMethod = parsePaymentMethod(formData.get("paymentMethod"));

  if (paymentMethod === "bank_transfer" && !isBankTransferConfigured()) {
    redirect("/checkout?error=bank_transfer_unavailable");
  }

  // Flujo Widget: el cliente no debería llegar aquí con wompi.
  // Si llega, usamos Payment Link legacy o skip en dev.
  const order = await createPendingStoreOrderFromForm(formData, paymentMethod);

  if (paymentMethod === "bank_transfer" && order.trackingToken) {
    redirect(
      `/checkout/transferencia?order_id=${order.orderId}&token=${encodeURIComponent(order.trackingToken)}`,
    );
  }

  const returnUrl = `${siteUrl()}/checkout/return?order_id=${order.orderId}`;
  const supabase = createSupabaseServiceClient();

  if (shouldSkipWompiPayment()) {
    await supabase
      .from("orders")
      .update({ wompi_reference: order.orderId })
      .eq("id", order.orderId);

    if (process.env.NODE_ENV === "development") {
      console.info(
        "[checkout] Wompi omitido (sin clave en dev o CHECKOUT_SKIP_WOMPI). Pedido:",
        order.orderId,
      );
    }

    redirect(`${returnUrl}&test_checkout=1`);
  }

  const link = await createPaymentLink({
    name: `${storeBrand} · Pedido`,
    description: `Pedido ${order.orderId}`,
    // BUG legacy: amountInCents recibía pesos. El Widget nuevo usa ×100.
    // Payment Link legacy mantiene comportamiento previo para no romper demos
    // hasta deprecarlo; preferí createWompiCheckoutSession.
    amountInCents: order.totalPesos,
    currency: order.currency,
    redirectUrl: returnUrl,
    sku: order.orderId,
    singleUse: true,
  });

  if (!link.ok) {
    await supabase.from("orders").delete().eq("id", order.orderId);
    redirect(
      `/checkout?error=wompi&message=${encodeURIComponent(link.error)}`,
    );
  }

  await supabase
    .from("orders")
    .update({
      wompi_payment_link_id: link.id,
      wompi_reference: order.orderId,
    })
    .eq("id", order.orderId);

  const env = getWompiEnv();
  if (process.env.NODE_ENV === "development") {
    console.info("[checkout] Wompi env:", env, "order:", order.orderId);
  }

  redirect(link.url);
}
