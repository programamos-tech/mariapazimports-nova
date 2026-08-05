import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { StoreCategoryCard } from "@/components/store/StoreCategoryCard";

/** Fila de otras categorías al final de un listado por categoría. */
export function CatalogMoreCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  if (categories.length === 0) return null;

  return (
    <section
      className="border-t border-stone-200/80 pt-10 sm:pt-12"
      aria-labelledby="more-categories-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
          Seguí explorando
        </p>
        <h2
          id="more-categories-heading"
          className="mt-1 text-lg font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-xl"
        >
          Otras categorías
        </h2>
        <p className="mx-auto mt-1.5 max-w-lg text-xs leading-snug text-stone-500 sm:text-[13px]">
          Entrá a otra sección y descubrí más productos.
        </p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:mt-7 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8">
        {categories.slice(0, 6).map((c, i) => (
          <StoreCategoryCard key={c.id} category={c} priority={i === 0} />
        ))}
      </ul>
    </section>
  );
}
