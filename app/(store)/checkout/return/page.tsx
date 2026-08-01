import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutPaymentPoller } from "@/components/store/CheckoutPaymentPoller";
import { PaymentStatus } from "@/components/payments/PaymentStatus";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatCop } from "@/lib/money";
import { storeShellClass } from "@/lib/store-layout";

export const dynamic = "force-dynamic";

const orderLabels: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  failed: "Pago rechazado o fallido",
  cancelled: "Cancelado",
  awaiting_payment: "Esperando comprobante",
  payment_submitted: "Pendiente de aprobación de pago",
};

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderId =
    typeof sp.order_id === "string" ? sp.order_id : undefined;
  const reference =
    typeof sp.reference === "string" ? sp.reference : undefined;
  const testCheckoutRaw = sp.test_checkout;
  const testCheckout =
    testCheckoutRaw === "1" ||
    testCheckoutRaw === "true" ||
    (Array.isArray(testCheckoutRaw) &&
      (testCheckoutRaw[0] === "1" || testCheckoutRaw[0] === "true"));

  if (!orderId) {
    return (
      <div className={`${storeShellClass} max-w-lg space-y-4 py-10`}>
        <h1 className="text-2xl font-semibold text-stone-900">
          Resultado del pago
        </h1>
        <p className="text-stone-600">
          Falta el identificador del pedido en la URL.
        </p>
        <Link
          href="/products"
          className="font-medium text-[var(--store-accent)] underline"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const sessionSb = await createSupabaseServerClient();
  const {
    data: { user: returnUser },
  } = await sessionSb.auth.getUser();

  if (returnUser) {
    const { data: adminProf } = await sessionSb
      .from("profiles")
      .select("id")
      .eq("id", returnUser.id)
      .maybeSingle();

    if (!adminProf) {
      const { data: ownOrder } = await sessionSb
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .maybeSingle();

      if (ownOrder?.id) {
        redirect(`/cuenta/pedidos/${orderId}`);
      }
    }
  }

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,status,customer_name,customer_email,total_cents,currency")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return (
      <div className={`${storeShellClass} max-w-lg space-y-4 py-10`}>
        <h1 className="text-2xl font-semibold text-stone-900">
          Pedido no encontrado
        </h1>
        <Link
          href="/products"
          className="font-medium text-[var(--store-accent)] underline"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  // Ledger de pagos (fuente de verdad del cobro Wompi). No confiar en ?widget=
  let payment: {
    reference: string;
    status: string;
    status_message: string | null;
  } | null = null;

  if (reference) {
    const { data } = await supabase
      .from("payments")
      .select("reference,status,status_message")
      .eq("reference", reference)
      .eq("order_id", orderId)
      .maybeSingle();
    payment = data;
  } else {
    const { data } = await supabase
      .from("payments")
      .select("reference,status,status_message")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    payment = data;
  }

  const status = order.status as string;

  return (
    <div className={`${storeShellClass} max-w-lg space-y-6 py-10`}>
      <h1 className="text-2xl font-semibold text-stone-900">
        Resultado del pago
      </h1>
      {testCheckout ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <strong className="font-semibold">Modo prueba:</strong> no se llamó a
          Wompi (falta{" "}
          <code className="rounded bg-amber-100/80 px-1">
            WOMPI_PRIVATE_KEY
          </code>{" "}
          en local o tienes{" "}
          <code className="rounded bg-amber-100/80 px-1">
            CHECKOUT_SKIP_WOMPI
          </code>
          ). El pedido quedó registrado como pendiente.
        </div>
      ) : null}

      {payment ? (
        <CheckoutPaymentPoller
          reference={payment.reference}
          initialStatus={payment.status}
          initialMessage={payment.status_message}
        />
      ) : !testCheckout ? (
        <PaymentStatus status="PENDING" statusMessage="Esperando confirmación del pago…" />
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <p className="text-sm text-stone-500">Pedido</p>
        <p className="font-mono text-sm text-stone-800">{order.id}</p>
        <p className="mt-4 text-sm text-stone-500">Estado del pedido</p>
        <p className="text-lg font-medium text-stone-900">
          {orderLabels[status] ?? status}
        </p>
        <p className="mt-4 text-sm text-stone-500">Total</p>
        <p className="text-lg font-semibold text-[var(--store-accent)]">
          {formatCop(order.total_cents)}
        </p>
        <p className="mt-4 text-sm text-stone-600">
          {order.customer_name} · {order.customer_email}
        </p>
        <p className="mt-4 text-xs text-stone-500">
          El cobro lo confirma Wompi por webhook. El parámetro de la URL no
          marca el pedido como pagado.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cuenta/pedidos"
          className="inline-flex rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--store-accent)] shadow-sm hover:bg-stone-50"
        >
          Mis pedidos
        </Link>
        <Link
          href="/products"
          className="inline-flex rounded-full bg-[var(--store-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--store-accent-hover)]"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
