import {
  fragranceImagesForLabel,
  normalizeFragranceOptionImages,
  normalizeProductImagePaths,
  primaryImagePath,
} from "@/lib/product-images";
import type { ProductVariant } from "@/lib/product-variants";

/** Imagen de línea de carrito según variante o fragancia legacy. */
export function imagePathForProductLine(
  imagePath: string | null | undefined,
  fragranceOptionImages: unknown,
  fragrance?: string | null,
  imagePaths?: unknown,
  variant?: Pick<ProductVariant, "imagePaths"> | null,
): string | null {
  const catalog = normalizeProductImagePaths(imagePath, imagePaths);
  const fallback = primaryImagePath(catalog) ?? imagePath ?? null;

  if (variant?.imagePaths?.length) {
    return variant.imagePaths[0] ?? fallback;
  }

  const f = typeof fragrance === "string" ? fragrance.trim() : "";
  if (!f) return fallback;
  const map = normalizeFragranceOptionImages(fragranceOptionImages);
  const paths = fragranceImagesForLabel(map, f);
  return paths[0] ?? fallback;
}
