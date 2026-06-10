"use client";

import { productHeroImageUrl } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS,
} from "@/lib/store-product-card-image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto";
};

/** Hero PDP: archivo original en Storage, sin optimizador de `next/image`. */
export function ProductDetailHeroImage({
  src,
  alt,
  priority = false,
  fetchPriority = "auto",
}: Props) {
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
        loading={priority ? "eager" : "lazy"}
        fetchPriority={fetchPriority}
        decoding="async"
      />
    </div>
  );
}
