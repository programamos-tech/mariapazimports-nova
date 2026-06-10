import { productHeroImageUrl } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS,
  STORE_PRODUCT_DETAIL_HERO_IMG_CLASS,
} from "@/lib/store-product-card-image";

/** Hero SSR: archivo original en Storage, sin optimizador de `next/image`. */
export function ProductDetailHeroServer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const displaySrc = productHeroImageUrl(src);
  if (!displaySrc) return null;

  return (
    <div
      className={`${STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS} ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- original HD sin recompresión */}
      <img
        src={displaySrc}
        alt={alt}
        className={STORE_PRODUCT_DETAIL_HERO_IMG_CLASS}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
    </div>
  );
}
