import { storeProductGridClass, storeShellClass } from "@/lib/store-layout";

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full bg-stone-100" />
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-12 rounded bg-stone-100" />
        <div className="h-3 w-full rounded bg-stone-100" />
        <div className="h-3 w-2/3 rounded bg-stone-100" />
        <div className="h-3.5 w-16 rounded bg-stone-100" />
        <div className="mt-4 h-10 w-full border border-stone-200 bg-stone-50" />
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="bg-white" aria-busy="true" aria-label="Cargando catálogo">
      <div className="aspect-[21/9] min-h-[140px] w-full animate-pulse bg-stone-100 sm:min-h-[200px]" />

      <div className={`${storeShellClass} border-b border-stone-100 py-4`}>
        <div className="flex animate-pulse flex-wrap items-center gap-3">
          <div className="h-9 w-28 rounded-full bg-stone-100" />
          <div className="h-9 w-24 rounded-full bg-stone-100" />
          <div className="h-9 w-32 rounded-full bg-stone-100" />
        </div>
      </div>

      <div className={`${storeShellClass} space-y-12 py-10 sm:py-12`}>
        <div className="space-y-4">
          <div className="h-4 w-40 animate-pulse rounded bg-stone-100" />
          <ul className={storeProductGridClass}>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
