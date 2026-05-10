"use client";

import { signOutAdmin } from "@/app/actions/admin/auth";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  displayName: string;
  email: string;
  /** Avatar renderizado en el servidor (p. ej. `CustomerAvatar`). */
  avatar: ReactNode;
};

export function AdminUserMenu({ displayName, email, avatar }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 flex min-w-0 items-center gap-2.5 rounded-xl py-1 pl-2 pr-1 text-left transition hover:bg-stone-50 sm:border sm:border-stone-200/90 sm:bg-white sm:shadow-[0_1px_2px_0_rgb(28_25_23/0.04)] sm:hover:bg-stone-50/90"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
          <p
            className="truncate text-[11px] font-medium text-stone-500"
            title={email || undefined}
          >
            {email || "—"}
          </p>
        </div>
        {avatar}
        <span
          className={`hidden shrink-0 text-stone-400 transition-transform duration-200 lg:inline ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id="admin-logout-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-logout-title"
          className="absolute right-0 top-full z-[100] mt-2 w-[min(18rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-stone-200/90 bg-white p-4 shadow-[0_16px_48px_-16px_rgba(28,25,23,0.14)] ring-1 ring-stone-900/[0.05] sm:w-80 sm:p-5"
        >
          <h2 id="admin-logout-title" className="text-base font-semibold text-stone-900">
            Cerrar sesión
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            ¿Seguro que quieres salir? Vas a tener que volver a iniciar sesión.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Cancelar
            </button>
            <form action={signOutAdmin} className="sm:inline">
              <button
                type="submit"
                className="w-full rounded-xl bg-neutral-950 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black sm:w-auto"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
