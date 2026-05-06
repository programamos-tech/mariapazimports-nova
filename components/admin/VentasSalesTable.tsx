import Link from "next/link";
import {
  formatVentaFecha,
  isVentaFisica,
  ventaEstadoBadge,
  ventaFormaPagoLabel,
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
  "px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 md:px-5";

export function VentasSalesTable({ rows }: { rows: VentaOrderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-zinc-500 md:px-6">
        No hay ventas que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-white">
            <th className={thClass}>Factura / pedido</th>
            <th className={thClass}>Fecha</th>
            <th className={thClass}>Cliente</th>
            <th className={thClass}>Pago</th>
            <th className={thClass}>Estado</th>
            <th className={`${thClass} text-right`}>Total</th>
            <th className={`${thClass} text-center`}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const fisica = isVentaFisica(row.wompi_reference);
            const ref = ventaNumeroReferencia(row.id);
            const estado = ventaEstadoBadge(row.status);
            const pago = ventaFormaPagoLabel(row.wompi_reference);
            const zebra = i % 2 === 1 ? "bg-zinc-50/70" : "bg-white";
            return (
              <tr key={row.id} className={`border-b border-zinc-100/90 ${zebra}`}>
                <td className="px-4 py-4 md:px-5">
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
                <td className="whitespace-nowrap px-4 py-4 text-zinc-600 md:px-5">
                  {formatVentaFecha(row.created_at)}
                </td>
                <td className="px-4 py-4 font-semibold text-zinc-900 md:px-5">
                  {row.customer_name}
                </td>
                <td className="px-4 py-4 md:px-5">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200/60">
                    {pago}
                  </span>
                </td>
                <td className="px-4 py-4 md:px-5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                  >
                    {estado.label}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-bold tabular-nums text-zinc-900 md:px-5">
                  {formatCop(Number(row.total_cents ?? 0))}
                </td>
                <td className="px-4 py-4 text-center md:px-5">
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
  );
}
