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
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

const LABELS: Record<OrderFulfillmentStatus, string> = {
  awaiting_payment: "Esperando transferencia",
  payment_submitted: "Comprobante enviado",
  accepted: "Pedido aceptado",
  preparing: "Alistando",
  shipped: "Despachado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const DESCRIPTIONS: Record<OrderFulfillmentStatus, string> = {
  awaiting_payment:
    "Realiza la transferencia y sube tu comprobante para que revisemos el pago.",
  payment_submitted:
    "Recibimos tu comprobante. Te avisaremos cuando confirmemos el pago.",
  accepted: "Tu pago fue confirmado. Pronto empezaremos a preparar tu pedido.",
  preparing: "Estamos preparando tu pedido.",
  shipped: "Tu pedido fue despachado.",
  delivered: "Tu pedido fue entregado.",
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

/** Pasos visibles en la línea de tiempo del cliente (sin cancelado). */
export const TRACKING_TIMELINE_STEPS: {
  key: OrderFulfillmentStatus;
  label: string;
}[] = [
  { key: "payment_submitted", label: "Comprobante recibido" },
  { key: "accepted", label: "Pedido aceptado" },
  { key: "preparing", label: "Alistando" },
  { key: "shipped", label: "Despachado" },
  { key: "delivered", label: "Entregado" },
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
