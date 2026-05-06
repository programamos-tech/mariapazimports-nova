import Link from "next/link";
import { Suspense } from "react";
import {
  VentasFiltersBar,
  VentasRefreshButton,
} from "@/components/admin/VentasFiltersBar";
import { VentasSalesTable, type VentaOrderRow } from "@/components/admin/VentasSalesTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  matchesVentaPagoFilter,
  ventaNumeroReferencia,
  type VentaEstadoFilter,
  type VentaPagoFilter,
} from "@/lib/ventas-sales";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function FiltersFallback() {
  return (
    <div className="h-24 animate-pulse border-b border-zinc-100 bg-zinc-50/50 px-5 md:px-6" />
  );
}

export default async function AdminVentasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const qRaw = typeof sp.q === "string" ? sp.q : "";
  const q = qRaw.trim().toLowerCase();
  const status = (typeof sp.status === "string" ? sp.status : "all") as VentaEstadoFilter;
  const payment = (typeof sp.payment === "string" ? sp.payment : "all") as VentaPagoFilter;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,status,customer_name,total_cents,created_at,wompi_reference,customer_email",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        No se pudieron cargar las ventas. Revisá permisos y conexión.
      </div>
    );
  }

  let rows: VentaOrderRow[] = (data ?? []) as VentaOrderRow[];

  if (status !== "all") {
    rows = rows.filter((r) => r.status === status);
  }
  if (payment !== "all") {
    rows = rows.filter((r) => matchesVentaPagoFilter(r.wompi_reference, payment));
  }
  if (q.length > 0) {
    const qCompact = q.replace(/-/g, "");
    rows = rows.filter((r) => {
      const name = (r.customer_name ?? "").toLowerCase();
      const email = (r.customer_email ?? "").toLowerCase();
      const id = (r.id ?? "").toLowerCase().replace(/-/g, "");
      const ref = ventaNumeroReferencia(r.id).toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        id.includes(qCompact) ||
        ref.includes(q)
      );
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Ventas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Gestioná facturas de mostrador y pedidos con envío desde un solo lugar.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <VentasRefreshButton />
          <Link
            href="/admin/ventas/nueva"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            + Nueva factura
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <Suspense fallback={<FiltersFallback />}>
          <VentasFiltersBar initialQ={qRaw} />
        </Suspense>
        <VentasSalesTable rows={rows} />
      </div>
    </div>
  );
}
