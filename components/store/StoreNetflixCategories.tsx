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
      <Link
        href={href}
        className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2"
      >
        <div
          className={`relative w-full overflow-hidden bg-white ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS}`}
        >
          {category.imageSrc ? (
            <Image
              src={category.imageSrc}
              alt=""
              fill
              priority={priority}
              quality={90}
              sizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
              className="object-contain object-center transition duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
            />
          ) : (
            <div className={`absolute inset-0 ${category.tint}`} />
          )}
        </div>

        <div className="space-y-1 pt-4 text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
            {countLabel}
          </p>
          <h3 className="text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-900 transition group-hover:text-stone-600">
            {category.name}
          </h3>
          <p className="pt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-900 underline decoration-transparent underline-offset-4 transition group-hover:decoration-stone-900">
            Ver categoría
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Vitrina de categorías: mismo lenguaje visual que las tarjetas de producto. */
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
