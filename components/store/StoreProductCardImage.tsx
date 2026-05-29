"use client";

import Image from "next/image";
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
};

const IMAGE_FADE =
  "transition-opacity duration-300 ease-out motion-reduce:transition-none";

/** Imagen de tarjeta de catálogo: aspecto 4:5; hover muestra segunda imagen si existe. */
export function StoreProductCardImage({
  src,
  hoverSrc,
  alt,
  sizes,
  outOfStock = false,
  placeholderClassName = "text-3xl text-stone-200",
}: Props) {
  const hasHover = Boolean(hoverSrc);

  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS} transition-colors duration-300 ${outOfStock ? "opacity-[0.78]" : ""}`}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={`${STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS} ${IMAGE_FADE} ${
              hasHover
                ? "group-hover/image:opacity-0 group-focus-within/image:opacity-0"
                : ""
            }`}
            loading="lazy"
            unoptimized={shouldUseUnoptimizedImage(src)}
          />
          {hoverSrc ? (
            <Image
              src={hoverSrc}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className={`${STORE_PRODUCT_CARD_IMAGE_OBJECT_CLASS} ${IMAGE_FADE} opacity-0 group-hover/image:opacity-100 group-focus-within/image:opacity-100`}
              loading="lazy"
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
