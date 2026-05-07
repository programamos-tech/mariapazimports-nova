/** Visible store name; override with NEXT_PUBLIC_STORE_NAME per fork. */
export const storeBrand =
  process.env.NEXT_PUBLIC_STORE_NAME ?? "María Paz Importaciones";

/**
 * Nombre en el pie © (independiente del nombre corto de marca si usás env de plantilla).
 * Ej.: NEXT_PUBLIC_STORE_COPYRIGHT_NAME
 */
export const storeCopyrightHolder =
  process.env.NEXT_PUBLIC_STORE_COPYRIGHT_NAME ?? "María Paz Importaciones";

/** Línea bajo el nombre (footer, etc.). */
export const storeTagline =
  process.env.NEXT_PUBLIC_STORE_TAGLINE ??
  "Personal Shopper · Productos 100% originales";

/** Párrafo corto sobre la tienda (footer). */
export const storeShortDescription =
  process.env.NEXT_PUBLIC_STORE_DESCRIPTION ??
  "Importaciones seleccionadas con asesoría personalizada. Productos auténticos y envíos a toda Colombia.";

/** Teléfono de contacto (footer, cabecera). */
export const storeSupportPhone =
  process.env.NEXT_PUBLIC_STORE_PHONE ?? "+57 300 555 0100";

/**
 * Solo dígitos para wa.me (sin +). Podés fijar NEXT_PUBLIC_WHATSAPP_NUMBER si difiere del teléfono visible.
 */
const whatsappDigits =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ??
  storeSupportPhone.replace(/\D/g, "");

/** Enlace directo a chat de WhatsApp. */
export const storeWhatsAppUrl: string = whatsappDigits
  ? `https://wa.me/${whatsappDigits}`
  : "#";

/** Texto del anuncio superior (marquee). */
export const storeAnnouncementMessage =
  process.env.NEXT_PUBLIC_STORE_ANNOUNCEMENT ??
  "Productos 100% originales — envíos nacionales";

/** Email de contacto visible en el footer. */
export const storeSupportEmail =
  process.env.NEXT_PUBLIC_STORE_EMAIL ?? "hola@mariapazimports.com";

/** Horario de atención (texto libre). */
export const storeSupportHours =
  process.env.NEXT_PUBLIC_STORE_HOURS ?? "Lun. a vie. · 9:00 – 18:00 (Colombia)";

/** Perfil de Instagram de la tienda. */
export const storeInstagramUrl =
  process.env.NEXT_PUBLIC_STORE_INSTAGRAM_URL ??
  "https://www.instagram.com/mariapazimports/";
