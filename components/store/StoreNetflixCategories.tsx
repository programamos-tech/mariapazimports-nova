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
        className="group relative block overflow-hidden rounded-2xl bg-[#141210] shadow-[0_18px_48px_-18px_rgba(0,0,0,0.55)] ring-1 ring-white/10 outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_-16px_rgba(0,0,0,0.65)] focus-visible:ring-2 focus-visible:ring-stone-400/50"
      >
        <div className="relative aspect-[2/3] w-full">
          {category.imageSrc ? (
            <Image
              src={category.imageSrc}
              alt=""
              fill
              priority={priority}
              quality={95}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 22vw"
              className="object-contain object-center p-5 contrast-[1.08] saturate-[1.15] transition duration-700 ease-out group-hover:scale-[1.05] group-hover:saturate-[1.22] sm:p-6"
              unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-950" />
          )}

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
            <h3 className="max-w-[92%] rounded-md bg-black/75 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-[2px] sm:px-3.5 sm:py-3 sm:text-xs md:text-[13px]">
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
