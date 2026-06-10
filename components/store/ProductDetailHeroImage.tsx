"use client";

import Image from "next/image";
import {
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS,
  STORE_PRODUCT_DETAIL_HERO_SIZES,
} from "@/lib/store-product-card-image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto";
};

/** Hero PDP: producto completo dentro del marco (sin recorte). */
export function ProductDetailHeroImage({
  src,
  alt,
  priority = false,
  fetchPriority = "auto",
}: Props) {
  const unopt = shouldUseUnoptimizedImage(src);

  return (
    <div
      className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS}
        sizes={STORE_PRODUCT_DETAIL_HERO_SIZES}
        priority={priority}
        fetchPriority={fetchPriority}
        unoptimized={unopt}
      />
    </div>
  );
}
