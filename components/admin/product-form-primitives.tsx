"use client";

import { useEffect, useState } from "react";
import { DatePickerField } from "@/components/date-picker/DatePickerField";
import {
  formatCopInputGrouping,
  parseCopInputDigitsToInt,
} from "@/lib/money";

export const productLabelClass =
  "mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100";
/** Superficie blanca sobre el workspace del admin (`bg-white`). */
export const productInputOnWhiteClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:shadow-none dark:focus:border-zinc-500 dark:focus:ring-zinc-600/40";

export const productInputClass = productInputOnWhiteClass;

export const productSectionTitle =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500";

export function ProductMoneyInput({
  name,
  value,
  onChange,
  required,
  disabled,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const [text, setText] = useState(() => formatCopInputGrouping(safe));

  useEffect(() => {
    setText(formatCopInputGrouping(safe));
  }, [safe]);

  return (
    <div
      className={
        disabled
          ? "flex cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100/80 opacity-80 shadow-none dark:border-zinc-700 dark:bg-zinc-800/80"
          : "flex rounded-lg border border-zinc-200 bg-white shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-950/80 dark:shadow-none dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-600/40"
      }
    >
      <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
        $
      </span>
      <input type="hidden" name={name} value={String(safe)} required={required} />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-required={required}
        readOnly={disabled}
        disabled={disabled}
        placeholder="0"
        value={text}
        onChange={
          disabled
            ? undefined
            : (e) => {
                const n = parseCopInputDigitsToInt(e.target.value);
                onChange(n);
                setText(n <= 0 ? "" : formatCopInputGrouping(n));
              }
        }
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm tabular-nums text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
  disabled,
}: {
  id?: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  required?: boolean;
  disabled?: boolean;
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
        readOnly={disabled}
        disabled={disabled}
        placeholder="0"
        value={text}
        onChange={
          disabled
            ? undefined
            : (e) => {
                const n = parseCopInputDigitsToInt(e.target.value);
                onChange(n);
                setText(n <= 0 ? "" : formatCopInputGrouping(n));
              }
        }
        className={
          disabled
            ? `${productInputClass} cursor-not-allowed bg-zinc-100/80 opacity-80 dark:bg-zinc-800/80`
            : productInputClass
        }
      />
    </>
  );
}

export function AdminDateInput({
  id,
  name,
  value,
  onChange,
  required,
  allowEmpty = false,
  emptyLabel = "dd/mm/aaaa",
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  /** Si es true y `value` está vacío, no se asume “hoy” y se puede borrar la fecha. */
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <DatePickerField
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      variant="admin"
      buttonClassName={`${productInputClass} flex items-center justify-between text-left`}
    />
  );
}
