"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

export function OrderTrackingLinkSave({
  trackingUrl,
  dense = false,
}: {
  trackingUrl: string;
  dense?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback silencioso */
    }
  }, [trackingUrl]);

  return (
    <section
      className={
        dense
          ? "border-t border-stone-200 pt-5"
          : "border-t border-stone-200 pt-10"
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
        Enlace de seguimiento
      </p>
      <p
        className={
          dense
            ? "mt-1 text-xs leading-relaxed text-stone-500"
            : "mt-2 text-sm leading-relaxed text-stone-500"
        }
      >
        Guárdalo para consultar el estado del pedido.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <p className="min-w-0 flex-1 break-all border border-stone-200 bg-white px-3 py-2 font-mono text-xs text-stone-800">
          {trackingUrl}
        </p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex shrink-0 items-center justify-center gap-2 border border-stone-900 bg-stone-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-stone-800"
        >
          {copied ? (
            <>
              <Check className="size-3.5" strokeWidth={2.25} aria-hidden />
              Copiado
            </>
          ) : (
            <>
              <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
              Copiar
            </>
          )}
        </button>
      </div>
    </section>
  );
}
