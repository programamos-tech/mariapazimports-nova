"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { shouldUseUnoptimizedImage } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN,
} from "@/lib/store-product-card-image";

type Props = {
  src: string | null;
  hoverSrc?: string | null;
  alt: string;
  sizes: string;
  outOfStock?: boolean;
  placeholderClassName?: string;
  /** Primera fila del catálogo: evita lazy y prioriza descarga. */
  priority?: boolean;
};

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

/** Imagen de tarjeta de catálogo: aspecto 4:5; hover carga la 2.ª foto solo al pasar el mouse. */
export function StoreProductCardImage({
  src,
  hoverSrc,
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
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={`${STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS} ${IMAGE_FADE} ${
              hoverActive && hoverSrc ? "opacity-0" : "opacity-100"
            }`}
            priority={priority}
            loading={priority ? undefined : "eager"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            unoptimized={shouldUseUnoptimizedImage(src)}
          />
          {hoverActive && hoverSrc ? (
            <Image
              src={hoverSrc}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className={`${STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS} ${IMAGE_FADE}`}
              loading="lazy"
              fetchPriority="low"
              decoding="async"
              unoptimized={shouldUseUnoptimizedImage(hoverSrc)}
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
