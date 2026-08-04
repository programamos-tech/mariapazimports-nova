/** Códigos de origen de importación en `products.import_origin`. */
export const PRODUCT_IMPORT_ORIGINS = ["US", "EU", "OTHER"] as const;

export type ProductImportOrigin = (typeof PRODUCT_IMPORT_ORIGINS)[number];

export function parseProductImportOrigin(
  value: unknown,
): ProductImportOrigin {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "EU") return "EU";
  if (raw === "OTHER") return "OTHER";
  return "US";
}

export function productImportOriginLabel(
  origin: ProductImportOrigin,
): string {
  switch (origin) {
    case "EU":
      return "Importado desde Europa";
    case "OTHER":
      return "Importado";
    default:
      return "Importado desde USA";
  }
}

export function productImportOriginShortLabel(
  origin: ProductImportOrigin,
): string {
  switch (origin) {
    case "EU":
      return "Europa";
    case "OTHER":
      return "Importado";
    default:
      return "USA";
  }
}
