"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { STORE_HEADER_ICON_STROKE } from "@/lib/store-header-icons";

const EDGE_EPS = 4;

/** Reserva inferior = bloque de texto bajo la imagen 4/5 en tarjeta editorial. */
const CARD_TEXT_RESERVE = "h-[7.5rem]";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CatalogRowScroller({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setCanLeft(scrollLeft > EDGE_EPS);
    setCanRight(scrollLeft < maxScroll - EDGE_EPS);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateArrows();
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);
    const t = window.requestAnimationFrame(() => updateArrows());
    return () => {
      window.cancelAnimationFrame(t);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateArrows]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const delta = Math.max(200, Math.floor(el.clientWidth * 0.82));
    el.scrollBy({
      left: dir * delta,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const arrowBtnClass =
    "flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-stone-700 shadow-sm transition hover:bg-white hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 sm:size-10";

  function ArrowRail({
    dir,
    canScroll,
  }: {
    dir: -1 | 1;
    canScroll: boolean;
  }) {
    const isPrev = dir === -1;
    return (
      <div className="flex min-h-0 w-9 shrink-0 flex-col sm:w-10">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <button
            type="button"
            aria-label={isPrev ? "Anteriores" : "Siguientes"}
            aria-hidden={!canScroll}
            tabIndex={canScroll ? 0 : -1}
            disabled={!canScroll}
            onClick={() => scrollByDir(dir)}
            className={`${arrowBtnClass} ${
              canScroll ? "" : "invisible pointer-events-none"
            }`}
          >
            {isPrev ? (
              <ChevronLeft
                className="size-5 sm:size-[1.35rem]"
                strokeWidth={STORE_HEADER_ICON_STROKE}
                aria-hidden
              />
            ) : (
              <ChevronRight
                className="size-5 sm:size-[1.35rem]"
                strokeWidth={STORE_HEADER_ICON_STROKE}
                aria-hidden
              />
            )}
          </button>
        </div>
        <div className={`${CARD_TEXT_RESERVE} shrink-0`} aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-2 sm:gap-3 ${className}`.trim()}
    >
      <ArrowRail dir={-1} canScroll={canLeft} />

      <div
        ref={ref}
        className="store-cart-suggestions-scroll flex min-w-0 snap-x snap-mandatory gap-3 overscroll-x-contain scroll-px-1 pb-1 pt-0.5 sm:gap-4 sm:scroll-px-2 lg:gap-5"
      >
        {children}
      </div>

      <ArrowRail dir={1} canScroll={canRight} />
    </div>
  );
}
