"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const weekdayShort = ["d", "l", "m", "m", "j", "v", "s"] as const;

function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

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

export function AdminDateInput({
  id,
  name,
  value,
  onChange,
  required,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const selected = parseDateInput(value) ?? new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  useEffect(() => {
    setView(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [value]); // sincroniza cuando cambia desde fuera

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: MouseEvent) => {
      if (!anchorRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const days = useMemo(() => {
    const start = new Date(view.getFullYear(), view.getMonth(), 1);
    const startOffset = start.getDay();
    const firstGridDate = new Date(start);
    firstGridDate.setDate(start.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(firstGridDate);
      d.setDate(firstGridDate.getDate() + i);
      return d;
    });
  }, [view]);

  return (
    <div ref={anchorRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${productInputClass} flex items-center justify-between text-left`}
      >
        <span className="tabular-nums">
          {selected.toLocaleDateString("es-CO")}
        </span>
        <svg viewBox="0 0 24 24" className="size-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.4rem)] z-30 w-[18rem] rounded-xl border border-zinc-200 bg-white p-3 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100"
              aria-label="Mes anterior"
            >
              ←
            </button>
            <p className="text-sm font-semibold capitalize text-zinc-900">{monthLabel(view)}</p>
            <button
              type="button"
              onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100"
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-500">
            {weekdayShort.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const active =
                d.getFullYear() === selected.getFullYear() &&
                d.getMonth() === selected.getMonth() &&
                d.getDate() === selected.getDate();
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(toInputDate(d));
                    setOpen(false);
                  }}
                  className={[
                    "h-8 rounded-md text-sm tabular-nums transition",
                    active
                      ? "bg-zinc-900 text-white"
                      : inMonth
                        ? "text-zinc-800 hover:bg-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onChange(toInputDate(new Date()))}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
