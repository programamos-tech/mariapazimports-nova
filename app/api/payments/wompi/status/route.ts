import { NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";
import { isPaymentError } from "@/lib/payments/errors";
import { paymentLogger } from "@/lib/payments/logger";
import { PaymentStatus } from "@/types/payment";

export const runtime = "nodejs";

/**
 * Consulta / reconcilia estado de un pago Wompi.
 * Query: reference (requerido) | transactionId (opcional, fuerza reconcile vía API)
 * No marca como pagado solo por query string — usa ledger + API Wompi.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = (searchParams.get("reference") ?? "").trim();
  const transactionId = (searchParams.get("transactionId") ?? "").trim();

  if (!reference && !transactionId) {
    return NextResponse.json(
      { ok: false, error: "Falta reference o transactionId" },
      { status: 400 },
    );
  }

  try {
    if (transactionId) {
      const reconciled =
        await PaymentService.reconcileByTransactionId(transactionId);
      if (reconciled) {
        return NextResponse.json({
          ok: true,
          payment: {
            id: reconciled.id,
            orderId: reconciled.orderId,
            reference: reconciled.reference,
            status: reconciled.status,
            amountInCents: reconciled.amountInCents,
            currency: reconciled.currency,
            statusMessage: reconciled.statusMessage,
          },
        });
      }
    }

    if (!reference) {
      return NextResponse.json(
        { ok: false, error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    const payment = await PaymentService.findByReference(reference);
    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    // Si aún PENDING y tenemos txn id en query, ya se intentó arriba.
    // Si PENDING sin txn, devolver estado actual (el webhook puede llegar después).
    return NextResponse.json({
      ok: true,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        reference: payment.reference,
        status: payment.status,
        amountInCents: payment.amountInCents,
        currency: payment.currency,
        statusMessage: payment.statusMessage,
        pending: payment.status === PaymentStatus.PENDING,
      },
    });
  } catch (err) {
    if (isPaymentError(err)) {
      paymentLogger.error("status route payment error", {
        code: err.code,
        message: err.message,
      });
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code },
        { status: err.httpStatus >= 500 ? 500 : 400 },
      );
    }
    paymentLogger.error("status route unexpected", err);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
