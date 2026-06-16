import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export type ProductImageSize = "card" | "thumb" | "hero" | "banner";

/** Tarjeta 4:5 — srcSet hasta 1920w para pantallas Full HD / retina. */
const CARD_SRCSET_TIERS = [
  { width: 640, height: 800 },
  { width: 960, height: 1200 },
  { width: 1280, height: 1600 },
  { width: 1920, height: 2400 },
] as const;

/** PDP 4:5 — srcSet hasta 1920w (cubre Full HD / retina sin sobrepeso). */
const HERO_SRCSET_TIERS = [
  { width: 960, height: 1200 },
  { width: 1440, height: 1800 },
  { width: 1920, height: 2400 },
] as const;

const PRESETS: Record<
  ProductImageSize,
  {
    width?: number;
    height?: number;
    quality: number;
    resize?: "cover" | "contain" | "fill";
    format?: "origin";
  }
> = {
  card: {
    width: CARD_SRCSET_TIERS[3].width,
    height: CARD_SRCSET_TIERS[3].height,
    quality: 98,
    resize: "contain",
    format: "origin",
  },
  thumb: {
    width: 256,
    height: 256,
    quality: 90,
    resize: "contain",
    format: "origin",
  },
  /** Reservado; en PDP usamos el archivo original sin transformar. */
  hero: {
    width: 2500,
    height: 3125,
    quality: 95,
    resize: "contain",
    format: "origin",
  },
  banner: {
    width: 2500,
    quality: 92,
    format: "origin",
  },
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

/** URL pública sin resize (máxima calidad en ficha de producto). */
export function storageOriginalObjectUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  try {
    const u = new URL(src);
    const renderMarker = "/storage/v1/render/image/public/";
    const objectMarker = "/storage/v1/object/public/";

    if (u.pathname.includes(renderMarker)) {
      const objectPath = u.pathname.slice(
        u.pathname.indexOf(renderMarker) + renderMarker.length,
      );
      return `${u.origin}${objectMarker}${objectPath}`;
    }
    if (u.pathname.includes(objectMarker)) {
      return src;
    }
    return src;
  } catch {
    return src;
  }
}

/**
 * Convierte URL pública de Storage a `/render/image/public/...` con tamaño y calidad.
 */
export function storageImageTransformUrl(
  src: string | null | undefined,
  opts: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: "cover" | "contain" | "fill";
    format?: "origin";
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
    if (opts.format) params.set("format", opts.format);

    const qs = params.toString();
    return `${u.origin}${renderMarker}${objectPath}${qs ? `?${qs}` : ""}`;
  } catch {
    return src;
  }
}

/** Vitrina: archivo original en Storage (misma URL que al abrir en pestaña nueva). */
export function productStorefrontImageUrl(
  src: string | null | undefined,
): string | null {
  if (!src) return null;
  return storageOriginalObjectUrl(src) ?? src;
}

/** Encaja el producto en 4:5 (contain + márgenes blancos en el archivo, sin bandas en CSS). */
function productFrameImageSources(
  src: string | null | undefined,
  tiers: readonly { width: number; height: number }[],
  quality: number,
): { src: string | null; srcSet: string | null } {
  if (!src) return { src: null, srcSet: null };

  const fallback = productStorefrontImageUrl(src);
  if (!shouldUseStorageImageTransform(src)) {
    return { src: fallback, srcSet: null };
  }

  const resize = "contain" as const;

  // Sin `format` para que Supabase sirva WebP/AVIF automáticamente (Accept header).
  // No baja calidad: mismos píxeles en un códec más liviano.
  const entries = tiers.map(({ width, height }) => {
    const url =
      storageImageTransformUrl(src, {
        width,
        height,
        quality,
        resize,
      }) ?? fallback;
    return `${url} ${width}w`;
  });

  const unique = [...new Set(entries)];
  const largest = tiers[tiers.length - 1]!;
  const srcUrl =
    storageImageTransformUrl(src, {
      width: largest.width,
      height: largest.height,
      quality,
      resize,
    }) ?? fallback;

  if (unique.length <= 1) {
    return { src: srcUrl, srcSet: null };
  }

  return {
    src: srcUrl,
    srcSet: unique.join(", "),
  };
}

/** Ficha de producto: 4:5 contain en HD (producto completo, marco lleno). */
export function productHeroImageSources(src: string | null | undefined): {
  src: string | null;
  srcSet: string | null;
} {
  return productFrameImageSources(src, HERO_SRCSET_TIERS, 100);
}

/** URL principal del hero PDP. */
export function productHeroImageUrl(src: string | null | undefined): string | null {
  const { src: display } = productHeroImageSources(src);
  return display ?? productStorefrontImageUrl(src);
}

/** URL lista para `<Image />` según contexto (tarjeta, miniatura, banner). */
export function productDisplayImageUrl(
  src: string | null | undefined,
  size: ProductImageSize = "card",
): string | null {
  if (!src) return null;
  if (size === "hero") {
    return productHeroImageUrl(src);
  }
  const preset = PRESETS[size];
  return storageImageTransformUrl(src, preset) ?? src;
}

/** Tarjetas: 4:5 contain + srcSet retina (producto completo, sin bandas laterales). */
export function productCardImageSources(src: string | null | undefined): {
  src: string | null;
  srcSet: string | null;
} {
  return productFrameImageSources(src, CARD_SRCSET_TIERS, PRESETS.card.quality);
}

/** Precarga imagen hero al hover en tarjetas (navegación hacia PDP). */
export function prefetchProductHeroImage(src: string | null | undefined): void {
  if (!src || typeof window === "undefined") return;
  const href = productHeroImageUrl(src);
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

/** Evita doble compresión: Storage (original o transform) no pasa por `/_next/image`. */
export function shouldUseUnoptimizedImage(src: string | null | undefined): boolean {
  if (!src) return false;
  if (shouldUnoptimizeStorageImageUrl(src)) return true;
  if (isTransformedStorageImageUrl(src)) return true;
  if (shouldUseStorageImageTransform(src) && src.includes("/storage/v1/object/public/")) {
    return true;
  }
  return false;
}
