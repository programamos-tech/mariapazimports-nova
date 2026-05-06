import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const status = String(order.status);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-[#556654] hover:underline"
      >
        ← Pedidos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Pedido
        </h1>
        <p className="font-mono text-sm text-stone-500">{order.id}</p>
      </div>
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 ring-1 ring-stone-100">
        <p className="text-sm text-stone-500">Estado</p>
        <p className="text-lg font-medium text-stone-900">
          {statusLabel[status] ?? status}
        </p>
        <p className="mt-3 text-sm text-stone-500">Cliente</p>
        <p className="text-stone-900">
          {order.customer_name as string} · {order.customer_email as string}
        </p>
        {(order.shipping_phone ||
          order.shipping_address ||
          order.shipping_city ||
          order.shipping_postal_code) ? (
          <div className="mt-3 rounded-xl border border-stone-100 bg-[#fffbf6] p-3 text-sm ring-1 ring-stone-100/80">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Envío
            </p>
            {order.shipping_address ? (
              <p className="mt-1 text-stone-800">
                {String(order.shipping_address)}
              </p>
            ) : null}
            <p className="mt-1 text-stone-600">
              {[order.shipping_city, order.shipping_postal_code]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {order.shipping_phone ? (
              <p className="mt-1 text-stone-600">
                Tel. {String(order.shipping_phone)}
              </p>
            ) : null}
          </div>
        ) : null}
        <p className="mt-3 text-sm text-stone-500">Total</p>
        <p className="text-lg font-semibold text-stone-900">
          {formatCop(order.total_cents as number)}
        </p>
        {order.wompi_transaction_id ? (
          <p className="mt-3 text-xs text-stone-500">
            Wompi txn: {String(order.wompi_transaction_id)}
          </p>
        ) : null}
        {order.wompi_payment_link_id ? (
          <p className="mt-1 text-xs text-stone-500">
            Link: {String(order.wompi_payment_link_id)}
          </p>
        ) : null}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Ítems</h2>
        <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200/80 bg-white ring-1 ring-stone-100">
          {(items ?? []).map((it) => (
            <li
              key={it.id as string}
              className="flex justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="text-stone-800">
                {it.product_name_snapshot as string} × {it.quantity as number}
              </span>
              <span className="shrink-0 text-stone-600">
                {formatCop(
                  (it.unit_price_cents as number) * (it.quantity as number),
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
