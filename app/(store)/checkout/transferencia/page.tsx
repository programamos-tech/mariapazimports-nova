import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderPaymentProofUpload } from "@/components/store/OrderPaymentProofUpload";
import { OrderTrackingLinkSave } from "@/components/store/OrderTrackingLinkSave";
import { TransferBankDetails } from "@/components/store/TransferBankDetails";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { storeShellClass } from "@/lib/store-layout";
import { formatCop } from "@/lib/money";

export const metadata = {
  title: "Transferencia bancaria",
};

function uploadErrorMessage(error?: string) {
  switch (error) {
    case "archivo":
      return "Selecciona un archivo válido.";
    case "tipo":
      return "Formato no permitido. Usa JPG, PNG, WebP o PDF.";
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
      "id, total_cents, status, payment_method, fulfillment_status, tracking_token, customer_name",
    )
    .eq("id", orderId)
    .eq("tracking_token", token)
    .maybeSingle();

  if (!order || order.payment_method !== "bank_transfer") notFound();

  const trackingUrl = `/pedidos/seguimiento/${encodeURIComponent(token)}`;
  const orderRef = ventaNumeroReferencia(orderId);
  const proofUploaded =
    order.fulfillment_status === "payment_submitted" ||
    order.fulfillment_status === "accepted" ||
    order.fulfillment_status === "preparing" ||
    order.fulfillment_status === "shipped" ||
    order.fulfillment_status === "delivered";
  const paid = order.status === "paid";

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
            <li className="text-stone-600">Transferencia</li>
          </ol>
        </nav>

        <h1 className="text-xl font-semibold uppercase tracking-[0.12em] text-stone-900 sm:text-2xl">
          Pedido registrado
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Hola {order.customer_name}, tu pedido quedó creado. Realiza la
          transferencia por el monto exacto y sube el comprobante para que lo
          revisemos.
        </p>

        {uploadError ? (
          <div
            className="mt-6 max-w-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {uploadError}
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <TransferBankDetails
              orderRef={orderRef}
              amountCents={Number(order.total_cents)}
            />

            <OrderTrackingLinkSave trackingUrl={trackingUrl} />
          </div>

          <aside className="space-y-4 bg-[#f4f4f3] p-6 lg:p-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Total a transferir</span>
              <span className="text-lg font-semibold text-stone-900">
                {formatCop(Number(order.total_cents))}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-stone-500">
              Pedido #{orderRef}. Solo aceptamos el monto exacto indicado.
            </p>

            {paid ? (
              <div className="border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                Tu pago ya fue confirmado. Puedes ver el avance en el enlace de
                seguimiento.
              </div>
            ) : proofUploaded ? (
              <div className="border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-900">
                Recibimos tu comprobante. Te avisaremos cuando confirmemos el
                pago.
              </div>
            ) : (
              <OrderPaymentProofUpload orderId={orderId} token={token} />
            )}

            <Link
              href={trackingUrl}
              className="flex w-full items-center justify-center border border-stone-900 bg-white py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-50"
            >
              Ver seguimiento del pedido
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
