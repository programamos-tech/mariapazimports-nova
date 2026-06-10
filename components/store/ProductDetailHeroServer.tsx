import Image from "next/image";
import {
  productHeroImageUrl,
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS,
  STORE_PRODUCT_DETAIL_HERO_SIZES,
} from "@/lib/store-product-card-image";

/** Hero SSR: producto completo, mismo marco que tarjetas. */
export function ProductDetailHeroServer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const display = productHeroImageUrl(src) ?? src;

  return (
    <div
      className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      <Image
        src={display}
        alt={alt}
        fill
        className={STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS}
        sizes={STORE_PRODUCT_DETAIL_HERO_SIZES}
        priority
        fetchPriority="high"
        unoptimized={shouldUseUnoptimizedImage(display)}
      />
    </div>
  );
}
