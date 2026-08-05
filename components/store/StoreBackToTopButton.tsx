"use client";

import { ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 420;

function isBrowsePath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/products");
}

/** Botón flotante para volver al inicio en home y catálogo / ficha. */
export function StoreBackToTopButton() {
  const pathname = usePathname();
  const enabled = isBrowsePath(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`fixed right-[max(1rem,env(safe-area-inset-right))] z-[100] flex size-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.35)] transition-[opacity,transform,background-color] duration-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2 lg:right-6 lg:size-12 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.25rem)] lg:bottom-[calc(1.5rem+4.5rem)] ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
    >
      <ChevronUp className="size-5" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
