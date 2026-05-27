import {
  fragranceImagesForLabel,
  normalizeFragranceOptionImages,
  normalizeProductImagePaths,
  primaryImagePath,
} from "@/lib/product-images";

/** Imagen de línea de carrito según fragancia elegida (mapa en producto). */
export function imagePathForProductLine(
  imagePath: string | null | undefined,
  fragranceOptionImages: unknown,
  fragrance?: string | null,
  imagePaths?: unknown,
): string | null {
  const catalog = normalizeProductImagePaths(imagePath, imagePaths);
  const fallback = primaryImagePath(catalog) ?? imagePath ?? null;
  const f = typeof fragrance === "string" ? fragrance.trim() : "";
  if (!f) return fallback;
  const map = normalizeFragranceOptionImages(fragranceOptionImages);
  const paths = fragranceImagesForLabel(map, f);
  return paths[0] ?? fallback;
}
