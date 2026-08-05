import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass } from "@/lib/store-layout";
import { StoreCategoryCard } from "@/components/store/StoreCategoryCard";

/** Vitrina de categorías: grilla densa, productos nítidos. */
export function StoreNetflixCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  const visible = categories
    .filter((c) => c.productCount > 0)
    .slice(0, 12);

  if (visible.length === 0) return null;

  return (
    <section
      className="bg-white py-7 sm:py-9"
      aria-labelledby="home-categories-heading"
    >
      <div className={storeShellClass}>
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="home-categories-heading"
            className="text-lg font-semibold uppercase tracking-[0.08em] text-stone-900 sm:text-xl"
          >
            Categorías
          </h2>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((c, i) => (
            <StoreCategoryCard key={c.id} category={c} priority={i < 6} />
          ))}
        </ul>
      </div>
    </section>
  );
}
