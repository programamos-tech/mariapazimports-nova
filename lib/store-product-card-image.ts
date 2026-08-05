/** Marco 4:5 unificado en vitrina (home, catálogo, favoritos, carruseles). */
export const STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS = "aspect-[4/5]";

/** Fondo blanco: coincide con el padding del transform contain en Storage. */
export const STORE_PRODUCT_CARD_IMAGE_BG_CLASS = "bg-white";

/** Producto completo dentro del marco 4:5 (sin recortar). */
export const STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS =
  "object-contain object-center";

/**
 * Original de Storage en marco 4:5: contain + fondo blanco (no cover).
 */
export const STORE_PRODUCT_IMAGE_IMG_CLASS =
  "absolute inset-0 size-full object-contain object-center";

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_IMAGE_FRAME_CLASS = "";

/**
 * Marco del hero en ficha: 4:5 en móvil; en desktop se limita a la altura
 * visible para que título + compra + acordeones quepan sin scroll de página.
 */
export const STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS =
  `relative overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS} aspect-[4/5] lg:aspect-auto lg:h-[min(70svh,calc(100svh-8.75rem))]`;

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_DETAIL_HERO_IMG_CLASS =
  STORE_PRODUCT_IMAGE_IMG_CLASS;

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS =
  STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS;

/** Tarjetas: capa absoluta para crossfade al hover. */
export const STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS = "absolute inset-0";

/** Margen de prefetch: ~media fila antes (menos descargas en paralelo). */
export const STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN =
  "480px 0px 480px 0px";

/** Tarjetas visibles al entrar al catálogo: cargar sin lazy. */
export const STORE_PRODUCT_CARD_EAGER_COUNT = 4;

/**
 * `sizes` alineado a la grilla real (2 cols hasta lg, 4 desde lg).
 * El navegador elige el tier del srcSet (~2× DPR) sin bajar a 400–800 blando.
 */
export const STORE_PRODUCT_CARD_IMAGE_SIZES =
  "(max-width: 1023px) 50vw, (max-width: 1536px) 25vw, 380px";

/** Hero PDP: columna completa en móvil, mitad en desktop. */
export const STORE_PRODUCT_DETAIL_HERO_SIZES =
  "(max-width: 1024px) 100vw, 50vw";

/**
 * Categorías en home / “otras categorías”: grilla densa (2→6 cols).
 * El navegador pide el original; sizes evita sobre-descarga innecesaria.
 */
export const STORE_CATEGORY_CARD_IMAGE_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw";

export function storeProductCardImagePriority(index: number): boolean {
  return index >= 0 && index < STORE_PRODUCT_CARD_EAGER_COUNT;
}
