import Link from "next/link";

const FILTER_LABELS = [
  "Tipo de producto",
  "Precio",
  "Reseñas",
  "Color",
  "Material",
  "Oferta",
] as const;

function buildProductsHref(q: string, sort: string | undefined) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (sort && sort !== "newest") p.set("sort", sort);
  const qs = p.toString();
  return qs ? `/products?${qs}` : "/products";
}

type Props = {
  q: string;
  sort: string;
};

export function ProductsFilterSortBar({ q, sort }: Props) {
  /** Pastillas de filtro (solo UI por ahora): borde fino, fondo blanco. */
  const filterPill =
    "inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-500 shadow-sm sm:text-sm";

  /** Ordenación: aspecto distinto para no confundir con filtros. */
  const sortPillBase =
    "inline-flex shrink-0 items-center rounded-full px-3 py-2 text-xs font-medium sm:text-sm";

  const sortActive = (s: string) =>
    sort === s || (s === "newest" && (sort === "" || sort === "newest"));

  const sortLink = (s: string, label: string) => {
    const active = sortActive(s);
    return (
      <Link
        href={buildProductsHref(q, s)}
        className={`${sortPillBase} ${
          active
            ? "border border-[#6b7f6a] bg-[#eef3ec] text-[#3d5240]"
            : "border border-stone-200/80 bg-stone-100/90 text-stone-600 hover:bg-stone-200/60"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="border-b border-stone-200 pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        {/* Zona única: filtros (scroll horizontal en una fila) */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                disabled
                title="Filtros disponibles en una próxima versión"
                className={`${filterPill} cursor-not-allowed opacity-65`}
              >
                {label}
                <span className="text-stone-400" aria-hidden>
                  ▾
                </span>
              </button>
            ))}
            <button
              type="button"
              disabled
              title="Próximamente"
              className={`${filterPill} cursor-not-allowed opacity-65`}
            >
              <span aria-hidden>⚙</span>
              Todos los filtros
            </button>
          </div>
        </div>

        {/* Orden: bloque separado (no es un segundo bloque de “filtros”) */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-100 pt-4 sm:items-start lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            Ordenar por
          </span>
          <div className="flex flex-wrap gap-2">
            {sortLink("newest", "Más recientes")}
            {sortLink("price_asc", "Menor precio")}
            {sortLink("price_desc", "Mayor precio")}
            {sortLink("name", "Nombre A–Z")}
          </div>
        </div>
      </div>
    </div>
  );
}
