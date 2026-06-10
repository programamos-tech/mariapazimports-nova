"use client";

import { productHeroImageUrl } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_IMAGE_FRAME_CLASS,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto";
};

/** Hero PDP: marco 4:5, producto completo en HD. */
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
      className={`overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
    >
      <div className={STORE_PRODUCT_IMAGE_FRAME_CLASS}>
        {/* eslint-disable-next-line @next/next/no-img-element -- original HD sin recompresión */}
        <img
          src={displaySrc}
          alt={alt}
          className={STORE_PRODUCT_IMAGE_IMG_CLASS}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={fetchPriority}
          decoding={priority ? "sync" : "async"}
        />
      </div>
    </div>
  );
}
