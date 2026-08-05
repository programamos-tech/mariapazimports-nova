import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass } from "@/lib/store-layout";
import { StoreCategoryCard } from "@/components/store/StoreCategoryCard";

/** Vitrina 3×2: mismas 6 categorías, ancho contenido para que no se vean enormes. */
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

        <ul className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-x-4 gap-y-7 sm:mt-7 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">
          {visible.map((c, i) => (
            <StoreCategoryCard key={c.id} category={c} priority={i < 3} />
          ))}
        </ul>
      </div>
    </section>
  );
}
