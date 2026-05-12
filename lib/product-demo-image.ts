import { storagePublicObjectUrl } from "@/lib/storage-public-url";

/**
 * Fotos de ejemplo (Unsplash — `images.unsplash.com` en `next.config.ts`) para
 * tarjetas y PDP cuando `image_path` está vacío: previsualizar la grilla con imágenes reales.
 *
 * - Desarrollo (`NODE_ENV === "development"`): activo salvo `NEXT_PUBLIC_DEMO_PRODUCT_IMAGES=0`.
 * - Producción: solo si `NEXT_PUBLIC_DEMO_PRODUCT_IMAGES=1` (u on/true).
 */
const DEMO_PRODUCT_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1556228578-0d85f59b6318?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1571875257727-256c39da92bf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc5407?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1596755094514-87a80d21c1cb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1612817288484-6f9161a85e1d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512496015851-a90fb38de796?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=900&q=80",
] as const;

function demoProductPlaceholdersEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_DEMO_PRODUCT_IMAGES;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    if (v === "0" || v === "false" || v === "off") return false;
    if (v === "1" || v === "true" || v === "on") return true;
  }
  return process.env.NODE_ENV === "development";
}

function stableIndexForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % DEMO_PRODUCT_IMAGE_URLS.length;
}

function pickDemoUrl(productId: string): string {
  return DEMO_PRODUCT_IMAGE_URLS[stableIndexForId(productId)]!;
}

/**
 * Foto de respaldo cuando la imagen del producto falla al cargar (404, objeto borrado, URL inválida).
 * No depende de `NEXT_PUBLIC_DEMO_PRODUCT_IMAGES`: solo se usa tras `onError` del `<Image>`.
 */
export function productImageRecoveryUrl(productId: string): string {
  return pickDemoUrl(productId);
}

/** URL de foto demo (misma rotación que en tarjetas). Solo si placeholders están habilitados. */
export function productDemoPlaceholderUrl(productId: string): string | null {
  if (!demoProductPlaceholdersEnabled()) return null;
  return pickDemoUrl(productId);
}

/** URL para imagen de tarjeta / miniatura: Storage si hay ruta; si no, demo opcional. */
export function resolveProductCardImageUrl(
  productId: string,
  imagePath: string | null | undefined,
): string | null {
  const stored = storagePublicObjectUrl(imagePath);
  if (stored) return stored;
  return productDemoPlaceholderUrl(productId);
}
