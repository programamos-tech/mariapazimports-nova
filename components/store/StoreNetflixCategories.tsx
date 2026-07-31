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
        className="group relative block overflow-hidden rounded-2xl bg-stone-100 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/8 outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-16px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-stone-400/50"
      >
        <div className="relative aspect-[2/3] w-full">
          {category.imageSrc ? (
            <Image
              src={category.imageSrc}
              alt=""
              fill
              priority={priority}
              quality={92}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.06] group-hover:brightness-[1.03]"
              unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
            />
          ) : (
            <div className={`absolute inset-0 ${category.tint}`} />
          )}

          {/* Velo mínimo solo para legibilidad del texto; la foto queda nítida */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.22)_0%,rgba(0,0,0,0.08)_55%,transparent_100%)]"
            aria-hidden
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h3 className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-[15px] md:text-base">
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

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:gap-5">
          {top.map((c, i) => (
            <CategoryPoster key={c.id} category={c} priority={i < 2} />
          ))}
        </ul>

        {bottom.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-4 sm:gap-4 lg:gap-5">
            {bottom.map((c) => (
              <CategoryPoster key={c.id} category={c} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
