/** Marco 4:5 unificado en vitrina (home, catálogo, favoritos, carruseles). */
export const STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS = "aspect-[4/5]";

/** Fondo blanco: coincide con el padding del transform contain en Storage. */
export const STORE_PRODUCT_CARD_IMAGE_BG_CLASS = "bg-white";

/** Producto completo dentro del marco 4:5 (catálogo y PDP). */
export const STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS =
  "object-cover object-center";

/**
 * La imagen ya viene en 4:5 desde Storage (contain); llena el marco sin bandas CSS.
 */
export const STORE_PRODUCT_IMAGE_IMG_CLASS =
  "absolute inset-0 size-full object-cover object-center";

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_IMAGE_FRAME_CLASS = "";

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS =
  STORE_PRODUCT_IMAGE_FRAME_CLASS;

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_DETAIL_HERO_IMG_CLASS =
  STORE_PRODUCT_IMAGE_IMG_CLASS;

/** @deprecated Usar `STORE_PRODUCT_IMAGE_IMG_CLASS` */
export const STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS =
  STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS;

/** Tarjetas: capa absoluta para crossfade al hover. */
export const STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS = "absolute inset-0";

/** Margen de prefetch: empieza a descargar ~1 fila antes de entrar al viewport. */
export const STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN =
  "720px 0px 720px 0px";

/** Tarjetas visibles al entrar al catálogo: cargar sin lazy. */
export const STORE_PRODUCT_CARD_EAGER_COUNT = 4;

/** `sizes` para grilla 2→4 columnas (sin pedir más de ~400 CSS px). */
export const STORE_PRODUCT_CARD_IMAGE_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 320px";

/** Hero PDP: columna completa en móvil, mitad en desktop. */
export const STORE_PRODUCT_DETAIL_HERO_SIZES =
  "(max-width: 1024px) 100vw, 50vw";

export function storeProductCardImagePriority(index: number): boolean {
  return index >= 0 && index < STORE_PRODUCT_CARD_EAGER_COUNT;
}
