import Link from "next/link";
import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import {
  STORE_CATEGORY_CARD_IMAGE_SIZES,
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";
import { productCardImageSources } from "@/lib/storage-image-url";

/** Tile de categoría: distinto a la card de producto (sin precio ni CTA de bolsa). */
export function StoreCategoryCard({
  category,
  priority,
}: {
  category: HomeCategoryCard;
  priority?: boolean;
}) {
  const href = `/products?category=${encodeURIComponent(category.id)}`;
  const { src, srcSet } = productCardImageSources(category.imageSrc);

  return (
    <li className="min-w-0">
      <article className="group/cat">
        <Link
          href={href}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:ring-offset-2"
          aria-label={`Categoría ${category.name}`}
        >
          <div
            className={`relative w-full overflow-hidden ring-1 ring-stone-200 transition group-hover/cat:ring-stone-900 ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element -- original Storage, contain como vitrina
              <img
                src={src}
                srcSet={srcSet ?? undefined}
                sizes={STORE_CATEGORY_CARD_IMAGE_SIZES}
                alt=""
                className={`${STORE_PRODUCT_IMAGE_IMG_CLASS} transition duration-500 ease-out group-hover/cat:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/cat:scale-100`}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
              />
            ) : (
              <div className={`absolute inset-0 ${category.tint}`} />
            )}

            <div className="absolute inset-x-0 bottom-0 z-[1] bg-stone-900 px-3 py-3 text-center text-white sm:px-3.5 sm:py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-[12px] sm:tracking-[0.14em]">
                <span className="line-clamp-2">{category.name}</span>
              </p>
            </div>
          </div>
        </Link>
      </article>
    </li>
  );
}
