import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export type ProductImageSize = "card" | "thumb" | "hero" | "banner";

/**
 * Miniaturas / badges — único caso donde conviene un resize agresivo.
 */
const THUMB = { width: 256, height: 256, quality: 80, resize: "contain" as const };

/** Banner: srcSet Full HD; calidad alta (no productos). */
const BANNER_SRCSET_WIDTHS = [1280, 1920, 2560] as const;
const BANNER_QUALITY = 88;

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
  card: { quality: 100 },
  thumb: THUMB,
  hero: { quality: 100 },
  banner: { width: 1920, quality: BANNER_QUALITY },
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

/** URL pública sin resize (máxima calidad en vitrina y ficha). */
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

/** Archivo original en Storage (sin imgproxy). */
export function productStorefrontImageUrl(
  src: string | null | undefined,
): string | null {
  if (!src) return null;
  return storageOriginalObjectUrl(src) ?? src;
}

/**
 * Productos (tarjeta / PDP): siempre el original.
 * El render de Storage reencoda a WebP chico y destroza etiquetas/detalle.
 */
export function productCardImageSources(src: string | null | undefined): {
  src: string | null;
  srcSet: string | null;
} {
  const url = productStorefrontImageUrl(src);
  return { src: url, srcSet: null };
}

export function productHeroImageSources(src: string | null | undefined): {
  src: string | null;
  srcSet: string | null;
} {
  const url = productStorefrontImageUrl(src);
  return { src: url, srcSet: null };
}

export function productHeroImageUrl(src: string | null | undefined): string | null {
  return productHeroImageSources(src).src ?? productStorefrontImageUrl(src);
}

/** Banner / hero carousel: srcSet ancho (no productos). */
export function bannerImageSources(src: string | null | undefined): {
  src: string | null;
  srcSet: string | null;
} {
  if (!src) return { src: null, srcSet: null };

  const fallback = productStorefrontImageUrl(src);
  if (!shouldUseStorageImageTransform(src)) {
    return { src: fallback, srcSet: null };
  }

  const entries = BANNER_SRCSET_WIDTHS.map((width) => {
    const url =
      storageImageTransformUrl(src, { width, quality: BANNER_QUALITY }) ??
      fallback;
    return `${url} ${width}w`;
  });
  const unique = [...new Set(entries)];
  const largest = BANNER_SRCSET_WIDTHS[BANNER_SRCSET_WIDTHS.length - 1]!;
  const srcUrl =
    storageImageTransformUrl(src, {
      width: largest,
      quality: BANNER_QUALITY,
    }) ?? fallback;

  if (unique.length <= 1) {
    return { src: srcUrl, srcSet: null };
  }

  return { src: srcUrl, srcSet: unique.join(", ") };
}

/** URL lista para `<Image />` según contexto (tarjeta, miniatura, banner). */
export function productDisplayImageUrl(
  src: string | null | undefined,
  size: ProductImageSize = "card",
): string | null {
  if (!src) return null;
  if (size === "hero" || size === "card") {
    return productStorefrontImageUrl(src);
  }
  if (size === "banner") {
    return bannerImageSources(src).src;
  }
  const preset = PRESETS[size];
  return storageImageTransformUrl(src, preset) ?? src;
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
