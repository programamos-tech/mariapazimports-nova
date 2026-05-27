"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FlashKind = "updated" | "created" | "saved" | "uploadError" | null;

type Props = {
  saved: boolean;
  uploadError: boolean;
  /** Producto editado (resaltado en el listado). */
  updatedProductId?: string | null;
  /** Producto recién creado. */
  createdProductId?: string | null;
  /** Quita `saved` y `uploadError`; mantiene `updated`/`created` si aplica. */
  cleanHref: string;
  /** Quita también `updated`/`created` tras el resaltado. */
  fullyCleanHref: string;
};

function resolveFlashKind(props: Props): FlashKind {
  if (props.uploadError) return "uploadError";
  if (props.updatedProductId) return "updated";
  if (props.createdProductId) return "created";
  if (props.saved) return "saved";
  return null;
}

export function AdminProductsFlashToast({
  saved,
  uploadError,
  updatedProductId,
  createdProductId,
  cleanHref,
  fullyCleanHref,
}: Props) {
  const router = useRouter();
  const kind = resolveFlashKind({
    saved,
    uploadError,
    updatedProductId,
    createdProductId,
    cleanHref,
    fullyCleanHref,
  });
  const [visible, setVisible] = useState(kind !== null);
  const replacedToast = useRef(false);
  const replacedHighlight = useRef(false);

  useEffect(() => {
    if (kind === null || replacedToast.current) return;
    replacedToast.current = true;
    router.replace(cleanHref, { scroll: false });
  }, [kind, cleanHref, router]);

  useEffect(() => {
    const highlightId = updatedProductId ?? createdProductId;
    if (!highlightId || replacedHighlight.current) return;
    replacedHighlight.current = true;
    const t = window.setTimeout(() => {
      router.replace(fullyCleanHref, { scroll: false });
    }, 8200);
    return () => window.clearTimeout(t);
  }, [updatedProductId, createdProductId, fullyCleanHref, router]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (kind === null || !visible) return null;

  if (kind === "uploadError") {
    return (
      <div
        role="status"
        className="fixed bottom-5 right-5 z-[100] max-w-[min(22rem,calc(100vw-2.5rem))] rounded-lg border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-lg shadow-zinc-900/10 dark:border-amber-800/60 dark:bg-amber-950/90 dark:text-amber-100"
      >
        Producto guardado · la imagen no se subió. Edita el producto y vuelve a
        intentar.
      </div>
    );
  }

  const message =
    kind === "updated"
      ? "Producto actualizado"
      : kind === "created"
        ? "Producto creado"
        : "¡Guardado!";

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-zinc-900/10 dark:border-emerald-800/60 dark:bg-emerald-950/90 dark:text-emerald-100"
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white"
        aria-hidden
      >
        ✓
      </span>
      {message}
    </div>
  );
}
