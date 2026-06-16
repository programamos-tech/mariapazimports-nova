/** Evita metacaracteres en ILIKE y en la sintaxis de `.or()` de PostgREST. */
export function sanitizeStoreProductSearchQuery(q: string): string {
  return q.replace(/[%_\\,]/g, "").slice(0, 80);
}

/** Filtro PostgREST: nombre o marca contienen el texto. */
export function storeProductNameOrBrandSearchOr(q: string): string | null {
  const safe = sanitizeStoreProductSearchQuery(q.trim());
  if (safe.length < 1) return null;
  const pattern = `%${safe}%`;
  return `name.ilike.${pattern},brand.ilike.${pattern}`;
}
