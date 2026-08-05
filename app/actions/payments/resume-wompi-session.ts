"use server";

/**
 * Reanuda parámetros del Widget para un payment PENDING existente.
 */

import {
  getWompiConfig,
  isWompiWidgetConfigured,
} from "@/config/payments";
import { isPaymentError, PaymentError } from "@/lib/payments/errors";
import { generateIntegritySignature } from "@/lib/payments/signature";
import { PaymentService } from "@/services/payment.service";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { PaymentStatus, type CreateWompiCheckoutSessionResult } from "@/types/payment";

export type ResumeWompiSessionResult =
  | { ok: true; session: CreateWompiCheckoutSessionResult }
  | { ok: false; error: string; code?: string };

export async function resumeWompiCheckoutSession(
  reference: string,
): Promise<ResumeWompiSessionResult> {
  try {
    if (!isWompiWidgetConfigured()) {
      return {
        ok: false,
        error: "Wompi no está configurado.",
        code: "CONFIG",
      };
    }

    const ref = reference.trim();
    if (!ref) {
      return { ok: false, error: "Falta la referencia del pago.", code: "VALIDATION" };
    }

    const payment = await PaymentService.findByReference(ref);
    if (!payment) {
      return { ok: false, error: "Pago no encontrado.", code: "NOT_FOUND" };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return {
        ok: false,
        error: `El pago ya está en estado ${payment.status}.`,
        code: "STATE",
      };
    }

    if (!payment.orderId) {
      throw new PaymentError("VALIDATION", "El pago no tiene pedido asociado");
    }

    const config = getWompiConfig();
    const integritySignature = generateIntegritySignature({
      reference: payment.reference,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      integritySecret: config.integritySecret,
    });

    let trackingToken: string | null = null;
    const sb = createSupabaseServiceClient();
    const { data: orderRow } = await sb
      .from("orders")
      .select("tracking_token")
      .eq("id", payment.orderId)
      .maybeSingle();
    if (orderRow?.tracking_token) {
      trackingToken = String(orderRow.tracking_token);
    }

    const orderPath = `/cuenta/pedidos/${payment.orderId}`;

    return {
      ok: true,
      session: {
        paymentId: payment.id,
        orderId: payment.orderId,
        reference: payment.reference,
        amountInCents: payment.amountInCents,
        currency: payment.currency,
        publicKey: config.publicKey,
        integritySignature,
        redirectUrl: `${config.baseUrl}${orderPath}`,
        environment: payment.environment,
        customerEmail: payment.customerEmail || undefined,
        customerFullName: payment.customerName || undefined,
        trackingToken,
      },
    };
  } catch (err) {
    if (isPaymentError(err)) {
      return { ok: false, error: err.message, code: err.code };
    }
    throw err;
  }
}
