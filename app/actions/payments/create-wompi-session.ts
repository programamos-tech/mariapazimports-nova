"use server";

/**
 * Crea pedido + payment PENDING y devuelve parámetros del Widget Wompi.
 * No marca el pedido como pagado — eso lo hace el webhook / reconcile.
 */

import {
  getWompiConfig,
  isWompiWidgetConfigured,
} from "@/config/payments";
import { createPendingStoreOrderFromForm } from "@/lib/checkout/create-pending-order";
import { isPaymentError } from "@/lib/payments/errors";
import { paymentLogger } from "@/lib/payments/logger";
import { generateIntegritySignature } from "@/lib/payments/signature";
import { PaymentService } from "@/services/payment.service";
import type { CreateWompiCheckoutSessionResult } from "@/types/payment";

export type CreateWompiSessionActionResult =
  | { ok: true; session: CreateWompiCheckoutSessionResult }
  | { ok: false; error: string; code?: string };

export async function createWompiCheckoutSession(
  formData: FormData,
): Promise<CreateWompiSessionActionResult> {
  try {
    if (!isWompiWidgetConfigured()) {
      return {
        ok: false,
        error:
          "Wompi no está configurado (NEXT_PUBLIC_WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET).",
        code: "CONFIG",
      };
    }

    const order = await createPendingStoreOrderFromForm(formData, "wompi");

    const payment = await PaymentService.createPending({
      amountPesos: order.totalPesos,
      currency: order.currency,
      orderId: order.orderId,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      metadata: {
        orderId: order.orderId,
        source: "store_checkout",
      },
    });

    const config = getWompiConfig();
    if (
      process.env.NODE_ENV === "production" &&
      /localhost|127\.0\.0\.1/i.test(config.baseUrl)
    ) {
      return {
        ok: false,
        error:
          "Falta NEXT_PUBLIC_SITE_URL en producción (el Widget no puede redirigir a localhost).",
        code: "CONFIG",
      };
    }

    const integritySignature = generateIntegritySignature({
      reference: payment.reference,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      integritySecret: config.integritySecret,
    });

    const orderPath = `/cuenta/pedidos/${order.orderId}`;
    const session: CreateWompiCheckoutSessionResult = {
      paymentId: payment.id,
      orderId: order.orderId,
      reference: payment.reference,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      publicKey: config.publicKey,
      integritySignature,
      redirectUrl: `${config.baseUrl}${orderPath}`,
      environment: payment.environment,
      customerEmail: order.customerEmail || undefined,
      customerFullName: order.customerName || undefined,
      customerPhone: order.customerPhone || undefined,
      trackingToken: order.trackingToken || null,
    };

    paymentLogger.info("wompi checkout session ready", {
      paymentId: payment.id,
      orderId: order.orderId,
      reference: payment.reference,
      amountInCents: payment.amountInCents,
      baseUrl: config.baseUrl,
      publicKeyPrefix: config.publicKey.slice(0, 12),
    });

    return { ok: true, session };
  } catch (err) {
    if (isPaymentError(err)) {
      return { ok: false, error: err.message, code: err.code };
    }
    // redirect() de Next debe propagarse
    throw err;
  }
}
