/** Marco 4:5 unificado en vitrina (home, catálogo, favoritos, carruseles). */
export const STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS = "aspect-[4/5]";

/** Fondo de respaldo mientras carga la imagen. */
export const STORE_PRODUCT_CARD_IMAGE_BG_CLASS = "bg-stone-100";

/** Llena todo el marco 4:5 sin bandas laterales ni superiores. */
export const STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS =
  "object-cover object-center";

/**
 * Cover nítido: escala desde resolución intrínseca (evita decodificar a tamaño del layout).
 */
export const STORE_PRODUCT_CARD_IMAGE_IMG_CLASS =
  "absolute left-1/2 top-1/2 min-h-full min-w-full w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-center";

/** Ficha de producto: imagen completa sin recorte dentro del marco 4:5. */
export const STORE_PRODUCT_DETAIL_HERO_OBJECT_CLASS =
  "object-contain object-center";

/** Marco hero: centra la imagen a resolución completa dentro del 4:5. */
export const STORE_PRODUCT_DETAIL_HERO_FRAME_CLASS =
  "flex w-full items-center justify-center overflow-hidden";

/** Contain nítido en PDP (sin estirar el elemento `<img>` al 100%). */
export const STORE_PRODUCT_DETAIL_HERO_IMG_CLASS =
  "max-h-full max-w-full object-contain object-center";

/** Margen de prefetch: empieza a descargar ~1 fila antes de entrar al viewport. */
export const STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN =
  "720px 0px 720px 0px";

/** Tarjetas visibles al entrar al catálogo: cargar sin lazy. */
export const STORE_PRODUCT_CARD_EAGER_COUNT = 12;

/** `sizes` para grilla 2→4 columnas (Full HD / retina). */
export const STORE_PRODUCT_CARD_IMAGE_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 480px";

/** Hero PDP: columna completa en móvil, mitad en desktop. */
export const STORE_PRODUCT_DETAIL_HERO_SIZES =
  "(max-width: 1024px) 100vw, 50vw";

export function storeProductCardImagePriority(index: number): boolean {
  return index >= 0 && index < STORE_PRODUCT_CARD_EAGER_COUNT;
}
