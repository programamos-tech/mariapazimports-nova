import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass } from "@/lib/store-layout";
import { StoreCategoryCard } from "@/components/store/StoreCategoryCard";

/** Vitrina 3×2: Todos los productos + categorías raíz, con imagen. */
export function StoreNetflixCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  const visible = categories.slice(0, 6);

  if (visible.length === 0) return null;

  return (
    <section
      className="bg-white py-7 sm:py-9"
      aria-labelledby="home-categories-heading"
    >
      <div className={storeShellClass}>
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400 sm:text-[11px]">
            Explorá por categoría
          </p>
          <h2
            id="home-categories-heading"
            className="mt-1.5 text-lg font-semibold uppercase tracking-[0.08em] text-stone-900 sm:text-xl"
          >
            Categorías
          </h2>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:mt-7 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8">
          {visible.map((c, i) => (
            <StoreCategoryCard key={c.id} category={c} priority={i < 3} />
          ))}
        </ul>
      </div>
    </section>
  );
}
