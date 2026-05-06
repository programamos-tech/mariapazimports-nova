import Link from "next/link";

export function ProductsListingPromo() {
  return (
    <section className="overflow-hidden rounded-2xl bg-[#faf0e8] ring-1 ring-stone-200/60">
      <div className="grid items-center gap-6 p-6 sm:p-8 md:grid-cols-2 md:gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold leading-tight text-[#3d5240] sm:text-3xl md:text-4xl">
            Hasta 50% off
            <span className="block text-[#556654]">en seleccionados</span>
          </h2>
          <p className="max-w-md text-sm text-stone-600 sm:text-base">
            Aprovechá precios especiales en el catálogo. Stock limitado según
            disponibilidad.
          </p>
          <Link
            href="/products"
            className="inline-flex rounded-full bg-[#3d5240] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#556654]"
          >
            Comprar ahora
          </Link>
        </div>
        <div className="relative flex min-h-[180px] items-center justify-center sm:min-h-[220px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e8f0e6] to-[#f5e8dc] opacity-90" />
          <div className="relative text-center">
            <span className="text-7xl sm:text-8xl" aria-hidden>
              🎧
            </span>
            <p className="mt-2 text-xs font-medium text-stone-500">
              Audio y más
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
