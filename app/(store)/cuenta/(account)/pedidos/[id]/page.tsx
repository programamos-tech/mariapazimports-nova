import Link from "next/link";
import { notFound } from "next/navigation";
import {
  storeBreadcrumbLinkClass,
  storeBtnPrimaryClass,
  storeBtnSecondaryClass,
  storeFieldLabelClass,
} from "@/components/store/store-ui-primitives";
import { OrderStatusBanner } from "@/components/store/OrderStatusBanner";
import { OrderTrackingSummary } from "@/components/store/OrderTrackingSummary";
import { OrderTrackingTimeline } from "@/components/store/OrderTrackingTimeline";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import {
  fetchShippingMunicipalityByCode,
} from "@/lib/shipping-rates";
import { formatMunicipalityLabel } from "@/lib/colombia-geo";

export const metadata = {
  title: "Detalle del pedido",
};

function paymentMethodLabel(
  method: string | null | undefined,
  wompiReference: string | null | undefined,
): string {
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "wompi") return "Pago en línea (Wompi)";
  const ref = wompiReference?.trim() ?? "";
  if (ref.startsWith("ONLINE:transfer") || ref === "ONLINE:transfer") {
    return "Transferencia bancaria";
  }
  if (ref.startsWith("POS:")) return "Compra en mostrador";
  if (method?.trim()) return method;
  return "No registrado";
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pendiente de pago";
    case "paid":
      return "Pagado";
    case "failed":
      return "Pago fallido";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

function shippingMethodLabel(method: string | null | undefined) {
  if (method === "pickup") return "Recoger en tienda";
  if (method === "delivery") return "Envío a domicilio";
  return method?.trim() || "Envío a domicilio";
}

export default async function CuentaPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, subtotal_cents, shipping_cents, currency, created_at, customer_name, customer_email, shipping_address, shipping_city, shipping_postal_code, shipping_phone, shipping_department_code, shipping_municipality_code, shipping_method, payment_method, fulfillment_status, tracking_token, wompi_reference",
    )
    .eq("id", id)
    .maybeSingle();

  if (oErr || !order) {
    notFound();
  }

  const [{ data: items }, munRow] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        "id, quantity, unit_price_cents, product_name_snapshot, product_id, variant_label_snapshot",
      )
      .eq("order_id", id),
    order.shipping_municipality_code
      ? fetchShippingMunicipalityByCode(
          supabase,
          String(order.shipping_municipality_code),
          { admin: true },
        ).catch(() => null)
      : Promise.resolve(null),
  ]);

  const lines = items ?? [];
  const orderRef = ventaNumeroReferencia(String(order.id));
  const fulfillment = order.fulfillment_status
    ? String(order.fulfillment_status)
    : null;
  const paymentStatus = String(order.status);
  const trackingToken = order.tracking_token
    ? String(order.tracking_token)
    : null;
  const isBankTransfer = order.payment_method === "bank_transfer";
  const showTimeline =
    fulfillment != null &&
    fulfillment !== "awaiting_payment" &&
    fulfillment !== "cancelled";

  const deptRel = munRow?.shipping_departments;
  const departmentName = Array.isArray(deptRel)
    ? deptRel[0]?.name
    : deptRel?.name;
  const destinationLabel = munRow
    ? formatMunicipalityLabel(munRow.name, departmentName ?? null)
    : order.shipping_city
      ? String(order.shipping_city)
      : null;

  const trackingHref = trackingToken
    ? `/pedidos/seguimiento/${encodeURIComponent(trackingToken)}`
    : null;

  const cardClass =
    "rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6";

  return (
    <div className="space-y-8">
      <nav aria-label="Migas de pan" className="text-sm text-stone-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/cuenta/pedidos" className={storeBreadcrumbLinkClass}>
              Mis pedidos
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-700">
            Detalle
          </li>
        </ol>
      </nav>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Pedido #{orderRef}
        </p>
        <h1 className="mt-1.5 text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-2xl">
          Detalle de compra
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {paymentStatusLabel(paymentStatus)} ·{" "}
          {new Date(order.created_at).toLocaleString("es-CO", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        </p>
        <p className="mt-1 font-mono text-[11px] text-stone-400">
          ID {String(order.id)}
        </p>
      </div>

      <OrderStatusBanner
        fulfillmentStatus={fulfillment ?? "awaiting_payment"}
        paymentStatus={paymentStatus}
      />

      <section className={cardClass}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          Pago
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className={storeFieldLabelClass}>Método</dt>
            <dd className="text-sm font-medium text-stone-900">
              {paymentMethodLabel(
                order.payment_method,
                order.wompi_reference,
              )}
            </dd>
          </div>
          <div>
            <dt className={storeFieldLabelClass}>Estado del pago</dt>
            <dd className="text-sm font-medium text-stone-900">
              {paymentStatusLabel(paymentStatus)}
            </dd>
          </div>
          <div>
            <dt className={storeFieldLabelClass}>Moneda</dt>
            <dd className="text-sm font-medium uppercase text-stone-900">
              {order.currency ?? "COP"}
            </dd>
          </div>
          <div>
            <dt className={storeFieldLabelClass}>Total</dt>
            <dd className="text-sm font-semibold tabular-nums text-stone-900">
              {formatCop(order.total_cents)}
            </dd>
          </div>
        </dl>
        {isBankTransfer && trackingHref ? (
          <div className="mt-5 border-t border-stone-100 pt-5">
            <Link href={trackingHref} className={storeBtnPrimaryClass}>
              Ver seguimiento y comprobante
            </Link>
          </div>
        ) : null}
      </section>

      <section className={cardClass}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          Envío
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className={storeFieldLabelClass}>Nombre</dt>
            <dd className="text-sm text-stone-900">{order.customer_name}</dd>
          </div>
          <div>
            <dt className={storeFieldLabelClass}>Email</dt>
            <dd className="text-sm text-stone-900">
              {order.customer_email?.trim() || "—"}
            </dd>
          </div>
          {order.shipping_phone ? (
            <div>
              <dt className={storeFieldLabelClass}>Teléfono</dt>
              <dd className="text-sm text-stone-900">{order.shipping_phone}</dd>
            </div>
          ) : null}
          <div>
            <dt className={storeFieldLabelClass}>Tipo de envío</dt>
            <dd className="text-sm text-stone-900">
              {shippingMethodLabel(order.shipping_method)}
            </dd>
          </div>
          {destinationLabel ? (
            <div>
              <dt className={storeFieldLabelClass}>Destino</dt>
              <dd className="text-sm text-stone-900">{destinationLabel}</dd>
            </div>
          ) : null}
          {order.shipping_address ? (
            <div className="sm:col-span-2">
              <dt className={storeFieldLabelClass}>Dirección</dt>
              <dd className="text-sm leading-relaxed text-stone-900">
                {order.shipping_address}
                {order.shipping_city ? `, ${order.shipping_city}` : ""}
                {order.shipping_postal_code
                  ? ` · ${order.shipping_postal_code}`
                  : ""}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className={cardClass}>
        <OrderTrackingSummary
          items={lines}
          totalCents={Number(order.total_cents)}
          subtotalCents={
            order.subtotal_cents != null
              ? Number(order.subtotal_cents)
              : undefined
          }
          shippingCents={
            order.shipping_cents != null
              ? Number(order.shipping_cents)
              : undefined
          }
        />
      </section>

      {showTimeline ? (
        <section className={cardClass}>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
            Avance del pedido
          </h2>
          <OrderTrackingTimeline
            fulfillmentStatus={fulfillment}
            paymentStatus={paymentStatus}
          />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/cuenta/pedidos" className={storeBtnSecondaryClass}>
          ← Mis pedidos
        </Link>
        <Link href="/products" className={storeBtnPrimaryClass}>
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
