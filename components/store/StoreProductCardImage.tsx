"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { shouldUseUnoptimizedImage } from "@/lib/storage-image-url";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS,
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

  const activateHover = useCallback(() => {
    if (hoverSrc) setHoverActive(true);
  }, [hoverSrc]);

  return (
    <div
      className={`group/image relative w-full shrink-0 overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS} transition-colors duration-300 ${outOfStock ? "opacity-[0.78]" : ""}`}
      onMouseEnter={activateHover}
      onFocus={activateHover}
    >
      {src ? (
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
            loading={priority ? undefined : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
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
              unoptimized={shouldUseUnoptimizedImage(hoverSrc)}
            />
          ) : null}
        </>
      ) : (
        <span
          className={`flex size-full items-center justify-center ${placeholderClassName}`}
        >
          ◆
        </span>
      )}
    </div>
  );
}
