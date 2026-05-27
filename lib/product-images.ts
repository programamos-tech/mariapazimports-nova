/** Máximo de imágenes por producto (catálogo) o por opción de fragancia. */
export const MAX_PRODUCT_IMAGES_PER_GROUP = 5;

/** Normaliza `image_path` + `image_paths` a una lista única (máx. 5). */
export function normalizeProductImagePaths(
  imagePath: string | null | undefined,
  imagePaths: unknown,
): string[] {
  const fromArray = parseImagePathList(imagePaths);
  if (fromArray.length > 0) {
    return fromArray.slice(0, MAX_PRODUCT_IMAGES_PER_GROUP);
  }
  const single = typeof imagePath === "string" ? imagePath.trim() : "";
  return single ? [single] : [];
}

export function parseImagePathList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const p = item.trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= MAX_PRODUCT_IMAGES_PER_GROUP) break;
  }
  return out;
}

export function primaryImagePath(paths: string[]): string | null {
  return paths[0] ?? null;
}

/** Valor en `fragrance_option_images`: string legacy o string[]. */
export function parseFragranceImagePaths(raw: unknown): string[] {
  if (typeof raw === "string") {
    const p = raw.trim();
    return p ? [p] : [];
  }
  return parseImagePathList(raw);
}

export function normalizeFragranceOptionImages(
  raw: unknown,
): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [label, value] of Object.entries(raw as Record<string, unknown>)) {
    const key = label.trim();
    if (!key) continue;
    const paths = parseFragranceImagePaths(value);
    if (paths.length > 0) out[key] = paths;
  }
  return out;
}

export function fragranceImagesForLabel(
  map: Record<string, string[]>,
  label: string,
): string[] {
  const direct = map[label];
  if (direct?.length) return direct;
  const lower = label.toLowerCase();
  for (const [k, paths] of Object.entries(map)) {
    if (k.toLowerCase() === lower && paths.length > 0) return paths;
  }
  return [];
}

export function parseFragranceImagesExistingField(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  if (t.startsWith("[")) {
    try {
      return parseImagePathList(JSON.parse(t) as unknown);
    } catch {
      return [];
    }
  }
  return parseImagePathList([t]);
}
