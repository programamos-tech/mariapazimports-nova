/** Visible store name; override with NEXT_PUBLIC_STORE_NAME per fork. */
export const storeBrand =
  process.env.NEXT_PUBLIC_STORE_NAME ?? "programamos templates";

/** Teléfono de contacto (footer, cabecera). */
export const storeSupportPhone =
  process.env.NEXT_PUBLIC_STORE_PHONE ?? "+57 (1) 234 5678";

/** Email de contacto visible en el footer. */
export const storeSupportEmail =
  process.env.NEXT_PUBLIC_STORE_EMAIL ?? "hola@tutienda.com";
