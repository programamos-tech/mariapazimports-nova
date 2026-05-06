/** Catálogo visual para mega-menú (sin tabla `categories` en DB aún). */
export const megaMenuCategories = [
  { id: "hogar", name: "Hogar", sub: "Mobiliario y decoración", emoji: "🪑", tint: "bg-[#eef4ec]" },
  { id: "bolsos", name: "Bolsos", sub: "Accesorios", emoji: "👜", tint: "bg-[#faf3ee]" },
  { id: "tech", name: "Tech", sub: "Gadgets y audio", emoji: "🎧", tint: "bg-[#ecf4f6]" },
  { id: "moda", name: "Moda", sub: "Ropa y calzado", emoji: "👟", tint: "bg-[#f3eff6]" },
  { id: "bienestar", name: "Bienestar", sub: "Cuidado personal", emoji: "🧴", tint: "bg-[#f5f3ea]" },
  { id: "regalos", name: "Regalos", sub: "Detalles especiales", emoji: "🎁", tint: "bg-[#faf5ed]" },
] as const;

/** Reparte `total` en 6 enteros que suman `total` (estilo “N ítems” por fila). */
export function distributeProductCounts(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rem = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}
