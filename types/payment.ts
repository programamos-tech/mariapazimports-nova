/**
 * Contratos tipados del SDK de pagos (dominio-agnóstico).
 *
 * Campos de negocio reutilizables:
 * - En este proyecto el vínculo principal es `orderId`.
 * - En otro proyecto podrían usarse: reservaId, gimnasioId, subscriptionId, invoiceId.
 *   Preferí agregarlos en `metadata` (jsonb) o como columnas nullable nuevas.
 */

export const PaymentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
  ERROR: "ERROR",
  FAILED: "FAILED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentProvider = {
  WOMPI: "wompi",
  BANK_TRANSFER: "bank_transfer",
} as const;

export type PaymentProvider =
  (typeof PaymentProvider)[keyof typeof PaymentProvider];

export type PaymentCustomer = {
  name: string;
  email: string;
  phone?: string;
  /** Documento (CC/NIT). Opcional según el comercio. */
  legalId?: string;
  legalIdType?: "CC" | "CE" | "NIT" | "PP" | "TI";
};

/**
 * Metadatos libres del dominio.
 * Ejemplos en otros proyectos: productId, userId, reservaId, gimnasioId, subscriptionId.
 */
export type PaymentMetadata = Record<string, string | number | boolean | null>;

export type Payment = {
  id: string;
  /** FK al pedido de este proyecto. En otro dominio puede ser null y usarse metadata. */
  orderId: string | null;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  providerLinkId: string | null;
  reference: string;
  /** Centavos Wompi (COP × 100). No confundir con `orders.total_cents` (pesos enteros). */
  amountInCents: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodType: string | null;
  statusMessage: string | null;
  customerEmail: string;
  customerName: string;
  environment: "sandbox" | "production";
  rawResponse: Record<string, unknown> | null;
  metadata: PaymentMetadata;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  failedAt: string | null;
};

export type CreatePaymentInput = {
  /** Monto en pesos enteros del dominio (como `orders.total_cents`). */
  amountPesos: number;
  currency?: string;
  customer: PaymentCustomer;
  /** Referencia única. Si se omite, el servicio genera una. */
  reference?: string;
  /**
   * Vínculo de negocio.
   * Este proyecto: orderId.
   * Otros: reservaId / subscriptionId / invoiceId → preferí metadata o columnas propias.
   */
  orderId?: string | null;
  metadata?: PaymentMetadata;
  provider?: PaymentProvider;
};

export type CreateWompiCheckoutSessionResult = {
  paymentId: string;
  orderId: string;
  reference: string;
  /** Centavos Wompi listos para el widget. */
  amountInCents: number;
  currency: string;
  publicKey: string;
  integritySignature: string;
  redirectUrl: string;
  environment: "sandbox" | "production";
  /** Prefill del widget (solo si son válidos). */
  customerEmail?: string;
  customerFullName?: string;
  customerPhone?: string;
  /** Para ir al seguimiento público tras cerrar el widget. */
  trackingToken?: string | null;
};
