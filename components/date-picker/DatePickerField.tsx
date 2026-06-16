"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  isDateWithinBounds,
  monthShortLabel,
  monthYearLabel,
  parseIsoDate,
  toIsoDate,
  weekdayShort,
  yearBounds,
  yearPageStartFor,
} from "@/lib/date-picker";

type PanelView = "days" | "months" | "years";

export type DatePickerFieldProps = {
  id?: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  minDate?: string;
  maxDate?: string;
  hideToday?: boolean;
  initialView?: PanelView;
  variant?: "store" | "admin";
  buttonClassName: string;
  panelClassName?: string;
};

const defaultPanelClass =
  "absolute left-0 top-[calc(100%+0.4rem)] z-[85] w-[18rem] rounded-xl border border-stone-200 bg-white p-3 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]";

const panelByVariant = {
  store: defaultPanelClass,
  admin:
    "absolute left-0 top-[calc(100%+0.4rem)] z-30 w-[18rem] rounded-xl border border-zinc-200 bg-white p-3 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)]",
} as const;

function toneClasses(variant: "store" | "admin") {
  if (variant === "admin") {
    return {
      label: "text-zinc-900 dark:text-zinc-100",
      muted: "text-zinc-400 dark:text-zinc-500",
      icon: "text-zinc-500 dark:text-zinc-400",
      nav: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
      header: "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
      active: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
      day: "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
      dayMuted: "text-zinc-400 hover:bg-zinc-50 dark:text-zinc-600 dark:hover:bg-zinc-800/60",
      disabled: "text-zinc-300 dark:text-zinc-600",
      footer: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
      clear: "text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50",
    };
  }
  return {
    label: "text-stone-900",
    muted: "text-stone-400",
    icon: "text-stone-500",
    nav: "text-stone-600 hover:bg-stone-100",
    header: "text-stone-900 hover:bg-stone-100",
    active: "bg-stone-900 text-white",
    day: "text-stone-800 hover:bg-stone-100",
    dayMuted: "text-stone-400 hover:bg-stone-50",
    disabled: "text-stone-300",
    footer: "text-stone-600 hover:bg-stone-100",
    clear: "text-blue-700 hover:bg-blue-50",
  };
}

export function DatePickerField({
  id,
  name,
  value,
  onChange,
  required,
  allowEmpty = false,
  emptyLabel = "dd/mm/aaaa",
  minDate,
  maxDate,
  hideToday = false,
  initialView = "days",
  variant = "store",
  buttonClassName,
  panelClassName,
}: DatePickerFieldProps) {
  const tone = toneClasses(variant);
  const panelClass = panelClassName ?? panelByVariant[variant];
  const anchorRef = useRef<HTMLDivElement>(null);
  const { minYear, maxYear } = yearBounds(minDate, maxDate);
  const selectedDate = allowEmpty
    ? value.trim()
      ? parseIsoDate(value)
      : null
    : (parseIsoDate(value) ?? new Date());

  const [open, setOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>(initialView);
  const [view, setView] = useState(() => {
    const base = selectedDate ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [yearPageStart, setYearPageStart] = useState(() =>
    yearPageStartFor(
      selectedDate?.getFullYear() ?? 1990,
      minYear,
      maxYear,
    ),
  );

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

  const yearsOnPage = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => yearPageStart + i).filter(
      (y) => y >= minYear && y <= maxYear,
    );
  }, [yearPageStart, minYear, maxYear]);

  function openPicker() {
    const parsed = allowEmpty
      ? value.trim()
        ? parseIsoDate(value)
        : null
      : (parseIsoDate(value) ?? new Date());
    const base = parsed ?? new Date(Math.min(maxYear, Math.max(minYear, 1990)), 0, 1);
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    setYearPageStart(yearPageStartFor(base.getFullYear(), minYear, maxYear));
    setPanelView(initialView);
    setOpen(true);
  }

  function selectDate(d: Date) {
    if (!isDateWithinBounds(d, minDate, maxDate)) return;
    onChange(toIsoDate(d));
    setOpen(false);
  }

  return (
    <div ref={anchorRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={`${buttonClassName} flex items-center justify-between gap-2 text-left`}
      >
        <span
          className={
            selectedDate
              ? `tabular-nums ${tone.label}`
              : tone.muted
          }
        >
          {selectedDate
            ? selectedDate.toLocaleDateString("es-CO")
            : emptyLabel}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 ${tone.icon}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
        </svg>
      </button>

      {open ? (
        <div className={panelClass} role="dialog" aria-label="Elegir fecha">
          {panelView === "years" ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setYearPageStart((start) =>
                      Math.max(minYear, start - 12),
                    )
                  }
                  disabled={yearPageStart <= minYear}
                  className={`rounded-md px-2 py-1 disabled:opacity-40 ${tone.nav}`}
                  aria-label="Años anteriores"
                >
                  ←
                </button>
                <p className={`text-sm font-semibold tabular-nums ${tone.label}`}>
                  {yearsOnPage[0]} – {yearsOnPage[yearsOnPage.length - 1]}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setYearPageStart((start) =>
                      Math.min(
                        yearPageStartFor(maxYear, minYear, maxYear),
                        start + 12,
                      ),
                    )
                  }
                  disabled={
                    yearPageStart + 11 >= maxYear
                  }
                  className={`rounded-md px-2 py-1 disabled:opacity-40 ${tone.nav}`}
                  aria-label="Años siguientes"
                >
                  →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {yearsOnPage.map((year) => {
                  const active = selectedDate?.getFullYear() === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setView(new Date(year, view.getMonth(), 1));
                        setPanelView("months");
                      }}
                      className={[
                        "rounded-md px-2 py-2 text-sm font-medium tabular-nums transition",
                        active
                          ? tone.active
                          : `${tone.day}`,
                      ].join(" ")}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {panelView === "months" ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPanelView("years")}
                  className={`rounded-md px-2 py-1 text-sm font-semibold ${tone.header}`}
                >
                  {view.getFullYear()}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }, (_, month) => {
                  const active =
                    selectedDate?.getFullYear() === view.getFullYear() &&
                    selectedDate?.getMonth() === month;
                  const daysInMonth = new Date(
                    view.getFullYear(),
                    month + 1,
                    0,
                  ).getDate();
                  const monthDisabled = !Array.from(
                    { length: daysInMonth },
                    (_, day) => {
                      const probe = new Date(
                        view.getFullYear(),
                        month,
                        day + 1,
                      );
                      return isDateWithinBounds(probe, minDate, maxDate);
                    },
                  ).some(Boolean);

                  return (
                    <button
                      key={month}
                      type="button"
                      disabled={monthDisabled}
                      onClick={() => {
                        setView(new Date(view.getFullYear(), month, 1));
                        setPanelView("days");
                      }}
                      className={[
                        "rounded-md px-2 py-2 text-sm font-medium capitalize transition",
                        active
                          ? tone.active
                          : monthDisabled
                            ? `cursor-not-allowed ${tone.disabled}`
                            : tone.day,
                      ].join(" ")}
                    >
                      {monthShortLabel(month)}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {panelView === "days" ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
                  }
                  className={`rounded-md px-2 py-1 ${tone.nav}`}
                  aria-label="Mes anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setPanelView("months")}
                  className={`rounded-md px-2 py-1 text-sm font-semibold capitalize ${tone.header}`}
                >
                  {monthYearLabel(view)}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
                  }
                  className={`rounded-md px-2 py-1 ${tone.nav}`}
                  aria-label="Mes siguiente"
                >
                  →
                </button>
              </div>
              <div className={`grid grid-cols-7 gap-1 text-center text-[11px] font-medium ${tone.muted}`}>
                {weekdayShort.map((w, i) => (
                  <span key={`dow-${i}`}>{w}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((d) => {
                  const inMonth = d.getMonth() === view.getMonth();
                  const active =
                    selectedDate !== null &&
                    d.getFullYear() === selectedDate.getFullYear() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getDate() === selectedDate.getDate();
                  const disabled = !isDateWithinBounds(d, minDate, maxDate);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(d)}
                      className={[
                        "h-8 rounded-md text-sm tabular-nums transition",
                        active
                          ? tone.active
                          : disabled
                            ? `cursor-not-allowed ${tone.disabled}`
                            : inMonth
                              ? tone.day
                              : tone.dayMuted,
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {allowEmpty ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${tone.clear}`}
                >
                  Borrar
                </button>
              ) : null}
              {!hideToday ? (
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    if (isDateWithinBounds(today, minDate, maxDate)) {
                      selectDate(today);
                    }
                  }}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${tone.footer}`}
                >
                  Hoy
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${tone.footer}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
