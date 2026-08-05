import Link from "next/link";
import { notFound } from "next/navigation";
import { listStoreOrderPaymentProofs } from "@/app/actions/order-payment-proof";
import { OrderPaymentProofDownloads } from "@/components/store/OrderPaymentProofDownloads";
import { OrderPaymentProofUpload } from "@/components/store/OrderPaymentProofUpload";
import { OrderStatusBanner } from "@/components/store/OrderStatusBanner";
import { OrderTrackingLinkSave } from "@/components/store/OrderTrackingLinkSave";
import { OrderTrackingSummary } from "@/components/store/OrderTrackingSummary";
import { OrderTrackingTimeline } from "@/components/store/OrderTrackingTimeline";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { storeShellClass } from "@/lib/store-layout";
import { formatCop } from "@/lib/money";

export const metadata = {
  title: "Pedido registrado · Transferencia",
};

function uploadErrorMessage(error?: string) {
  switch (error) {
    case "archivo":
      return "Selecciona un archivo válido.";
    case "tipo":
      return "Formato no permitido. Usa JPG, PNG, WebP, HEIC o PDF.";
    case "limite":
      return "Ya subiste el máximo de comprobantes para este pedido.";
    case "subida":
      return "No se pudo subir el archivo. Intenta de nuevo.";
    case "db":
      return "No se pudo registrar el comprobante.";
    default:
      return null;
  }
}

export default async function CheckoutTransferenciaPage({
  searchParams,
}: {
  searchParams: Promise<{
    order_id?: string;
    token?: string;
    error?: string;
    uploaded?: string;
  }>;
}) {
  const sp = await searchParams;
  const orderId = String(sp.order_id ?? "").trim();
  const token = String(sp.token ?? "").trim();
  const uploadError = uploadErrorMessage(sp.error);

  if (!orderId || !token) notFound();

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, total_cents, subtotal_cents, shipping_cents, status, payment_method, fulfillment_status, tracking_token, customer_name, customer_email, shipping_address, shipping_city, shipping_phone, created_at",
    )
    .eq("id", orderId)
    .eq("tracking_token", token)
    .maybeSingle();

  if (!order || order.payment_method !== "bank_transfer") notFound();

  const [{ data: items }, proofs] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        "id, quantity, unit_price_cents, product_name_snapshot, variant_label_snapshot",
      )
      .eq("order_id", orderId),
    listStoreOrderPaymentProofs(orderId, token),
  ]);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const trackingPath = `/pedidos/seguimiento/${encodeURIComponent(token)}`;
  const trackingUrl = `${siteUrl}${trackingPath}`;
  const orderRef = ventaNumeroReferencia(orderId);
  const fulfillment = order.fulfillment_status
    ? String(order.fulfillment_status)
    : "awaiting_payment";
  const paid = order.status === "paid";
  const awaitingProof = fulfillment === "awaiting_payment";
  const pendingValidation =
    !paid && (fulfillment === "payment_submitted" || proofs.length > 0);
  const canUploadProof =
    !paid &&
    (fulfillment === "awaiting_payment" || fulfillment === "payment_submitted");
  const showProgressTimeline = !awaitingProof && fulfillment !== "cancelled";
  const lines = items ?? [];
  const totalCents = Number(order.total_cents);
  const subtotalCents =
    order.subtotal_cents != null ? Number(order.subtotal_cents) : undefined;
  const shippingCents =
    order.shipping_cents != null ? Number(order.shipping_cents) : undefined;

  return (
    <div className="bg-white">
      <div className={`${storeShellClass} pb-10 pt-5 sm:pt-6 lg:pb-12`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ol className="flex flex-wrap items-center gap-x-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 sm:text-[11px]">
            <li className="text-stone-500">1 · Envío</li>
            <li aria-hidden className="text-stone-300">
              —
            </li>
            <li className="text-stone-500">2 · Pago</li>
            <li aria-hidden className="text-stone-300">
              —
            </li>
            <li className="text-stone-900">3 · Confirmación</li>
          </ol>
          <p className="font-mono text-[11px] text-stone-500">#{orderRef}</p>
        </div>

        <h1 className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-stone-900 sm:tracking-[0.22em]">
          {pendingValidation
            ? "Pedido pendiente de validación"
            : "Pedido registrado"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {pendingValidation
            ? `Hola ${order.customer_name}. Recibimos tu comprobante y estamos validando el pago.`
            : `Hola ${order.customer_name}. Tu pedido quedó creado.`}
        </p>

        {uploadError ? (
          <div
            className="mt-3 border border-red-200 bg-red-50/90 px-3 py-2.5 text-sm text-red-900"
            role="alert"
          >
            {uploadError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_min(100%,300px)] lg:items-start xl:gap-10">
          <div className="min-w-0 space-y-6">
            <OrderStatusBanner
              fulfillmentStatus={fulfillment}
              paymentStatus={String(order.status)}
              compact
            />

            <OrderTrackingSummary
              items={lines}
              totalCents={totalCents}
              subtotalCents={subtotalCents}
              shippingCents={shippingCents}
              dense
            />

            <section className="border-t border-stone-200 pt-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                Datos de envío
              </h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm text-stone-700 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.1em] text-stone-400">
                    Nombre
                  </dt>
                  <dd className="mt-0.5 font-medium text-stone-900">
                    {order.customer_name}
                  </dd>
                </div>
                {order.customer_email ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-stone-400">
                      Email
                    </dt>
                    <dd className="mt-0.5">{String(order.customer_email)}</dd>
                  </div>
                ) : null}
                {order.shipping_phone ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-stone-400">
                      Teléfono
                    </dt>
                    <dd className="mt-0.5">{String(order.shipping_phone)}</dd>
                  </div>
                ) : null}
                {order.shipping_address ? (
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-stone-400">
                      Dirección
                    </dt>
                    <dd className="mt-0.5">
                      {String(order.shipping_address)}
                      {order.shipping_city
                        ? `, ${String(order.shipping_city)}`
                        : ""}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <OrderTrackingLinkSave trackingUrl={trackingUrl} dense />

            {showProgressTimeline ? (
              <section className="border-t border-stone-200 pt-5">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                  Avance del pedido
                </h2>
                <OrderTrackingTimeline
                  fulfillmentStatus={fulfillment}
                  paymentStatus={String(order.status)}
                />
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 bg-[#f4f4f3] p-5 lg:sticky lg:top-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                {pendingValidation ? "Total del pedido" : "Total a transferir"}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-stone-900">
                {formatCop(totalCents)}
              </p>
              <p className="mt-1 text-xs text-stone-500">Pedido #{orderRef}</p>
            </div>

            {paid ? (
              <p className="text-xs leading-relaxed text-stone-600">
                Pago confirmado.
              </p>
            ) : pendingValidation ? (
              <p className="text-xs leading-relaxed text-stone-600">
                Pendiente de validación. Puedes descargar el comprobante que
                enviaste.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-stone-600">
                Al subir el comprobante verás los datos bancarios.
              </p>
            )}

            {pendingValidation ? (
              <OrderPaymentProofDownloads proofs={proofs} />
            ) : null}

            {canUploadProof && awaitingProof ? (
              <OrderPaymentProofUpload
                orderId={orderId}
                token={token}
                orderRef={orderRef}
                amountCents={totalCents}
                showBankDetails
                buttonLabel="Subir comprobante"
                buttonClassName="w-full bg-stone-900 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800"
              />
            ) : null}

            {canUploadProof && pendingValidation ? (
              <OrderPaymentProofUpload
                orderId={orderId}
                token={token}
                orderRef={orderRef}
                amountCents={totalCents}
                showBankDetails={false}
                buttonLabel="Subir otro comprobante"
                buttonClassName="w-full border border-stone-900 bg-white py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-50"
              />
            ) : null}

            <Link
              href={trackingPath}
              className="flex w-full items-center justify-center border border-stone-900 bg-white py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-50"
            >
              Ver seguimiento
            </Link>
            <Link
              href="/products"
              className="flex w-full items-center justify-center py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-900"
            >
              Seguir comprando
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
