"use client";

import { useEffect, useState } from "react";
import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

/** Tiempo mínimo visible para que no parpadee en recargas rápidas (F5). */
const MIN_VISIBLE_MS = 720;

/**
 * Al entrar o recargar la tienda, muestra el mismo splash que `loading.tsx`
 * hasta `window.load` (o document ya completo) + un mínimo de tiempo.
 * `loading.tsx` del App Router casi no se ve en recarga completa; esto sí.
 */
export function StoreEntranceSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();

    const hide = () => {
      if (cancelled) return;
      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, wait);
    };

    const onReady = () => {
      window.clearTimeout(safety);
      hide();
    };

    let safety = window.setTimeout(onReady, 5000);

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      window.removeEventListener("load", onReady);
    };
  }, []);

  if (!visible) return null;

  return <StoreLoadingScreen overlayZClass="z-[300]" />;
}
