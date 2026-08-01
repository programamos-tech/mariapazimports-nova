import Link from "next/link";
import { notFound } from "next/navigation";
import { listStoreOrderPaymentProofs } from "@/app/actions/order-payment-proof";
import { OrderPaymentProofDownloads } from "@/components/store/OrderPaymentProofDownloads";
import { OrderPaymentProofUpload } from "@/components/store/OrderPaymentProofUpload";
import { OrderStatusBanner } from "@/components/store/OrderStatusBanner";
import { OrderTrackingLinkSave } from "@/components/store/OrderTrackingLinkSave";
import { OrderTrackingSummary } from "@/components/store/OrderTrackingSummary";
import { OrderTrackingTimeline } from "@/components/store/OrderTrackingTimeline";
import {
  StorePrimaryLinkButton,
  StoreProductSuggestionsGrid,
} from "@/components/store/StoreProductSuggestionsGrid";
import { fetchStoreProductSuggestions } from "@/lib/store-product-suggestions";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { storeShellClass } from "@/lib/store-layout";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import { formatCop } from "@/lib/money";

export const metadata = {
  title: "Seguimiento del pedido",
};

export default async function PedidoSeguimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const trackingToken = String(token ?? "").trim();
  if (!trackingToken) notFound();

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, subtotal_cents, shipping_cents, currency, created_at, customer_name, fulfillment_status, payment_method, tracking_token",
    )
    .eq("tracking_token", trackingToken)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, quantity, unit_price_cents, product_name_snapshot, product_id, variant_label_snapshot",
    )
    .eq("order_id", order.id);

  const orderRef = ventaNumeroReferencia(String(order.id));
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const trackingUrl = `${siteUrl}/pedidos/seguimiento/${encodeURIComponent(trackingToken)}`;

  const excludeProductIds = (items ?? [])
    .map((line) => line.product_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const isBankTransferOrder = order.payment_method === "bank_transfer";

  const suggestions = await fetchStoreProductSuggestions(
    supabase,
    excludeProductIds,
    8,
  );

  const proofs = isBankTransferOrder
    ? await listStoreOrderPaymentProofs(String(order.id), trackingToken)
    : [];

  const fulfillment = order.fulfillment_status
    ? String(order.fulfillment_status)
    : null;
  const awaitingProof =
    fulfillment === "awaiting_payment" || fulfillment == null;
  const pendingValidation =
    order.status === "pending" &&
    (fulfillment === "payment_submitted" || proofs.length > 0);
  const canUploadProof =
    isBankTransferOrder &&
    order.status === "pending" &&
    (awaitingProof || fulfillment === "payment_submitted");
  const showProgressTimeline =
    !awaitingProof && fulfillment !== "cancelled";

  const lines = items ?? [];
  const totalCents = Number(order.total_cents);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white">
      <div className={`${storeShellClass} pb-14 pt-10 lg:pb-16 lg:pt-12`}>
        <nav
          aria-label="Migas de pan"
          className="mb-8 text-[11px] uppercase tracking-[0.12em] text-stone-400"
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="transition hover:text-stone-800">
                Inicio
              </Link>
            </li>
            <li aria-hidden className="text-stone-300">
              /
            </li>
            <li className="text-stone-600">Seguimiento</li>
          </ol>
        </nav>

        <h1 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-900 sm:text-[15px] sm:tracking-[0.26em]">
          {pendingValidation
            ? "Pedido pendiente de validación"
            : `Pedido #${orderRef}`}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {pendingValidation ? (
            <>
              Pedido #{orderRef} · {order.customer_name}
            </>
          ) : (
            <>
              {order.customer_name} ·{" "}
              {new Date(String(order.created_at)).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </>
          )}
        </p>

        {sp.uploaded === "1" || pendingValidation ? (
          <div
            className="mt-6 border border-stone-200 bg-[#f4f4f3] px-4 py-3 text-sm text-stone-700"
            role="status"
          >
            {sp.uploaded === "1"
              ? "Comprobante enviado. Pendiente de validación de pago."
              : "Pendiente de validación de pago. Te avisaremos cuando lo confirmemos."}
          </div>
        ) : null}

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_min(100%,340px)] lg:items-start xl:gap-16">
          <div className="min-w-0 space-y-12">
            <OrderStatusBanner
              fulfillmentStatus={fulfillment ?? "awaiting_payment"}
              paymentStatus={String(order.status)}
            />

            <OrderTrackingSummary
              items={lines}
              totalCents={totalCents}
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

            <OrderTrackingLinkSave trackingUrl={trackingUrl} />

            {showProgressTimeline ? (
              <section className="border-t border-stone-200 pt-10">
                <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                  Avance del pedido
                </h2>
                <OrderTrackingTimeline
                  fulfillmentStatus={fulfillment}
                  paymentStatus={String(order.status)}
                />
              </section>
            ) : null}

            <div className="space-y-8 border-t border-stone-200 pt-10">
              <StoreProductSuggestionsGrid suggestions={suggestions} />
              <StorePrimaryLinkButton href="/products">
                Seguir comprando
              </StorePrimaryLinkButton>
            </div>
          </div>

          <aside className="sticky top-28 space-y-6 bg-[#f4f4f3] p-6 lg:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                Total
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">
                {formatCop(totalCents)}
              </p>
            </div>

            {pendingValidation ? (
              <>
                <p className="text-sm leading-relaxed text-stone-600">
                  Puedes descargar el comprobante que enviaste.
                </p>
                <OrderPaymentProofDownloads proofs={proofs} />
              </>
            ) : null}

            {isBankTransferOrder && canUploadProof ? (
              <>
                {awaitingProof ? (
                  <p className="text-sm leading-relaxed text-stone-600">
                    Abre el botón para ver datos bancarios y subir el
                    comprobante.
                  </p>
                ) : null}
                <OrderPaymentProofUpload
                  orderId={String(order.id)}
                  token={trackingToken}
                  orderRef={orderRef}
                  amountCents={totalCents}
                  showBankDetails={awaitingProof}
                  buttonLabel={
                    awaitingProof
                      ? "Subir comprobante"
                      : "Subir otro comprobante"
                  }
                  buttonClassName={
                    awaitingProof
                      ? "w-full bg-stone-900 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800"
                      : "w-full border border-stone-900 bg-white py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-50"
                  }
                />
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
