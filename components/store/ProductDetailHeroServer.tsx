import { productHeroImageSources } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS,
  STORE_PRODUCT_DETAIL_HERO_SIZES,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";

/** Hero SSR: marco adaptativo a viewport en desktop. */
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
    <div className={STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS}>
      {/* eslint-disable-next-line @next/next/no-img-element -- contain desde Supabase */}
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
