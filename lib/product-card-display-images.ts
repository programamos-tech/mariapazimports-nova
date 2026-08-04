import { normalizeProductImagePaths } from "@/lib/product-images";
import { productCardImageSources } from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";

export type ProductCardImageSource = {
  src: string;
  srcSet: string | null;
};

function toCardSource(storagePath: string | null): {
  src: string | null;
  srcSet: string | null;
} {
  if (!storagePath) return { src: null, srcSet: null };
  const pub = storagePublicObjectUrl(storagePath);
  if (!pub) return { src: null, srcSet: null };
  return productCardImageSources(pub);
}

/** Portada, hover y galería completa del catálogo (para rotar en tarjetas). */
export function productCardDisplayImages(
  imagePath: string | null | undefined,
  imagePaths?: unknown,
): {
  primary: string | null;
  primarySrcSet: string | null;
  hover: string | null;
  hoverSrcSet: string | null;
  gallery: ProductCardImageSource[];
} {
  const paths = normalizeProductImagePaths(imagePath, imagePaths);
  const gallery: ProductCardImageSource[] = [];
  const seen = new Set<string>();
  for (const path of paths) {
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const source = toCardSource(path);
    if (source.src) gallery.push({ src: source.src, srcSet: source.srcSet });
  }

  const primarySource = gallery[0] ?? { src: null, srcSet: null };
  const hoverSource =
    gallery[1] && gallery[1].src !== primarySource.src
      ? gallery[1]
      : { src: null, srcSet: null };

  return {
    primary: primarySource.src,
    primarySrcSet: primarySource.srcSet,
    hover: hoverSource.src,
    hoverSrcSet: hoverSource.srcSet,
    gallery,
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
