import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass } from "@/lib/store-layout";
import { StoreCategoryCard } from "@/components/store/StoreCategoryCard";

/** Vitrina de categorías: solo con stock, grilla 3×2. */
export function StoreNetflixCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  const visible = categories
    .filter((c) => c.productCount > 0)
    .slice(0, 6);

  if (visible.length === 0) return null;

  return (
    <section
      className="bg-white py-8 sm:py-10"
      aria-labelledby="home-categories-heading"
    >
      <div className={storeShellClass}>
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="home-categories-heading"
            className="text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-2xl"
          >
            Categorías
          </h2>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:gap-x-10">
          {visible.map((c, i) => (
            <StoreCategoryCard key={c.id} category={c} priority={i < 3} />
          ))}
        </ul>
      </div>
    </section>
  );
}
