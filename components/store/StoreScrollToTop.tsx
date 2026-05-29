"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

function scrollWindowToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Restablece scroll al inicio en cada navegación del storefront. */
export function StoreScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    scrollWindowToTop();
  }, [pathname]);

  useEffect(() => {
    const id = window.requestAnimationFrame(scrollWindowToTop);
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
