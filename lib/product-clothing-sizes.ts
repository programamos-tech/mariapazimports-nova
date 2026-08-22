/** Tallas de ropa sugeridas al crear variantes en Moda. */
export const CLOTHING_SIZE_PRESETS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "Única",
] as const;

export type ClothingSizePreset = (typeof CLOTHING_SIZE_PRESETS)[number];

/**
 * Numeración EU común en Colombia para calzado (mujer/hombre).
 * Se pueden agregar tallas sueltas en el formulario (ej. 37.5).
 */
export const SHOE_SIZE_PRESETS = [
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
] as const;

export type ShoeSizePreset = (typeof SHOE_SIZE_PRESETS)[number];
