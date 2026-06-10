"use client";

import { productHeroImageSources } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_DETAIL_HERO_SIZES,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto";
};

/** Hero PDP: marco 4:5 lleno, producto completo en HD. */
export function ProductDetailHeroImage({
  src,
  alt,
  priority = false,
  fetchPriority = "auto",
}: Props) {
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
        loading={priority ? "eager" : "lazy"}
        fetchPriority={fetchPriority}
        decoding={priority ? "sync" : "async"}
      />
    </div>
  );
}
