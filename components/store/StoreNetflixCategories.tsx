import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass } from "@/lib/store-layout";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
} from "@/lib/store-product-card-image";
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
      <article className="group/cat flex h-full flex-col">
        <div className="relative shrink-0">
          <div
            className={`relative w-full overflow-hidden bg-stone-100 ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS}`}
          >
            {category.imageSrc ? (
              <Image
                src={category.imageSrc}
                alt=""
                fill
                priority={priority}
                quality={90}
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover object-center transition duration-500 ease-out group-hover/cat:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/cat:scale-100"
                unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
              />
            ) : (
              <div className={`absolute inset-0 ${category.tint}`} />
            )}
          </div>
          <Link
            href={href}
            className="absolute inset-0 z-[1] block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400/70"
            aria-label={category.name}
          />
        </div>

        <div className="pt-4">
          <Link
            href={href}
            className="block border border-stone-300 bg-white py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-stone-800 transition hover:border-stone-900 hover:text-stone-900"
          >
            <span className="line-clamp-1">{category.name}</span>
          </Link>
        </div>
      </article>
    </li>
  );
}

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

        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:gap-x-10">
          {visible.map((c, i) => (
            <CategoryPoster key={c.id} category={c} priority={i < 3} />
          ))}
        </ul>
      </div>
    </section>
  );
}
