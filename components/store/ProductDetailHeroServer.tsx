import { productHeroImageUrl } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS,
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
      className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- original HD sin recompresión */}
      <img
        src={displaySrc}
        alt={alt}
        className={`absolute inset-0 size-full ${STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS}`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}
