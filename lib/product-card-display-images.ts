import { normalizeProductImagePaths } from "@/lib/product-images";
import { productCardImageSources } from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";

export type ProductCardImageSource = {
  src: string | null;
  srcSet: string | null;
};

function toCardSource(storagePath: string | null): ProductCardImageSource {
  if (!storagePath) return { src: null, srcSet: null };
  const pub = storagePublicObjectUrl(storagePath);
  if (!pub) return { src: null, srcSet: null };
  return productCardImageSources(pub);
}

/** Portada y segunda imagen del catálogo (hover en tarjeta). */
export function productCardDisplayImages(
  imagePath: string | null | undefined,
  imagePaths?: unknown,
): {
  primary: string | null;
  primarySrcSet: string | null;
  hover: string | null;
  hoverSrcSet: string | null;
} {
  const paths = normalizeProductImagePaths(imagePath, imagePaths);
  const primarySource = toCardSource(paths[0] ?? null);
  const secondPath = paths[1] ?? null;
  const hoverSource =
    secondPath && secondPath !== paths[0]
      ? toCardSource(secondPath)
      : { src: null, srcSet: null };
  return {
    primary: primarySource.src,
    primarySrcSet: primarySource.srcSet,
    hover: hoverSource.src,
    hoverSrcSet: hoverSource.srcSet,
  };
}

/** URL pública de la portada (prefetch hero al hover). */
export function productPrimaryPublicImageUrl(
  imagePath: string | null | undefined,
  imagePaths?: unknown,
): string | null {
  const paths = normalizeProductImagePaths(imagePath, imagePaths);
  const first = paths[0] ?? null;
  return first ? storagePublicObjectUrl(first) : null;
}
