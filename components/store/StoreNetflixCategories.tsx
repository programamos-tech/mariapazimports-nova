import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { storeShellClass, storeProductGridClass } from "@/lib/store-layout";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_SIZES,
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
  const countLabel =
    category.productCount === 1
      ? "1 producto"
      : category.productCount > 0
        ? `${category.productCount} productos`
        : category.sub;

  return (
    <li className="min-w-0">
      <article className="group/cat flex h-full flex-col">
        <div className="relative shrink-0">
          <div
            className={`relative w-full overflow-hidden bg-[#faf8f5] ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS}`}
          >
            {category.imageSrc ? (
              <Image
                src={category.imageSrc}
                alt=""
                fill
                priority={priority}
                quality={90}
                sizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
                className="object-contain object-center transition duration-500 ease-out group-hover/cat:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/cat:scale-100"
                unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
              />
            ) : (
              <div className={`absolute inset-0 ${category.tint}`} />
            )}
          </div>
          <span className="pointer-events-none absolute left-3 top-3 z-10 border border-stone-900 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-900">
            Catálogo
          </span>
          <Link
            href={href}
            className="absolute inset-0 z-[1] block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400/70"
            aria-label={`Ver catálogo de ${category.name}`}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col space-y-1.5 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
            Categoría
          </p>
          <Link
            href={href}
            className="text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-900 transition hover:text-stone-600"
          >
            <span className="line-clamp-3">{category.name}</span>
          </Link>
          <p className="pt-0.5 text-[13px] font-medium tabular-nums text-stone-900">
            {countLabel}
          </p>

          <Link
            href={href}
            className="mt-auto block border border-stone-900 bg-stone-900 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-stone-900"
          >
            Ver catálogo
          </Link>
        </div>
      </article>
    </li>
  );
}

/** Vitrina de categorías: misma card que productos, marcada como catálogo. */
export function StoreNetflixCategories({
  categories,
}: {
  categories: HomeCategoryCard[];
}) {
  if (categories.length === 0) return null;

  const visible = categories.slice(0, 8);

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

        <ul className={`mt-8 ${storeProductGridClass}`}>
          {visible.map((c, i) => (
            <CategoryPoster key={c.id} category={c} priority={i < 2} />
          ))}
        </ul>
      </div>
    </section>
  );
}
