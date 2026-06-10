import { productHeroImageSources } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_SIZES,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";

/** Hero SSR: marco 4:5 lleno, producto completo en HD. */
export function ProductDetailHeroServer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const { src: displaySrc, srcSet } = productHeroImageSources(src);
  if (!displaySrc) return null;

  return (
    <div
      className={`relative overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 4:5 contain desde Supabase */}
      <img
        src={displaySrc}
        srcSet={srcSet ?? undefined}
        sizes={STORE_PRODUCT_DETAIL_HERO_SIZES}
        alt={alt}
        className={STORE_PRODUCT_IMAGE_IMG_CLASS}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
    </div>
  );
}
