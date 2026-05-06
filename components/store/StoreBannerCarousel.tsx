"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { shouldUnoptimizeStorageImageUrl, storagePublicObjectUrl } from "@/lib/storage-public-url";

export type StoreBannerSlide = {
  id: string;
  image_path: string;
  href: string | null;
  alt_text: string | null;
};

type Props = {
  slides: StoreBannerSlide[];
  variant: "hero" | "products";
  autoMs?: number;
  className?: string;
};

function SlideFrame({
  src,
  alt,
  variant,
  priority,
}: {
  src: string;
  alt: string;
  variant: "hero" | "products";
  priority?: boolean;
}) {
  const frame =
    variant === "hero"
      ? "relative aspect-[4/3] max-h-[420px] w-full"
      : "relative aspect-[21/9] min-h-[140px] w-full max-h-[280px] sm:max-h-[320px]";

  return (
    <div className={frame}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={
          variant === "hero"
            ? "(max-width: 1024px) 100vw, 420px"
            : "(max-width: 768px) 100vw, 896px"
        }
        unoptimized={shouldUnoptimizeStorageImageUrl(src)}
        priority={priority}
      />
    </div>
  );
}

export function StoreBannerCarousel({
  slides,
  variant,
  autoMs = 5500,
  className = "",
}: Props) {
  const [index, setIndex] = useState(0);
  const n = slides.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        if (n <= 0) return 0;
        return (i + delta + n) % n;
      });
    },
    [n],
  );

  useEffect(() => {
    if (n <= 1 || autoMs <= 0) return;
    const t = setInterval(() => go(1), autoMs);
    return () => clearInterval(t);
  }, [n, autoMs, go]);

  if (n === 0) return null;

  const current = slides[index]!;
  const url = storagePublicObjectUrl(current.image_path);
  if (!url) return null;

  const alt =
    current.alt_text?.trim() ||
    (variant === "hero" ? "Banner principal" : "Promoción en productos");

  const shell =
    variant === "hero"
      ? "relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200/70"
      : "relative w-full overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200/70";

  const slideBlock =
    current.href != null && current.href.trim().length > 0 ? (
      <Link href={current.href.trim()} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7f6a] focus-visible:ring-offset-2">
        <SlideFrame src={url} alt={alt} variant={variant} priority={index === 0} />
      </Link>
    ) : (
      <SlideFrame src={url} alt={alt} variant={variant} priority={index === 0} />
    );

  return (
    <div className={`${shell} ${className}`}>
      {slideBlock}

      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-stone-700 shadow-md ring-1 ring-stone-200/80 transition hover:bg-white"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-stone-700 shadow-md ring-1 ring-stone-200/80 transition hover:bg-white"
            aria-label="Siguiente"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition ${i === index ? "w-6 bg-white shadow-sm" : "w-2 bg-white/55 hover:bg-white/85"}`}
                aria-label={`Ir al banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
