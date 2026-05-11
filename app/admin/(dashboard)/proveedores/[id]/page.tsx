import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAvatar } from "@/components/admin/CustomerAvatar";
import { customerAvatarSeed } from "@/lib/customer-avatar-seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";
import { supplierInvoiceUiStatus } from "@/lib/supplier-invoices";
import { SupplierInvoiceStatusPill } from "@/components/admin/SupplierInvoiceStatusPill";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

function paidMap(
  rows: { invoice_id: string; amount_cents: number }[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const id = r.invoice_id;
    m.set(id, (m.get(id) ?? 0) + Number(r.amount_cents ?? 0));
  }
  return m;
}

export default async function AdminProveedorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const statusF = typeof sp.status === "string" ? sp.status : "all";

  const supabase = await createSupabaseServerClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle();
  if (!supplier) notFound();

  const { data: invoicesRaw } = await supabase
    .from("supplier_invoices")
    .select("id,folio,total_cents,issue_date,is_cancelled,created_at")
    .eq("supplier_id", id)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  const invoices = invoicesRaw ?? [];
  const invIds = invoices.map((i) => i.id);
  let payments: { invoice_id: string; amount_cents: number }[] = [];
  if (invIds.length > 0) {
    const { data: p } = await supabase
      .from("supplier_invoice_payments")
      .select("invoice_id,amount_cents")
      .in("invoice_id", invIds);
    payments = p ?? [];
  }
  const paidByInv = paidMap(payments);

  let pendingTotal = 0;
  const rows = invoices.map((inv) => {
    const total = Number(inv.total_cents ?? 0);
    const paid = paidByInv.get(inv.id) ?? 0;
    const pending = inv.is_cancelled ? 0 : Math.max(0, total - paid);
    if (!inv.is_cancelled) pendingTotal += pending;
    const st = supplierInvoiceUiStatus(total, paid, Boolean(inv.is_cancelled));
    return { ...inv, paid, pending, st };
  });

  const filtered = rows.filter((r) => {
    if (q && !r.folio.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q.replace(/-/g, ""))) {
      return false;
    }
    if (statusF !== "all" && r.st !== statusF) return false;
    return true;
  });

  const nFacturas = invoices.length;
  const subtitle = `${nFacturas} ${nFacturas === 1 ? "factura" : "facturas"} · Por pagar ${formatCop(pendingTotal)}`;

  const s = supplier as {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    document_id?: string | null;
    notes?: string | null;
  };
  const metaParts = [
    s.document_id?.trim() ? `NIT ${s.document_id.trim()}` : null,
    s.phone?.trim() ? s.phone.trim() : null,
    s.email?.trim() ? s.email.trim() : null,
  ].filter(Boolean);
  const metaLine =
    metaParts.length > 0 ? metaParts.join(" · ") : "Sin datos de contacto cargados.";
  const notesTrim = s.notes?.trim() ?? "";
  const avatarSeed = customerAvatarSeed(s.id, s.email);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-zinc-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-5 sm:gap-6">
          <CustomerAvatar
            seed={avatarSeed}
            size={120}
            className="shadow-md ring-2 ring-zinc-200/90"
            label={`Avatar de ${String(s.name)}`}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              {s.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{metaLine}</p>
            {notesTrim ? (
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-500">{notesTrim}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/proveedores/${id}/nueva-factura`}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            + Nueva factura
          </Link>
          <Link
            href="/admin/proveedores"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <form
        method="get"
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
            placeholder="Buscar por factura…"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
        <select
          name="status"
          defaultValue={statusF}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 sm:w-48"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagada</option>
          <option value="cancelled">Anulada</option>
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
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Factura
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Emisión · hora
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
                    No hay facturas con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const createdAt =
                    typeof r.created_at === "string" ? new Date(r.created_at) : null;
                  const issue =
                    typeof r.issue_date === "string"
                      ? new Date(`${r.issue_date}T12:00:00Z`).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—";
                  const timeStr = createdAt
                    ? createdAt.toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-800">{r.folio}</td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {issue}
                        <span className="text-zinc-400"> · </span>
                        {timeStr}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-zinc-900">
                        {formatCop(Number(r.total_cents ?? 0))}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-emerald-700">{formatCop(r.paid)}</td>
                      <td className="px-4 py-3 tabular-nums text-amber-800">{formatCop(r.pending)}</td>
                      <td className="px-4 py-3">
                        <SupplierInvoiceStatusPill
                          totalCents={Number(r.total_cents ?? 0)}
                          paidCents={r.paid}
                          isCancelled={Boolean(r.is_cancelled)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/proveedores/${id}/facturas/${r.id}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          aria-label="Ver factura"
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
