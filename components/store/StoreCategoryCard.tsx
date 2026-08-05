import Link from "next/link";
import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import {
  STORE_CATEGORY_CARD_IMAGE_SIZES,
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";
import { productCardImageSources } from "@/lib/storage-image-url";

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
          aria-label={category.name}
        >
          <div
            className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
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
          </div>

          <p className="mt-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition group-hover/cat:text-stone-700 sm:mt-3 sm:text-[11px] sm:tracking-[0.16em]">
            <span className="line-clamp-2">{category.name}</span>
          </p>
        </Link>
      </article>
    </li>
  );
}
