/**
 * Mapeo y validación de estados de pago.
 */

import { PaymentStatus } from "@/types/payment";
import type { WompiTransactionStatus } from "@/types/wompi";

const FINAL: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.APPROVED,
  PaymentStatus.DECLINED,
  PaymentStatus.VOIDED,
  PaymentStatus.ERROR,
  PaymentStatus.FAILED,
]);

export function mapWompiStatusToPaymentStatus(
  status: string | undefined | null,
): PaymentStatus | null {
  if (!status) return null;
  const u = status.toUpperCase() as WompiTransactionStatus | string;
  switch (u) {
    case "APPROVED":
      return PaymentStatus.APPROVED;
    case "DECLINED":
      return PaymentStatus.DECLINED;
    case "VOIDED":
      return PaymentStatus.VOIDED;
    case "ERROR":
      return PaymentStatus.ERROR;
    case "CANCELED":
    case "CANCELLED":
      return PaymentStatus.FAILED;
    case "PENDING":
      return PaymentStatus.PENDING;
    default:
      return null;
  }
}

export function isFinalPaymentStatus(status: PaymentStatus): boolean {
  return FINAL.has(status);
}

/**
 * Transiciones permitidas.
 * Nunca degradar APPROVED a otro estado final.
 */
export function canTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to) return true;
  if (from === PaymentStatus.APPROVED) return false;
  if (from === PaymentStatus.PENDING) return true;
  // Estados finales distintos de APPROVED: no reabrir.
  if (isFinalPaymentStatus(from)) return false;
  return true;
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PENDING:
      return "Pendiente";
    case PaymentStatus.APPROVED:
      return "Aprobado";
    case PaymentStatus.DECLINED:
      return "Rechazado";
    case PaymentStatus.VOIDED:
      return "Anulado";
    case PaymentStatus.ERROR:
      return "Error";
    case PaymentStatus.FAILED:
      return "Fallido";
    default:
      return status;
  }
}
