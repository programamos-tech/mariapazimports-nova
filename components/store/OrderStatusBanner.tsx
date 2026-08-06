import {
  fulfillmentStatusDescription,
  fulfillmentStatusLabel,
  resolveCustomerFulfillmentStatus,
  type OrderFulfillmentStatus,
} from "@/lib/order-fulfillment";

/** Colores de acento discreto (barra), alineados a la tienda. */
const STATUS_ACCENT: Record<OrderFulfillmentStatus, string> = {
  awaiting_payment: "bg-amber-600",
  payment_submitted: "bg-sky-700",
  accepted: "bg-[var(--store-accent,#556654)]",
  preparing: "bg-[var(--store-accent,#556654)]",
  shipped: "bg-stone-800",
  delivered: "bg-stone-900",
  cancelled: "bg-red-700",
};

export function OrderStatusBanner({
  fulfillmentStatus,
  paymentStatus,
  compact = false,
}: {
  fulfillmentStatus: string | null;
  paymentStatus?: string;
  compact?: boolean;
}) {
  const key = resolveCustomerFulfillmentStatus(
    fulfillmentStatus,
    paymentStatus,
  );
  const accent = STATUS_ACCENT[key];
  const label = fulfillmentStatusLabel(key);
  const description =
    key === "awaiting_payment"
      ? "Transfiere el monto exacto y sube el comprobante para continuar."
      : fulfillmentStatusDescription(key);

  return (
    <div
      className="flex overflow-hidden border border-stone-200 bg-white"
      role="status"
    >
      <span className={`w-1 shrink-0 ${accent}`} aria-hidden />
      <div className="min-w-0 flex-1 px-3.5 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          Estado del pedido
        </p>
        <p className="mt-0.5 text-sm font-semibold uppercase tracking-[0.06em] text-stone-900">
          {label}
        </p>
        <p
          className={
            compact
              ? "mt-0.5 text-xs leading-snug text-stone-500"
              : "mt-1 text-sm leading-snug text-stone-500"
          }
        >
          {description}
        </p>
      </div>
    </div>
  );
}
