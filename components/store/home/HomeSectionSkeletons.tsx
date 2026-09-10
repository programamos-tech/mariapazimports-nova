import { storeShellClass } from "@/lib/store-layout";

export function HomeCategoriesSkeleton() {
  return (
    <section
      className="border-t border-stone-200/60 bg-white py-10 sm:py-12"
      aria-hidden
    >
      <div className={`${storeShellClass} space-y-6`}>
        <div className="mx-auto h-7 w-48 animate-pulse rounded bg-stone-200/80" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-xl bg-stone-200/70"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFeaturedSkeleton() {
  return (
    <section className="bg-white py-8 sm:py-10" aria-hidden>
      <div className={storeShellClass}>
        <div className="mx-auto h-7 w-56 animate-pulse rounded bg-stone-200/80" />
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="aspect-[3/4] animate-pulse rounded-lg bg-stone-200/70" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-stone-200/60" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-stone-200/50" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeBestsellersSkeleton() {
  return (
    <section
      className="border-t border-stone-200/70 bg-white py-10 sm:py-12"
      aria-hidden
    >
      <div className={storeShellClass}>
        <div className="h-7 w-64 animate-pulse rounded bg-stone-200/80" />
        <div className="mt-8 flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[11rem] shrink-0 animate-pulse rounded-lg bg-stone-200/70 sm:w-[12.5rem]"
              style={{ aspectRatio: "3/4" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
