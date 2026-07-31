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
  const countLabel =
    category.productCount === 1
      ? "1 producto"
      : `${category.productCount} productos`;

  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group relative block h-full overflow-hidden bg-stone-200 outline-none focus-visible:ring-2 focus-visible:ring-stone-900/40 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
          {category.imageSrc ? (
            <Image
              src={category.imageSrc}
              alt=""
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
            />
          ) : (
            <div className={`absolute inset-0 ${category.tint}`} />
          )}

          {/* Velos: legibilidad + profundidad editorial */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/15 to-transparent transition duration-500 group-hover:from-stone-950/85 group-hover:via-stone-950/30"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-stone-950/0 transition duration-500 group-hover:bg-stone-950/10"
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-2.5 pb-4 pt-14 text-center sm:px-5 sm:pb-6 sm:pt-16">
            <h3 className="max-w-full text-[10px] font-semibold uppercase tracking-[0.16em] text-white sm:text-xs sm:tracking-[0.22em] md:text-[13px]">
              {category.name}
            </h3>
            <span
              className="mt-2.5 h-px w-6 bg-white/55 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-white"
              aria-hidden
            />
            <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 transition duration-300 group-hover:text-white/90 sm:text-[11px]">
              {category.productCount > 0 ? countLabel : category.sub}
            </p>
            <span className="mt-3 translate-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 sm:mt-3.5">
              Explorar
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

/** Vitrina de categorías: grilla igualada, imagen a sangre y tipografía editorial. */
export function StoreNetflixCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  if (categories.length === 0) return null;

  const visible = categories.slice(0, 8);
  const count = visible.length;

  const gridCols =
    count === 1
      ? "mx-auto max-w-md grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : count === 3
          ? "grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

  return (
    <section
      className="bg-[#f7f5f2] py-10 sm:py-12 lg:py-14"
      aria-labelledby="home-categories-heading"
    >
      <div className={storeShellClass}>
        <div className="mb-6 text-center sm:mb-8">
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
      </div>

      {/* Sangre total: columnas iguales (1fr cada una), tipografía al mismo nivel */}
      <ul className={`grid w-full gap-px bg-stone-300/80 ${gridCols}`}>
        {visible.map((c, i) => (
          <CategoryPoster key={c.id} category={c} priority={i < 2} />
        ))}
      </ul>
    </section>
  );
}
