import { storeShellClass } from "@/lib/store-layout";

export default function ProductDetailLoading() {
  return (
    <div
      className={`${storeShellClass} pb-10 pt-4 sm:pb-12 sm:pt-5 lg:pb-14 lg:pt-6`}
      aria-busy="true"
      aria-label="Cargando producto"
    >
      <div className="mb-5 h-3 w-48 animate-pulse rounded bg-stone-100" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-[4/5] w-full animate-pulse bg-stone-100" />
        <div className="space-y-4 animate-pulse">
          <div className="h-3 w-24 rounded bg-stone-100" />
          <div className="h-7 w-3/4 rounded bg-stone-100" />
          <div className="h-5 w-28 rounded bg-stone-100" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full rounded bg-stone-100" />
            <div className="h-3 w-5/6 rounded bg-stone-100" />
            <div className="h-3 w-2/3 rounded bg-stone-100" />
          </div>
          <div className="mt-8 h-12 w-full rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
