import Link from "next/link";
import {
  formatVentaFecha,
  isVentaFisica,
  ventaEstadoBadge,
  ventaFormaPagoBadge,
  ventaNumeroReferencia,
} from "@/lib/ventas-sales";
import { formatCop } from "@/lib/money";

export type VentaOrderRow = {
  id: string;
  status: string;
  customer_name: string;
  total_cents: number;
  created_at: string | null;
  wompi_reference: string | null;
  customer_email: string | null;
};

function IconStorefront({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      aria-hidden
    >
      <path d="M3 10h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" strokeLinejoin="round" />
      <path d="M3 10V8l3-5h12l3 5v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

function IconPackage({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 12v9" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const thClass =
  "px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:px-4 md:px-5";

export function VentasSalesTable({ rows }: { rows: VentaOrderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
        No hay ventas que coincidan con los filtros.
      </div>
    );
  }

  const cardClass =
    "flex h-full flex-col rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 transition hover:border-zinc-300 hover:shadow-md";

  return (
    <>
      {/* Con sidebar fijo, por debajo de xl el área útil suele ser estrecha y la tabla genera scroll horizontal: cuadrícula 1/2 cols. Tabla solo desde xl (1280px). */}
      <ul
        role="list"
        className="grid grid-cols-1 gap-4 px-4 pb-4 pt-2 sm:grid-cols-2 sm:gap-4 sm:px-5 xl:hidden"
      >
        {rows.map((row) => {
          const fisica = isVentaFisica(row.wompi_reference);
          const ref = ventaNumeroReferencia(row.id);
          const estado = ventaEstadoBadge(row.status);
          const pago = ventaFormaPagoBadge(row.wompi_reference);
          return (
            <li key={row.id} className="min-w-0">
              <article className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {fisica ? (
                      <IconStorefront className="size-5 shrink-0 text-zinc-500" />
                    ) : (
                      <IconPackage className="size-5 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900">
                        {ref}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
                        {row.customer_name}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/orders/${row.id}`}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-800"
                    aria-label={`Ver detalle del pedido ${ref}`}
                  >
                    <IconEye />
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] text-zinc-600 sm:text-xs">
                  <span className="whitespace-nowrap">
                    {formatVentaFecha(row.created_at)}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pago.className}`}
                  >
                    {pago.label}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                  >
                    {estado.label}
                  </span>
                </div>
                <p className="mt-auto pt-4 text-lg font-bold tabular-nums text-zinc-900">
                  {formatCop(Number(row.total_cents ?? 0))}
                </p>
              </article>
            </li>
          );
        })}
      </ul>

      {/* xl+: ancho suficiente para tabla sin scroll molesto junto al sidebar */}
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[700px] text-sm xl:min-w-0">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className={thClass}>Factura / pedido</th>
              <th className={`${thClass} w-[9rem]`}>Fecha</th>
              <th className={thClass}>Cliente</th>
              <th className={`${thClass} w-[7rem]`}>Pago</th>
              <th className={`${thClass} w-[7rem]`}>Estado</th>
              <th className={`${thClass} w-[7.5rem] text-right`}>Total</th>
              <th className={`${thClass} w-[4rem] text-center`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const fisica = isVentaFisica(row.wompi_reference);
              const ref = ventaNumeroReferencia(row.id);
              const estado = ventaEstadoBadge(row.status);
              const pago = ventaFormaPagoBadge(row.wompi_reference);
              return (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 bg-white transition hover:bg-zinc-50/80"
                >
                  <td className="px-3 py-3.5 sm:px-4 md:px-5">
                    <div className="flex items-center gap-2.5">
                      {fisica ? (
                        <IconStorefront className="size-5 shrink-0 text-zinc-500" />
                      ) : (
                        <IconPackage className="size-5 shrink-0 text-amber-600" />
                      )}
                      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
                        {ref}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-zinc-600 sm:px-4 md:px-5">
                    {formatVentaFecha(row.created_at)}
                  </td>
                  <td className="min-w-0 max-w-[10rem] truncate px-3 py-3.5 font-semibold text-zinc-900 sm:max-w-[12rem] sm:px-4 md:max-w-[16rem] md:px-5 xl:max-w-none">
                    {row.customer_name}
                  </td>
                  <td className="px-3 py-3.5 sm:px-4 md:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pago.className}`}
                    >
                      {pago.label}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 sm:px-4 md:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                    >
                      {estado.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm font-bold tabular-nums text-zinc-900 sm:px-4 md:px-5">
                    {formatCop(Number(row.total_cents ?? 0))}
                  </td>
                  <td className="px-3 py-3.5 text-center sm:px-4 md:px-5">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
                      aria-label={`Ver detalle del pedido ${ref}`}
                    >
                      <IconEye />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
