import Link from "next/link";
import type { StoreCouponRow } from "@/lib/store-coupons";
import { formatStoreCouponVigenciaLabel } from "@/lib/store-coupons";

function yesNoBadge(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-900 ring-emerald-200/90"
    : "bg-zinc-100 text-zinc-600 ring-zinc-200/80";
}

export function StoreCouponsTable({
  rows,
  restrictedProductCountById,
}: {
  rows: StoreCouponRow[];
  restrictedProductCountById: Map<string, number>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgb(24_24_27/0.04)]">
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Cupones registrados
        </h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-zinc-500 sm:px-5">
          Todavía no hay cupones.{" "}
          <Link
            href="/admin/coupons/nuevo"
            className="font-semibold text-zinc-900 underline decoration-zinc-300"
          >
            Crear el primero
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              <tr>
                <th className="px-4 py-3 sm:px-5">Etiqueta</th>
                <th className="px-4 py-3 sm:px-5">Banner</th>
                <th className="px-4 py-3 sm:px-5">Código</th>
                <th className="px-4 py-3 text-right sm:px-5">%</th>
                <th className="px-4 py-3 sm:px-5">Ámbito</th>
                <th className="px-4 py-3 text-right sm:px-5">Orden</th>
                <th className="px-4 py-3 sm:px-5">Franja</th>
                <th className="px-4 py-3 sm:px-5">Activo</th>
                <th className="min-w-[200px] px-4 py-3 sm:px-5">Vigencia</th>
                <th className="px-4 py-3 text-right sm:px-5"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => {
                const n = restrictedProductCountById.get(row.id) ?? 0;
                return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3 sm:px-5">
                    <p className="font-medium text-zinc-900">
                      {row.internal_label?.trim() || "—"}
                    </p>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-zinc-600 sm:px-5">
                    <p className="line-clamp-2">{row.banner_message}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-800 sm:px-5">
                    {row.code}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-800 sm:px-5">
                    {row.discount_percent}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 sm:px-5">
                    {n === 0 ? (
                      <span className="text-zinc-500">Todo el carrito</span>
                    ) : (
                      <span>
                        {n} producto{n === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600 sm:px-5">
                    {row.sort_order}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${yesNoBadge(row.show_in_banner)}`}
                    >
                      {row.show_in_banner ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${yesNoBadge(row.is_enabled)}`}
                    >
                      {row.is_enabled ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 sm:px-5">
                    {formatStoreCouponVigenciaLabel(row.starts_at, row.ends_at)}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <Link
                      href={`/admin/coupons/${row.id}/edit`}
                      className="text-sm font-semibold text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-500"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
