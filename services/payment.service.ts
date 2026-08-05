/**
 * PaymentService — única fuente de lógica de negocio de pagos.
 * Route handlers / server actions solo delegan aquí.
 */

import { getWompiConfig, getWompiEnv } from "@/config/payments";
import { amountsMatch, domainAmountToWompiCents } from "@/lib/payments/amount";
import { AmountMismatchError, PaymentError } from "@/lib/payments/errors";
import { paymentLogger } from "@/lib/payments/logger";
import {
  assertValidPaymentReference,
  createOrderPaymentReference,
  createPaymentReference,
} from "@/lib/payments/reference";
import {
  canTransitionPaymentStatus,
  mapWompiStatusToPaymentStatus,
} from "@/lib/payments/status";
import { generateIntegritySignature } from "@/lib/payments/signature";
import { getWompiTransaction } from "@/lib/payments/transaction";
import { deductStockForOrderItem } from "@/lib/product-stock";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  PaymentProvider,
  PaymentStatus,
  type CreatePaymentInput,
  type Payment,
  type PaymentMetadata,
} from "@/types/payment";
import type { WompiTransaction } from "@/types/wompi";

type PaymentRow = {
  id: string;
  order_id: string | null;
  provider: string;
  provider_transaction_id: string | null;
  provider_link_id: string | null;
  reference: string;
  amount_in_cents: number;
  currency: string;
  status: PaymentStatus;
  payment_method_type: string | null;
  status_message: string | null;
  customer_email: string;
  customer_name: string;
  environment: "sandbox" | "production";
  raw_response: Record<string, unknown> | null;
  metadata: PaymentMetadata | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  failed_at: string | null;
};

function mapRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider as Payment["provider"],
    providerTransactionId: row.provider_transaction_id,
    providerLinkId: row.provider_link_id,
    reference: row.reference,
    amountInCents: row.amount_in_cents,
    currency: row.currency,
    status: row.status,
    paymentMethodType: row.payment_method_type,
    statusMessage: row.status_message,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    environment: row.environment,
    rawResponse: row.raw_response,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    failedAt: row.failed_at,
  };
}

async function deductOrderStock(orderId: string): Promise<void> {
  const sb = createSupabaseServiceClient();
  const { data: items } = await sb
    .from("order_items")
    .select("product_id,variant_id,quantity")
    .eq("order_id", orderId);

  for (const it of items ?? []) {
    const pid = it.product_id as string | null;
    if (!pid) continue;
    const variantId = (it.variant_id as string | null | undefined) ?? null;
    const q = Number(it.quantity) || 0;
    await deductStockForOrderItem(sb, pid, variantId, q);
  }
}

export class PaymentService {
  static async createPending(input: CreatePaymentInput): Promise<Payment> {
    const email = input.customer.email.trim().toLowerCase();
    const name = input.customer.name.trim();
    if (!email || !name) {
      throw new PaymentError("VALIDATION", "Cliente requiere name y email");
    }

    const amountInCents = domainAmountToWompiCents(input.amountPesos);
    const currency = (input.currency ?? "COP").toUpperCase();
    const reference = assertValidPaymentReference(
      input.reference?.trim() ||
        (input.orderId
          ? createOrderPaymentReference(input.orderId)
          : createPaymentReference("PAY")),
    );

    const env = getWompiEnv();
    const sb = createSupabaseServiceClient();

    const { data, error } = await sb
      .from("payments")
      .insert({
        order_id: input.orderId ?? null,
        provider: input.provider ?? PaymentProvider.WOMPI,
        reference,
        amount_in_cents: amountInCents,
        currency,
        status: PaymentStatus.PENDING,
        customer_email: email,
        customer_name: name,
        environment: env,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error || !data) {
      paymentLogger.error("createPending failed", error);
      throw new PaymentError("DATABASE", "No se pudo crear el pago", {
        httpStatus: 500,
        details: { message: error?.message },
      });
    }

    paymentLogger.info("payment pending created", {
      paymentId: data.id,
      reference,
      amountInCents,
      orderId: input.orderId,
    });

    return mapRow(data as PaymentRow);
  }

  static async findByReference(reference: string): Promise<Payment | null> {
    const sb = createSupabaseServiceClient();
    const { data } = await sb
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    return data ? mapRow(data as PaymentRow) : null;
  }

  static async findById(id: string): Promise<Payment | null> {
    const sb = createSupabaseServiceClient();
    const { data } = await sb
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? mapRow(data as PaymentRow) : null;
  }

  /**
   * Registra un evento en el ledger (idempotente por checksum).
   * @returns false si el checksum ya existía.
   */
  static async recordEvent(input: {
    paymentId?: string | null;
    checksum: string;
    eventId?: string | null;
    eventType?: string | null;
    payload: Record<string, unknown>;
  }): Promise<boolean> {
    const sb = createSupabaseServiceClient();
    const { error } = await sb.from("payment_events").insert({
      payment_id: input.paymentId ?? null,
      checksum: input.checksum,
      event_id: input.eventId ?? null,
      event_type: input.eventType ?? null,
      payload: input.payload,
      provider: "wompi",
    });

    if (error) {
      if (error.code === "23505") {
        paymentLogger.info("event already processed (idempotent)", {
          checksum: input.checksum,
        });
        return false;
      }
      throw new PaymentError("DATABASE", "No se pudo registrar el evento", {
        httpStatus: 500,
        details: { message: error.message },
      });
    }
    return true;
  }

  /**
   * Aplica una transacción Wompi (webhook o reconciliación).
   * Valida monto/moneda; actualiza vía RPC; descuenta stock solo si APPROVED nuevo.
   */
  static async applyProviderTransaction(
    txn: WompiTransaction,
    source: "webhook" | "reconcile",
  ): Promise<Payment | null> {
    const mapped = mapWompiStatusToPaymentStatus(txn.status);
    if (!mapped || mapped === PaymentStatus.PENDING) {
      paymentLogger.debug("ignoring non-final txn status", {
        status: txn.status,
        source,
      });
      return null;
    }

    const sb = createSupabaseServiceClient();
    const { data: row } = await sb
      .from("payments")
      .select("*")
      .eq("reference", txn.reference)
      .maybeSingle();

    if (!row) {
      paymentLogger.warn("payment not found for reference", {
        reference: txn.reference,
        source,
      });
      return null;
    }

    const payment = mapRow(row as PaymentRow);

    if (!amountsMatch(payment.amountInCents, Number(txn.amount_in_cents))) {
      throw new AmountMismatchError(
        payment.amountInCents,
        Number(txn.amount_in_cents),
      );
    }

    if (
      txn.currency &&
      txn.currency.toUpperCase() !== payment.currency.toUpperCase()
    ) {
      throw new PaymentError("CURRENCY_MISMATCH", "Moneda no coincide", {
        httpStatus: 409,
        details: { expected: payment.currency, actual: txn.currency },
      });
    }

    if (!canTransitionPaymentStatus(payment.status, mapped)) {
      paymentLogger.info("transition skipped", {
        from: payment.status,
        to: mapped,
        paymentId: payment.id,
      });
      return payment;
    }

    const { data: rpcRows, error: rpcErr } = await sb.rpc(
      "apply_wompi_payment_transition",
      {
        p_payment_id: payment.id,
        p_new_status: mapped,
        p_provider_transaction_id: txn.id,
        p_payment_method_type: txn.payment_method_type ?? null,
        p_status_message: txn.status_message ?? null,
        p_raw_response: txn as unknown as Record<string, unknown>,
      },
    );

    if (rpcErr) {
      paymentLogger.error("apply_wompi_payment_transition failed", rpcErr);
      throw new PaymentError("DATABASE", "No se pudo aplicar la transición", {
        httpStatus: 500,
        details: { message: rpcErr.message },
      });
    }

    const result = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    const stockShouldDeduct = Boolean(
      result &&
        typeof result === "object" &&
        "stock_should_deduct" in result &&
        (result as { stock_should_deduct: boolean }).stock_should_deduct,
    );
    const orderId =
      result &&
      typeof result === "object" &&
      "order_id" in result
        ? ((result as { order_id: string | null }).order_id ?? null)
        : payment.orderId;

    if (stockShouldDeduct && orderId) {
      await deductOrderStock(orderId);
      paymentLogger.info("stock deducted after APPROVED", { orderId, source });
    }

    // Solo en la primera transición a APPROVED (canTransition ya evitó reentradas).
    if (mapped === PaymentStatus.APPROVED && orderId) {
      try {
        const { sendOrderReceivedEmailsForOrderId } = await import(
          "@/lib/order-email"
        );
        await sendOrderReceivedEmailsForOrderId(orderId);
        paymentLogger.info("order confirmation email sent", {
          orderId,
          source,
        });
      } catch (emailErr) {
        paymentLogger.error("order confirmation email failed", emailErr);
      }
    }

    const updated = await this.findById(payment.id);
    paymentLogger.info("payment transition applied", {
      paymentId: payment.id,
      status: mapped,
      source,
      applied: result && typeof result === "object"
        ? (result as { applied?: boolean }).applied
        : undefined,
    });
    return updated;
  }

  static async reconcileByTransactionId(
    transactionId: string,
  ): Promise<Payment | null> {
    const txn = await getWompiTransaction(transactionId);
    return this.applyProviderTransaction(txn, "reconcile");
  }

  /** Firma integrity + datos públicos para abrir el Widget. */
  static buildWidgetSession(payment: Payment): {
    publicKey: string;
    integritySignature: string;
    redirectUrl: string;
    amountInCents: number;
    currency: string;
    reference: string;
    environment: "sandbox" | "production";
  } {
    const config = getWompiConfig();
    const integritySignature = generateIntegritySignature({
      reference: payment.reference,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      integritySecret: config.integritySecret,
    });

    return {
      publicKey: config.publicKey,
      integritySignature,
      redirectUrl: `${config.baseUrl}/cuenta/pedidos/${payment.orderId ?? ""}`,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      reference: payment.reference,
      environment: payment.environment,
    };
  }
}
