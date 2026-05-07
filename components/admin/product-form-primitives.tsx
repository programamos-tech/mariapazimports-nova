"use client";

import { useEffect, useState } from "react";
import {
  formatCopInputGrouping,
  parseCopInputDigitsToInt,
} from "@/lib/money";

export const productLabelClass =
  "mb-1.5 block text-sm font-medium text-zinc-900";
/** Superficie blanca sobre el workspace del admin (`bg-white`). */
export const productInputOnWhiteClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300/50";

export const productInputClass = productInputOnWhiteClass;

export const productSectionTitle =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400";

export function ProductMoneyInput({
  name,
  value,
  onChange,
  required,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
  required?: boolean;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const [text, setText] = useState(() => formatCopInputGrouping(safe));

  useEffect(() => {
    setText(formatCopInputGrouping(safe));
  }, [safe]);

  return (
    <div className="flex rounded-lg border border-zinc-200 bg-white shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-300/50">
      <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-600">
        $
      </span>
      <input type="hidden" name={name} value={String(safe)} required={required} />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-required={required}
        placeholder="0"
        value={text}
        onChange={(e) => {
          const n = parseCopInputDigitsToInt(e.target.value);
          onChange(n);
          setText(n <= 0 ? "" : formatCopInputGrouping(n));
        }}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm tabular-nums text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

/** Stock y otras cantidades enteras: como dinero pero sin prefijo $; miles con punto (es-CO). */
export function ProductQuantityInput({
  id,
  name,
  value,
  onChange,
  required,
}: {
  id?: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  required?: boolean;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const [text, setText] = useState(() => formatCopInputGrouping(safe));

  useEffect(() => {
    setText(formatCopInputGrouping(safe));
  }, [safe]);

  return (
    <>
      <input type="hidden" name={name} value={String(safe)} required={required} />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-required={required}
        placeholder="0"
        value={text}
        onChange={(e) => {
          const n = parseCopInputDigitsToInt(e.target.value);
          onChange(n);
          setText(n <= 0 ? "" : formatCopInputGrouping(n));
        }}
        className={productInputClass}
      />
    </>
  );
}
