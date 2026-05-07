import Link from "next/link";

type VentasPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
};

export function VentasPagination({
  page,
  pageSize,
  total,
  buildHref,
}: VentasPaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const linkClass =
    "inline-flex min-h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40";
  const navLinkClass = `${linkClass} px-4`;

  return (
    <div className="flex flex-col gap-3 rounded-b-xl border-t border-zinc-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
      <p className="text-sm text-zinc-500">
        Mostrando{" "}
        <span className="font-medium text-zinc-800">
          {from}–{to}
        </span>{" "}
        de <span className="font-medium text-zinc-800">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-zinc-400">
          Página {page} de {totalPages}
        </span>
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className={navLinkClass}>
            Anterior
          </Link>
        ) : (
          <span
            className={`${navLinkClass} cursor-not-allowed opacity-40`}
            aria-disabled
          >
            Anterior
          </span>
        )}
        {page < totalPages ? (
          <Link href={buildHref(page + 1)} className={navLinkClass}>
            Siguiente
          </Link>
        ) : (
          <span
            className={`${navLinkClass} cursor-not-allowed opacity-40`}
            aria-disabled
          >
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
