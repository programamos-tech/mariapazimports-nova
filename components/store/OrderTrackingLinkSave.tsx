"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

export function OrderTrackingLinkSave({ trackingUrl }: { trackingUrl: string }) {
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
    <section className="rounded-xl border border-stone-200 bg-[#faf8f5] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
        Guarda este enlace
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Consulta el estado de tu pedido cuando quieras. Cópialo y guárdalo en tus
        notas o favoritos.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <p className="min-w-0 flex-1 break-all rounded-lg border border-stone-200 bg-white px-3 py-2.5 font-mono text-xs text-stone-800 sm:text-[13px]">
          {trackingUrl}
        </p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-stone-900 bg-stone-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-stone-800"
        >
          {copied ? (
            <>
              <Check className="size-3.5" strokeWidth={2.25} aria-hidden />
              Copiado
            </>
          ) : (
            <>
              <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
              Copiar enlace
            </>
          )}
        </button>
      </div>
    </section>
  );
}
