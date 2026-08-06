export type OrderFulfillmentStatus =
  | "awaiting_payment"
  | "payment_submitted"
  | "accepted"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_FULFILLMENT_STATUSES: OrderFulfillmentStatus[] = [
  "awaiting_payment",
  "payment_submitted",
  "accepted",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export const ADMIN_FULFILLMENT_OPTIONS: {
  value: OrderFulfillmentStatus;
  label: string;
}[] = [
  { value: "accepted", label: "Aceptado" },
  { value: "preparing", label: "Alistando" },
  { value: "shipped", label: "Despachado" },
  { value: "delivered", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

const LABELS: Record<OrderFulfillmentStatus, string> = {
  awaiting_payment: "Esperando comprobante",
  payment_submitted: "Pendiente de aprobación de pago",
  accepted: "Aceptado",
  preparing: "Alistando",
  shipped: "Despachado",
  delivered: "Finalizado",
  cancelled: "Cancelado",
};

const DESCRIPTIONS: Record<OrderFulfillmentStatus, string> = {
  awaiting_payment:
    "Transfiere el monto exacto y sube tu comprobante para que revisemos el pago.",
  payment_submitted:
    "Recibimos tu comprobante. Está pendiente de aprobación de pago.",
  accepted: "Tu pago fue confirmado. Pronto empezaremos a alistar tu pedido.",
  preparing: "Estamos alistando tu pedido.",
  shipped: "Tu pedido fue despachado.",
  delivered: "Tu pedido fue finalizado y entregado.",
  cancelled: "Este pedido fue cancelado.",
};

export function fulfillmentStatusLabel(
  status: string | null | undefined,
): string {
  const key = status as OrderFulfillmentStatus;
  return LABELS[key] ?? "En proceso";
}

export function fulfillmentStatusDescription(
  status: string | null | undefined,
): string {
  const key = status as OrderFulfillmentStatus;
  return DESCRIPTIONS[key] ?? "";
}

/**
 * Estado de cumplimiento que ve el cliente.
 * Si el cobro ya está `paid` (p. ej. Wompi APPROVED), no debe quedar
 * en estados de transferencia (“esperando comprobante”).
 */
export function resolveCustomerFulfillmentStatus(
  fulfillmentStatus: string | null | undefined,
  paymentStatus?: string | null,
): OrderFulfillmentStatus {
  if (
    fulfillmentStatus === "cancelled" ||
    paymentStatus === "cancelled"
  ) {
    return "cancelled";
  }

  if (
    paymentStatus === "paid" &&
    (fulfillmentStatus == null ||
      fulfillmentStatus === "awaiting_payment" ||
      fulfillmentStatus === "payment_submitted")
  ) {
    return "accepted";
  }

  if (
    fulfillmentStatus &&
    ORDER_FULFILLMENT_STATUSES.includes(
      fulfillmentStatus as OrderFulfillmentStatus,
    )
  ) {
    return fulfillmentStatus as OrderFulfillmentStatus;
  }

  return "awaiting_payment";
}

/** Pasos visibles en la línea de tiempo del cliente (sin cancelado ni “esperando”). */
export const TRACKING_TIMELINE_STEPS: {
  key: OrderFulfillmentStatus;
  label: string;
}[] = [
  { key: "payment_submitted", label: "Pendiente de aprobación de pago" },
  { key: "accepted", label: "Aceptado" },
  { key: "preparing", label: "Alistando" },
  { key: "shipped", label: "Despachado" },
  { key: "delivered", label: "Finalizado" },
];

export function fulfillmentStepIndex(
  status: string | null | undefined,
): number {
  const s = status as OrderFulfillmentStatus;
  if (s === "awaiting_payment") return -1;
  if (s === "cancelled") return -2;
  const idx = TRACKING_TIMELINE_STEPS.findIndex((step) => step.key === s);
  return idx >= 0 ? idx : 0;
}

export function isValidFulfillmentStatus(
  value: string,
): value is OrderFulfillmentStatus {
  return ORDER_FULFILLMENT_STATUSES.includes(value as OrderFulfillmentStatus);
}

export function canAdminAdvanceFulfillment(
  current: string | null | undefined,
): boolean {
  const s = current as OrderFulfillmentStatus;
  return (
    s === "accepted" ||
    s === "preparing" ||
    s === "shipped" ||
    s === "payment_submitted"
  );
}
