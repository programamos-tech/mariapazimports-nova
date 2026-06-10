"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN,
} from "@/lib/store-product-card-image";

type Props = {
  src: string | null;
  srcSet?: string | null;
  hoverSrc?: string | null;
  hoverSrcSet?: string | null;
  alt: string;
  sizes: string;
  outOfStock?: boolean;
  placeholderClassName?: string;
  /** Primera fila del catálogo: evita lazy y prioriza descarga. */
  priority?: boolean;
};

function CardPhoto({
  src,
  srcSet,
  sizes,
  alt,
  className,
  priority = false,
  fetchPriority = "auto",
  loading,
  hidden = false,
}: {
  src: string;
  srcSet?: string | null;
  sizes: string;
  alt: string;
  className: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto" | "low";
  loading?: "eager" | "lazy";
  hidden?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 4:5 contain desde Supabase
    <img
      src={src}
      srcSet={srcSet ?? undefined}
      sizes={sizes}
      alt={alt}
      aria-hidden={hidden || undefined}
      className={className}
      loading={loading ?? (priority ? "eager" : "lazy")}
      fetchPriority={fetchPriority}
      decoding={priority ? "sync" : "async"}
    />
  );
}

const IMAGE_FADE =
  "transition-opacity duration-300 ease-out motion-reduce:transition-none";

function usePrefetchWhenNear(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [prefetch, setPrefetch] = useState(enabled);

  useEffect(() => {
    if (prefetch) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPrefetch(true);
          io.disconnect();
        }
      },
      { rootMargin: STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [prefetch]);

  return { ref, prefetch };
}

/** Imagen de tarjeta: marco 4:5 lleno, producto completo en HD. */
export function StoreProductCardImage({
  src,
  srcSet,
  hoverSrc,
  hoverSrcSet,
  alt,
  sizes,
  outOfStock = false,
  placeholderClassName = "text-3xl text-stone-200",
  priority = false,
}: Props) {
  const [hoverActive, setHoverActive] = useState(false);
  const { ref, prefetch } = usePrefetchWhenNear(priority);

  const activateHover = useCallback(() => {
    if (hoverSrc) setHoverActive(true);
  }, [hoverSrc]);

  const shouldLoad = Boolean(src) && (priority || prefetch);

  return (
    <div
      ref={ref}
      className={`group/image relative w-full shrink-0 overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS} transition-colors duration-300 ${outOfStock ? "opacity-[0.78]" : ""}`}
      onMouseEnter={activateHover}
      onFocus={activateHover}
    >
      {src && shouldLoad ? (
        <>
          <CardPhoto
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={`${STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS} ${STORE_PRODUCT_IMAGE_IMG_CLASS} ${IMAGE_FADE} ${
              hoverActive && hoverSrc ? "opacity-0" : "opacity-100"
            }`}
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
          />
          {hoverActive && hoverSrc ? (
            <CardPhoto
              src={hoverSrc}
              srcSet={hoverSrcSet}
              sizes={sizes}
              alt=""
              className={`${STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS} ${STORE_PRODUCT_IMAGE_IMG_CLASS} ${IMAGE_FADE}`}
              fetchPriority="low"
              loading="lazy"
              hidden
            />
          ) : null}
        </>
      ) : src ? null : (
        <span
          className={`flex size-full items-center justify-center ${placeholderClassName}`}
        >
          ◆
        </span>
      )}
    </div>
  );
}
