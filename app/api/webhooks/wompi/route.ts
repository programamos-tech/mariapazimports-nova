import { createHash } from "node:crypto";
import { getWompiEnv } from "@/config/payments";
import { PaymentService } from "@/services/payment.service";
import { isPaymentError } from "@/lib/payments/errors";
import { paymentLogger } from "@/lib/payments/logger";
import { verifyEventChecksum } from "@/lib/payments/signature";
import type { WompiTransaction, WompiWebhookPayload } from "@/types/wompi";

export const runtime = "nodejs";

/**
 * Webhook Wompi Events.
 * - Verifica X-Event-Checksum (events secret + timestamp)
 * - Idempotencia vía payment_events.checksum
 * - Confirma monto/moneda en PaymentService
 * - Nunca confía en el redirect del navegador
 */
export async function POST(request: Request) {
  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const headerChecksum =
    request.headers.get("x-event-checksum") ??
    request.headers.get("X-Event-Checksum");

  try {
    if (!verifyEventChecksum(body, headerChecksum)) {
      paymentLogger.warn("webhook signature rejected");
      return new Response("invalid signature", { status: 401 });
    }
  } catch (err) {
    paymentLogger.error("webhook signature config error", err);
    return new Response("signature config error", { status: 500 });
  }

  const payload = body as WompiWebhookPayload;
  const txn = payload.data?.transaction as WompiTransaction | undefined;
  if (!txn?.id || !txn.reference) {
    return new Response("ok", { status: 200 });
  }

  const checksum =
    (headerChecksum?.trim() ||
      payload.signature?.checksum ||
      createHash("sha256").update(raw).digest("hex")).trim();

  try {
    const payment = await PaymentService.findByReference(txn.reference);
    const isNew = await PaymentService.recordEvent({
      paymentId: payment?.id ?? null,
      checksum,
      eventId: `${payload.event ?? "event"}:${txn.id}:${payload.timestamp ?? ""}`,
      eventType: payload.event ?? null,
      payload: body as Record<string, unknown>,
    });

    if (!isNew) {
      return new Response("ok", { status: 200 });
    }

    await PaymentService.applyProviderTransaction(txn, "webhook");
    paymentLogger.info("webhook processed", {
      reference: txn.reference,
      txnId: txn.id,
      status: txn.status,
      env: getWompiEnv(),
    });
    return new Response("ok", { status: 200 });
  } catch (err) {
    if (isPaymentError(err)) {
      paymentLogger.error("webhook business error", {
        code: err.code,
        message: err.message,
        details: err.details,
      });
      // Mismatch de negocio: 200 para que Wompi no reintente en bucle.
      if (
        err.code === "AMOUNT_MISMATCH" ||
        err.code === "CURRENCY_MISMATCH"
      ) {
        return new Response(err.message, { status: 200 });
      }
      if (err.httpStatus >= 500) {
        return new Response(err.message, { status: 500 });
      }
      return new Response(err.message, { status: 200 });
    }
    paymentLogger.error("webhook unexpected error", err);
    return new Response("error", { status: 500 });
  }
}
