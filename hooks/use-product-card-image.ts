"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  productImageRecoveryUrl,
  resolveProductCardImageUrl,
} from "@/lib/product-demo-image";

/**
 * Imagen de tarjeta: Storage / URL real primero; si falla el `<Image>`, sustituye por foto de respaldo (Unsplash).
 */
export function useProductCardImageWithFallback(
  productId: string,
  imagePath: string | null | undefined,
) {
  const initial = resolveProductCardImageUrl(productId, imagePath);
  const recovery = productImageRecoveryUrl(productId);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [productId, imagePath, initial]);

  const src = useMemo(() => {
    if (!loadFailed) return initial;
    if (recovery !== initial) return recovery;
    return null;
  }, [loadFailed, initial, recovery]);

  const onError = useCallback(() => {
    setLoadFailed(true);
  }, []);

  return { src, onError };
}
