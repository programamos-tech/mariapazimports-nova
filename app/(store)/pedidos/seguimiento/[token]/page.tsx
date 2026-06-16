import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderPaymentProofUpload } from "@/components/store/OrderPaymentProofUpload";
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
      "id, status, total_cents, currency, created_at, customer_name, fulfillment_status, payment_method, tracking_token",
    )
    .eq("tracking_token", trackingToken)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, quantity, unit_price_cents, product_name_snapshot, product_id")
    .eq("order_id", order.id);

  const orderRef = ventaNumeroReferencia(String(order.id));
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const trackingUrl = `${siteUrl}/pedidos/seguimiento/${encodeURIComponent(trackingToken)}`;

  const excludeProductIds = (items ?? [])
    .map((line) => line.product_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const suggestions = await fetchStoreProductSuggestions(
    supabase,
    excludeProductIds,
    8,
  );

  const canUploadProof =
    order.payment_method === "bank_transfer" &&
    order.status === "pending" &&
    (order.fulfillment_status === "awaiting_payment" ||
      order.fulfillment_status == null);

  const lines = items ?? [];

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

        <h1 className="text-xl font-semibold uppercase tracking-[0.12em] text-stone-900 sm:text-2xl">
          Pedido #{orderRef}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {order.customer_name} ·{" "}
          {new Date(String(order.created_at)).toLocaleString("es-CO", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        {sp.uploaded === "1" ? (
          <div
            className="mt-6 border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            Comprobante recibido. Revisaremos tu pago y actualizaremos el estado
            aquí.
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <OrderTrackingLinkSave trackingUrl={trackingUrl} />
          <OrderTrackingSummary
            items={lines}
            totalCents={Number(order.total_cents)}
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
          <OrderTrackingTimeline
            fulfillmentStatus={
              order.fulfillment_status != null
                ? String(order.fulfillment_status)
                : null
            }
            paymentStatus={String(order.status)}
          />

          <div className="space-y-8">
            <StoreProductSuggestionsGrid suggestions={suggestions} />

            {canUploadProof ? (
              <OrderPaymentProofUpload
                orderId={String(order.id)}
                token={trackingToken}
              />
            ) : null}

            <StorePrimaryLinkButton href="/products">
              Seguir comprando
            </StorePrimaryLinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
