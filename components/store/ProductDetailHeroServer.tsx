import Image from "next/image";
import {
  productDisplayImageUrl,
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS,
} from "@/lib/store-product-card-image";

/** Hero SSR: producto completo, mismo marco que tarjetas. */
export function ProductDetailHeroServer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const display = productDisplayImageUrl(src, "hero") ?? src;

  return (
    <div
      className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      <Image
        src={display}
        alt={alt}
        fill
        className={STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS}
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        fetchPriority="high"
        unoptimized={shouldUseUnoptimizedImage(display)}
      />
    </div>
  );
}
