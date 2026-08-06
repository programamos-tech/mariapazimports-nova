/** Categoría especial: catálogo agrupado por marca (`/marcas`). */
export function isMarcasCategoryName(name: string | null | undefined): boolean {
  return String(name ?? "").trim().toLowerCase() === "marcas";
}

export function storeMarcasHref(): string {
  return "/marcas";
}

export function storeMarcasBrandHref(brandName: string): string {
  const brand = brandName.trim();
  if (!brand) return storeMarcasHref();
  return `/marcas?brands=${encodeURIComponent(brand)}`;
}
