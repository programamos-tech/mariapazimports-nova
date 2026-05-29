import { normalizeProductImagePaths } from "@/lib/product-images";
import { productDisplayImageUrl } from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";

function toCardUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  const pub = storagePublicObjectUrl(storagePath);
  return productDisplayImageUrl(pub, "card") ?? pub;
}

/** Portada y segunda imagen del catálogo (hover en tarjeta). */
export function productCardDisplayImages(
  imagePath: string | null | undefined,
  imagePaths?: unknown,
): { primary: string | null; hover: string | null } {
  const paths = normalizeProductImagePaths(imagePath, imagePaths);
  const primary = toCardUrl(paths[0] ?? null);
  const secondPath = paths[1] ?? null;
  const hover =
    secondPath && secondPath !== paths[0] ? toCardUrl(secondPath) : null;
  return { primary, hover };
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
