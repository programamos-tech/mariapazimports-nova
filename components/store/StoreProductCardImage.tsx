"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
  STORE_PRODUCT_CARD_IMAGE_PREFETCH_MARGIN,
} from "@/lib/store-product-card-image";

export type StoreProductCardGalleryItem = {
  src: string;
  srcSet?: string | null;
};

type Props = {
  src: string | null;
  srcSet?: string | null;
  hoverSrc?: string | null;
  hoverSrcSet?: string | null;
  /** Si hay 2+, rota las fotos del producto en la card. */
  gallery?: StoreProductCardGalleryItem[];
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
      decoding="async"
    />
  );
}

const IMAGE_FADE =
  "transition-opacity duration-500 ease-out motion-reduce:transition-none";

const GALLERY_INTERVAL_MS = 3200;

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
  gallery,
  alt,
  sizes,
  outOfStock = false,
  placeholderClassName = "text-3xl text-stone-200",
  priority = false,
}: Props) {
  const slides =
    gallery && gallery.length > 1
      ? gallery
      : src
        ? [{ src, srcSet }]
        : [];
  const canCycle = slides.length > 1;

  const [index, setIndex] = useState(0);
  const [hoverActive, setHoverActive] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { ref, prefetch } = usePrefetchWhenNear(priority);

  const onIntersect = useEffectEvent((entry: IntersectionObserverEntry) => {
    setInView(entry.isIntersecting);
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canCycle) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) onIntersect(entry);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canCycle, ref]);

  useEffect(() => {
    if (!canCycle || !inView || reduceMotion || hoverActive) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, GALLERY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [canCycle, inView, reduceMotion, hoverActive, slides.length]);

  const activateHover = useCallback(() => {
    if (hoverSrc || canCycle) setHoverActive(true);
  }, [hoverSrc, canCycle]);

  const deactivateHover = useCallback(() => {
    setHoverActive(false);
  }, []);

  const shouldLoad = slides.length > 0 && (priority || prefetch);
  const active = slides[Math.min(index, slides.length - 1)];
  const hoverSlide =
    hoverSrc && !canCycle
      ? { src: hoverSrc, srcSet: hoverSrcSet }
      : null;
  const showHover = Boolean(hoverActive && hoverSlide);

  return (
    <div
      ref={ref}
      className={`group/image relative w-full shrink-0 overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS} transition-colors duration-300 ${outOfStock ? "opacity-[0.78]" : ""}`}
      onMouseEnter={activateHover}
      onMouseLeave={deactivateHover}
      onFocus={activateHover}
      onBlur={deactivateHover}
    >
      {shouldLoad && active ? (
        <>
          {slides.map((slide, i) => {
            const isActive = !showHover && i === index;
            const isNear = Math.abs(i - index) <= 1 || i === 0;
            if (!isNear && !isActive) return null;
            return (
              <CardPhoto
                key={`${slide.src}-${i}`}
                src={slide.src}
                srcSet={slide.srcSet}
                sizes={sizes}
                alt={i === 0 ? alt : ""}
                className={`${STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS} ${STORE_PRODUCT_IMAGE_IMG_CLASS} ${IMAGE_FADE} ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                priority={priority && i === 0}
                fetchPriority={priority && i === 0 ? "high" : "auto"}
                loading={priority && i === 0 ? "eager" : "lazy"}
                hidden={!isActive}
              />
            );
          })}
          {showHover && hoverSlide ? (
            <CardPhoto
              src={hoverSlide.src}
              srcSet={hoverSlide.srcSet}
              sizes={sizes}
              alt=""
              className={`${STORE_PRODUCT_CARD_IMAGE_LAYER_CLASS} ${STORE_PRODUCT_IMAGE_IMG_CLASS} ${IMAGE_FADE}`}
              fetchPriority="low"
              loading="lazy"
              hidden
            />
          ) : null}
          {canCycle ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-2 z-[1] flex justify-center gap-1"
              aria-hidden
            >
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`size-1 rounded-full transition ${
                    i === index ? "bg-stone-800" : "bg-stone-300/90"
                  }`}
                />
              ))}
            </div>
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
