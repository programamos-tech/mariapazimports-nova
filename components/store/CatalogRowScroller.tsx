"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { STORE_HEADER_ICON_STROKE } from "@/lib/store-header-icons";

const GAP_PX = 20;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cardsPerViewForWidth(width: number): number {
  if (width < 480) return 2;
  if (width < 768) return 3;
  if (width < 1100) return 4;
  return 5;
}

/**
 * Carrusel por páginas: el viewport solo muestra cards completas (nunca cortadas).
 */
export function CatalogRowScroller({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  /** @deprecated Ya no se usa; se mantiene por compatibilidad de llamadas. */
  textReserveClass?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const count = items.length;

  const [viewportW, setViewportW] = useState(0);
  const [perView, setPerView] = useState(2);
  const [page, setPage] = useState(0);
  const [motionOk, setMotionOk] = useState(true);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    setViewportW(w);
    setPerView(Math.min(count, cardsPerViewForWidth(w)));
  }, [count]);

  useEffect(() => {
    setMotionOk(!prefersReducedMotion());
    measure();
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const maxPage = Math.max(0, Math.ceil(count / Math.max(perView, 1)) - 1);

  useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [maxPage]);

  const cardW =
    viewportW > 0 && perView > 0
      ? (viewportW - GAP_PX * (perView - 1)) / perView
      : 0;

  const offsetPx = page * perView * (cardW + GAP_PX);
  const canLeft = page > 0;
  const canRight = page < maxPage;
  const posterH = cardW > 0 ? cardW * (5 / 4) : undefined;

  const go = (dir: -1 | 1) => {
    setPage((p) => Math.min(maxPage, Math.max(0, p + dir)));
  };

  const arrowBtnClass =
    "flex w-7 shrink-0 items-center justify-center self-start text-stone-900 transition hover:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 disabled:pointer-events-none disabled:opacity-0 sm:w-8";

  if (count === 0) return null;

  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-1 sm:gap-2 ${className}`.trim()}
    >
      <button
        type="button"
        aria-label="Anteriores"
        disabled={!canLeft}
        onClick={() => go(-1)}
        className={`${arrowBtnClass} ${canLeft ? "" : "invisible"}`}
        style={{ height: posterH, marginTop: "0.125rem" }}
      >
        <ChevronLeft
          className="size-7 sm:size-8"
          strokeWidth={STORE_HEADER_ICON_STROKE}
          aria-hidden
        />
      </button>

      <div ref={viewportRef} className="min-w-0 overflow-hidden">
        <div
          className="flex"
          style={{
            gap: GAP_PX,
            transform:
              cardW > 0 ? `translate3d(-${offsetPx}px, 0, 0)` : undefined,
            transition: motionOk
              ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
              : undefined,
          }}
        >
          {items.map((child, i) => (
            <div
              key={
                isValidElement(child) && child.key != null
                  ? String(child.key)
                  : i
              }
              className="min-w-0 shrink-0"
              style={{
                width: cardW > 0 ? cardW : undefined,
                flex: cardW > 0 ? `0 0 ${cardW}px` : "0 0 42%",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Siguientes"
        disabled={!canRight}
        onClick={() => go(1)}
        className={`${arrowBtnClass} ${canRight ? "" : "invisible"}`}
        style={{ height: posterH, marginTop: "0.125rem" }}
      >
        <ChevronRight
          className="size-7 sm:size-8"
          strokeWidth={STORE_HEADER_ICON_STROKE}
          aria-hidden
        />
      </button>
    </div>
  );
}
