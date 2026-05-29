/** Paso entre tarjetas en grillas (ms). */
export const REVEAL_PRODUCT_STAGGER_STEP_MS = 18;

/** Tope de retardo escalonado en productos (ms). */
export const REVEAL_PRODUCT_STAGGER_MAX_MS = 126;

/** Bloques de texto / CTA (ms). */
export const REVEAL_BLOCK_DELAY_MS = 36;

export function revealProductStagger(index: number): number {
  return Math.min(
    index * REVEAL_PRODUCT_STAGGER_STEP_MS,
    REVEAL_PRODUCT_STAGGER_MAX_MS,
  );
}

/** Filas de catálogo por categoría (carrusel + grilla). */
export function revealCatalogRowStagger(
  sectionIndex: number,
  index: number,
): number {
  return Math.min(
    sectionIndex * 14 + index * REVEAL_PRODUCT_STAGGER_STEP_MS,
    REVEAL_PRODUCT_STAGGER_MAX_MS,
  );
}
