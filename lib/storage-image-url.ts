import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export type ProductImageSize = "card" | "thumb" | "hero" | "banner";

/** Proporción 4:5; ~2× en móvil (50vw) sin exceso de peso. */
const CARD_IMAGE_WIDTH = 360;
const CARD_IMAGE_HEIGHT = 450;

const PRESETS: Record<
  ProductImageSize,
  { width: number; height?: number; quality: number; resize?: "cover" | "contain" | "fill" }
> = {
  card: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    quality: 68,
    resize: "cover",
  },
  thumb: { width: 96, height: 96, quality: 72, resize: "contain" },
  hero: {
    width: CARD_IMAGE_WIDTH * 2,
    height: CARD_IMAGE_HEIGHT * 2,
    quality: 80,
    resize: "contain",
  },
  banner: { width: 1200, quality: 78 },
};

/** Transformaciones de Storage vía imgproxy (Supabase hospedado y CLI local). */
export function shouldUseStorageImageTransform(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    const u = new URL(src);
    const host = u.hostname;
    if (host.endsWith(".supabase.co")) return true;
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
    if (supabaseHost && host === supabaseHost && u.pathname.includes("/storage/v1/")) {
      return true;
    }
    if (
      (host === "127.0.0.1" || host === "localhost") &&
      u.pathname.includes("/storage/v1/")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function isTransformedStorageImageUrl(src: string | null | undefined): boolean {
  return Boolean(src?.includes("/storage/v1/render/image/"));
}

/**
 * Convierte URL pública de Storage a `/render/image/public/...` con tamaño y calidad.
 * En local (127.0.0.1) devuelve la URL original si imgproxy no está disponible.
 */
export function storageImageTransformUrl(
  src: string | null | undefined,
  opts: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: "cover" | "contain" | "fill";
  } = {},
): string | null {
  if (!src) return null;
  if (!shouldUseStorageImageTransform(src)) return src;

  try {
    const u = new URL(src);
    const objectMarker = "/storage/v1/object/public/";
    const renderMarker = "/storage/v1/render/image/public/";

    let objectPath: string;
    if (u.pathname.includes(renderMarker)) {
      objectPath = u.pathname.slice(u.pathname.indexOf(renderMarker) + renderMarker.length);
    } else if (u.pathname.includes(objectMarker)) {
      objectPath = u.pathname.slice(u.pathname.indexOf(objectMarker) + objectMarker.length);
    } else {
      return src;
    }

    const params = new URLSearchParams();
    if (opts.width) params.set("width", String(Math.round(opts.width)));
    if (opts.height) params.set("height", String(Math.round(opts.height)));
    if (opts.quality) params.set("quality", String(Math.round(opts.quality)));
    if (opts.resize) params.set("resize", opts.resize);

    const qs = params.toString();
    return `${u.origin}${renderMarker}${objectPath}${qs ? `?${qs}` : ""}`;
  } catch {
    return src;
  }
}

/** URL lista para `<Image />` según contexto (tarjeta, miniatura, hero, banner). */
export function productDisplayImageUrl(
  src: string | null | undefined,
  size: ProductImageSize = "card",
): string | null {
  if (!src) return null;
  const preset = PRESETS[size];
  return storageImageTransformUrl(src, preset) ?? src;
}

/** Precarga imagen hero al hover en tarjetas (navegación hacia PDP). */
export function prefetchProductHeroImage(src: string | null | undefined): void {
  if (!src || typeof window === "undefined") return;
  const href = productDisplayImageUrl(src, "hero");
  if (!href) return;
  const id = `prefetch-hero-${href}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "prefetch";
  link.as = "image";
  link.href = href;
  document.head.appendChild(link);
}

/** Localhost: sin optimizador de Next. Producción CDN ya redimensionada: tampoco. */
export function shouldUseUnoptimizedImage(src: string | null | undefined): boolean {
  if (!src) return false;
  return (
    shouldUnoptimizeStorageImageUrl(src) || isTransformedStorageImageUrl(src)
  );
}
