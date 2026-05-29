/**
 * Sangrado horizontal de la vitrina — mismo que `StoreHeader`
 * (`px-3 sm:px-4 lg:px-10`). Sin `max-w-7xl` para alinear con menú y acciones.
 */
export const storeShellXClass = "px-3 sm:px-4 lg:px-10";

export const storeShellClass = `w-full min-w-0 ${storeShellXClass}`;

/** Grilla de productos en home, catálogo y favoritos (mismo ancho de tarjeta/imagen). */
export const storeProductGridClass =
  "grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10";
