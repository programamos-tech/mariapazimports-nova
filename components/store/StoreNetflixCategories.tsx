import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass } from "@/lib/store-layout";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

function CategoryPoster({
  category,
  priority,
}: {
  category: HomeCategoryCard;
  priority?: boolean;
}) {
  const href = `/products?category=${encodeURIComponent(category.id)}`;

  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-xl bg-stone-200 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.35)] ring-1 ring-black/5 outline-none transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_rgba(0,0,0,0.4)] focus-visible:ring-2 focus-visible:ring-stone-400/50"
      >
        <div className="relative aspect-[2/3] w-full">
          {category.imageSrc ? (
            <Image
              src={category.imageSrc}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
              className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
              unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
            />
          ) : (
            <div className={`absolute inset-0 ${category.tint}`} />
          )}
          <div className="absolute inset-0 bg-black/35" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h3 className="text-center text-sm font-semibold uppercase tracking-[0.12em] text-white sm:text-[15px] md:text-base">
              {category.name}
            </h3>
          </div>
        </div>
      </Link>
    </li>
  );
}

/** Vitrina de categorías tipo Netflix: 4 arriba + 4 abajo (o el resto). */
export function StoreNetflixCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  if (categories.length === 0) return null;

  const top = categories.slice(0, 4);
  const bottom = categories.slice(4, 8);

  return (
    <section
      className="bg-white py-8 sm:py-10"
      aria-labelledby="home-categories-heading"
    >
      <div className={storeShellClass}>
        <div className="mb-5 text-center sm:mb-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
            Explorá el catálogo
          </p>
          <h2
            id="home-categories-heading"
            className="mt-1 text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-2xl"
          >
            Categorías
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-xs leading-snug text-stone-500 sm:text-[13px]">
            Elegí una categoría y mirá los productos disponibles.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {top.map((c, i) => (
            <CategoryPoster key={c.id} category={c} priority={i < 2} />
          ))}
        </ul>

        {bottom.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-4 sm:gap-4">
            {bottom.map((c) => (
              <CategoryPoster key={c.id} category={c} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
