import Link from "next/link";
import { CustomerAvatar } from "@/components/admin/CustomerAvatar";
import { customerAvatarSeed } from "@/lib/customer-avatar-seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";
import { buildSupplierHubRows } from "@/lib/supplier-hub-aggregate";
import { supplierInvoiceStatusBadge } from "@/lib/supplier-invoices";
import { SupplierInvoiceStatusPill } from "@/components/admin/SupplierInvoiceStatusPill";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  status?: string;
};

export default async function AdminProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const statusFilter = typeof sp.status === "string" ? sp.status : "all";

  const supabase = await createSupabaseServerClient();
  let qSup = supabase.from("suppliers").select("id,name,email").order("name", { ascending: true });
  if (q.length > 0) {
    qSup = qSup.ilike("name", `%${q}%`);
  }
  const { data: suppliersRaw } = await qSup;
  const suppliers = suppliersRaw ?? [];

  const supplierIds = suppliers.map((s) => s.id);
  let invoices: {
    id: string;
    supplier_id: string;
    total_cents: number;
    is_cancelled: boolean;
  }[] = [];

  if (supplierIds.length > 0) {
    const { data: inv } = await supabase
      .from("supplier_invoices")
      .select("id,supplier_id,total_cents,is_cancelled")
      .in("supplier_id", supplierIds);
    invoices = (inv ?? []) as typeof invoices;
  }

  const invoiceIds = invoices.map((i) => i.id);
  let payments: { invoice_id: string; amount_cents: number }[] = [];
  if (invoiceIds.length > 0) {
    const { data: pay } = await supabase
      .from("supplier_invoice_payments")
      .select("invoice_id,amount_cents")
      .in("invoice_id", invoiceIds);
    payments = (pay ?? []) as typeof payments;
  }

  const hubRows = buildSupplierHubRows(suppliers, invoices, payments);
  const filtered =
    statusFilter === "all"
      ? hubRows
      : hubRows.filter((r) => r.rollUpStatus === statusFilter);

  const totalPorPagar = hubRows.reduce((s, r) => s + r.pendingCents, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Facturas de proveedores
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
              Tienda principal
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Cuentas por pagar por proveedor: entra a un proveedor para ver sus facturas y el detalle de
            cada una.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Total por pagar
            </p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900">{formatCop(totalPorPagar)}</p>
          </div>
          <Link
            href="/admin/proveedores"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50"
            aria-label="Actualizar"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v7h-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/admin/proveedores/nueva-factura"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            + Nueva factura
          </Link>
          <Link
            href="/admin/proveedores/nuevo"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Nuevo proveedor
          </Link>
        </div>
      </div>

      <form
        method="get"
        action="/admin/proveedores"
        className="flex flex-col gap-3 rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar proveedor…"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 sm:w-48"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagada</option>
          <option value="cancelled">Anulado</option>
          <option value="empty">Sin facturas</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Facturas
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Total
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Pagado
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Pendiente
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Estado
                </th>
                <th className="w-14 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">
                    No hay proveedores con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const st =
                    row.rollUpStatus === "empty"
                      ? { label: "Sin facturas", className: "bg-zinc-100 text-zinc-600 ring-zinc-200" }
                      : supplierInvoiceStatusBadge(row.rollUpStatus);
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar
                            seed={customerAvatarSeed(row.id, row.email)}
                            size={40}
                            className="ring-1 ring-zinc-200/80"
                            label={`Avatar de ${row.name}`}
                          />
                          <span className="font-medium text-zinc-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700">{row.invoiceCount}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-900">{formatCop(row.totalCents)}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-700">{formatCop(row.paidCents)}</td>
                      <td className="px-4 py-3 tabular-nums text-amber-800">{formatCop(row.pendingCents)}</td>
                      <td className="px-4 py-3">
                        {row.rollUpStatus === "empty" ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${st.className}`}
                          >
                            {st.label}
                          </span>
                        ) : (
                          <SupplierInvoiceStatusPill
                            totalCents={row.totalCents}
                            paidCents={row.paidCents}
                            isCancelled={row.rollUpStatus === "cancelled"}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/proveedores/${row.id}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          aria-label={`Ver ${row.name}`}
                        >
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
