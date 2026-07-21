/**
 * Referencias únicas de pago (max ~36–64 chars; Wompi recomienda unicidad).
 */

import { randomBytes } from "node:crypto";
import { PaymentError } from "@/lib/payments/errors";

const REF_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{5,63}$/;

export function createPaymentReference(prefix = "PAY"): string {
  const clean = prefix.replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "PAY";
  const stamp = Date.now().toString(36).toUpperCase();
  const rnd = randomBytes(4).toString("hex").toUpperCase();
  const ref = `${clean}-${stamp}-${rnd}`;
  if (ref.length > 64) return ref.slice(0, 64);
  return ref;
}

/**
 * Referencia ligada a un pedido: ORDER_SHORT + random.
 * En otro dominio: RESERVA-, SUB-, INV-, etc.
 */
export function createOrderPaymentReference(orderId: string): string {
  const short = orderId.replace(/-/g, "").slice(0, 12).toUpperCase();
  return createPaymentReference(`O${short}`);
}

export function assertValidPaymentReference(reference: string): string {
  const r = reference.trim();
  if (!REF_RE.test(r)) {
    throw new PaymentError(
      "REFERENCE",
      "Referencia inválida (6–64 chars alfanuméricos)",
      { details: { reference: r } },
    );
  }
  return r;
}
