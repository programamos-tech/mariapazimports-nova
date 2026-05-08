import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerDetailHeaderActions } from "@/components/admin/CustomerDetailHeaderActions";
import { CustomerAvatar } from "@/components/admin/CustomerAvatar";
import { customerAvatarSeed } from "@/lib/customer-avatar-seed";
import { fetchAdminCustomerDetail } from "@/lib/supabase/admin-customer-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";

export const dynamic = "force-dynamic";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-zinc-400";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function StatCol({
  label,
  children,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-5 sm:px-5">
      <p className={labelClass}>{label}</p>
      <div className="mt-1 text-2xl font-semibold tabular-nums leading-tight text-zinc-900">
        {children}
      </div>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  );
}

export default async function AdminCustomerDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { detail, error } = await fetchAdminCustomerDetail(supabase, id);

  if (error && error.message?.toLowerCase().includes("customers")) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        No se pudo cargar el cliente. Revisa migraciones y permisos.
      </div>
    );
  }

  if (!detail) notFound();

  const { customer, addresses, ordersPaid, topProducts, matchedOrdersByEmailFallback } =
    detail;

  const avatarSeed = customerAvatarSeed(customer.id, customer.email);
  const ventas = ordersPaid.length;
  const totalCents = ordersPaid.reduce((s, o) => s + Number(o.total_cents ?? 0), 0);
  const ticketCents = ventas > 0 ? Math.round(totalCents / ventas) : null;

  const metaParts = [
    customer.document_id?.trim() ? `CC ${customer.document_id.trim()}` : null,
    customer.phone?.trim() && customer.phone !== "—" ? customer.phone.trim() : null,
    customer.email?.trim() ? customer.email.trim() : null,
  ].filter(Boolean);
  const metaLine = metaParts.length > 0 ? metaParts.join(" · ") : "Sin datos de contacto";

  const addressBlocks =
    addresses.length > 0
      ? addresses
      : customer.shipping_address?.trim()
        ? [
            {
              id: "primary-shipping",
              label: "Principal",
              address_line: customer.shipping_address.trim(),
              reference: "",
              sort_order: 0,
            },
          ]
        : [];

  const cityPostal = [customer.shipping_city, customer.shipping_postal_code]
    .filter((x) => String(x ?? "").trim())
    .join(customer.shipping_city && customer.shipping_postal_code ? " · " : "");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {sp.error === "delete" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          No se pudo eliminar el cliente. Intenta de nuevo.
        </div>
      ) : null}

      {/* Breadcrumb fuera del card (mockup) */}
      <p className="text-sm text-zinc-500">
        <Link href="/admin/customers" className="font-medium hover:text-zinc-800">
          Clientes
        </Link>
        <span className="mx-2 text-zinc-300">/</span>
        <span className="text-zinc-700">{customer.name}</span>
      </p>

      {/* Card de título: identidad + acciones; debajo métricas con columnas y divisores */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div className="flex min-w-0 items-center gap-5 sm:gap-6">
            <CustomerAvatar
              seed={avatarSeed}
              size={120}
              className="shadow-md ring-2 ring-zinc-200/90"
              label={`Avatar de ${customer.name}`}
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                {customer.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">{metaLine}</p>
              {matchedOrdersByEmailFallback ? (
                <p className="mt-2 text-xs text-amber-700">
                  Algunos pedidos se enlazan por email (sin{" "}
                  <code className="rounded bg-amber-100 px-1 text-[11px]">customer_id</code>).
                </p>
              ) : null}
            </div>
          </div>
          <CustomerDetailHeaderActions customerId={id} customerName={customer.name} />
        </div>

        <div className="border-t border-zinc-100">
          <div className="grid divide-y divide-zinc-100 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            <StatCol
              label="Ticket promedio"
              sub={`${ventas} ${ventas === 1 ? "venta" : "ventas"}`}
            >
              {ticketCents !== null ? formatCop(ticketCents) : "—"}
            </StatCol>
            <StatCol label="Total comprado">
              {ventas > 0 ? formatCop(totalCents) : "—"}
            </StatCol>
            <StatCol label="Garantías" sub="Devoluciones procesadas">
              <span className="text-violet-600">0</span>
            </StatCol>
            <StatCol label="Créditos pendientes" sub="Sin créditos">
              —
            </StatCol>
            <div className="px-4 py-5 sm:px-5">
              <p className={labelClass}>Direcciones</p>
              {addressBlocks.length > 0 ? (
                <div className="mt-2 space-y-3 text-sm leading-snug text-zinc-800">
                  {addressBlocks.map((a) => (
                    <div key={a.id}>
                      <span
                        className={
                          a.label.trim().toLowerCase() === "principal"
                            ? "inline-block rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                            : "inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600"
                        }
                      >
                        {a.label}
                      </span>
                      <p className="mt-1.5">{a.address_line}</p>
                      {a.reference?.trim() ? (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Ref: {a.reference.trim()}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  {cityPostal ? (
                    <p className="text-xs text-zinc-500">{cityPostal}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-2xl font-semibold text-zinc-300">—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Facturas
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Ventas con numeración de factura en esta sucursal (POS / facturación electrónica).
          </p>
          <div className="mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-zinc-300"
              aria-hidden
            >
              <path d="M3 3v18h18" />
              <path d="M7 16v3M11 13v6M15 10v9M19 7v12" />
            </svg>
            <p className="mt-3 text-sm font-medium text-zinc-600">
              Aún no hay ventas registradas.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Top productos comprados
          </h2>
          {topProducts.length === 0 ? (
            <>
              <p className="mt-1 text-sm text-zinc-500">
                Ranking por cantidad cuando haya pedidos pagados con ítems.
              </p>
              <div className="mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center">
                <p className="text-sm font-medium text-zinc-600">Sin datos aún</p>
                <p className="mt-2 max-w-xs text-xs text-zinc-500">
                  Cuando las ventas incluyan ítems por producto, aquí verás el top de este cliente.
                </p>
              </div>
            </>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {topProducts.map((row, i) => (
                <li
                  key={`${row.name}-${i}`}
                  className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0"
                >
                  <span className="min-w-0 truncate font-medium text-zinc-800">{row.name}</span>
                  <span className="shrink-0 tabular-nums text-zinc-500">{row.quantity} u.</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Créditos
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Ventas a crédito y abonos. Solo los de esta sucursal.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-400 opacity-70"
            title="Próximamente"
          >
            Ver cartera de créditos
          </button>
        </div>
        <div className="mt-8 flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-12 text-center">
          <p className="text-sm font-medium text-zinc-600">Sin créditos registrados.</p>
          <button
            type="button"
            disabled
            className="mt-6 inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white opacity-50"
          >
            Nuevo crédito
          </button>
        </div>
      </section>
    </div>
  );
}
