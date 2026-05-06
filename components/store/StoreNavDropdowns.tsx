"use client";

import type { SVGProps } from "react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  distributeProductCounts,
  megaMenuCategories,
} from "@/lib/store-categories";
import { storeBrand } from "@/lib/brand";

type MenuId = "categories" | "deals" | "news" | "shipping" | null;

function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StoreNavDropdowns({ productCount }: { productCount: number }) {
  const [open, setOpen] = useState<MenuId>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const counts = distributeProductCounts(productCount, megaMenuCategories.length);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className="relative flex flex-wrap items-center gap-1">
      {/* Categorías — mega panel */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900 data-[open=true]:bg-[#f4f0ea] data-[open=true]:text-stone-900"
          data-open={open === "categories"}
          aria-expanded={open === "categories"}
          aria-controls={`${baseId}-categories-panel`}
          id={`${baseId}-categories-trigger`}
          onClick={() => setOpen((v) => (v === "categories" ? null : "categories"))}
        >
          Categorías
          <IconChevronDown className="size-4 text-stone-400" />
        </button>
        {open === "categories" ? (
          <div
            id={`${baseId}-categories-panel`}
            role="region"
            aria-labelledby={`${baseId}-categories-trigger`}
            className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,42rem)] rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xl shadow-stone-200/80 ring-1 ring-stone-100 sm:left-1/2 sm:-translate-x-1/2"
          >
            <h2 className="text-base font-semibold text-stone-900">
              Categorías populares
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Explorá el catálogo de {storeBrand}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {megaMenuCategories.map((c, i) => {
                const n = counts[i] ?? 0;
                const label =
                  n === 0
                    ? "Explorá el catálogo"
                    : n === 1
                      ? "1 producto disponible"
                      : `${n} productos disponibles`;
                return (
                  <li key={c.id}>
                    <Link
                      href="/products"
                      onClick={close}
                      className="flex items-center gap-3 rounded-xl border border-stone-100 bg-[#faf8f5] p-3 transition hover:border-[#c7d4c2] hover:bg-white hover:shadow-sm"
                    >
                      <div
                        className={`flex size-14 shrink-0 items-center justify-center rounded-lg text-2xl ${c.tint}`}
                        aria-hidden
                      >
                        {c.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">{c.name}</p>
                        <p className="text-xs text-stone-500">{c.sub}</p>
                        <p className="mt-0.5 text-xs font-medium text-[#6b7f6a]">
                          {label}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/products"
              onClick={close}
              className="mt-4 block text-center text-sm font-semibold text-[#6b7f6a] hover:underline"
            >
              Ver todo el catálogo →
            </Link>
          </div>
        ) : null}
      </div>

      {/* Ofertas */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900 data-[open=true]:bg-[#f4f0ea]"
          data-open={open === "deals"}
          aria-expanded={open === "deals"}
          onClick={() => setOpen((v) => (v === "deals" ? null : "deals"))}
        >
          Ofertas
          <IconChevronDown className="size-4 text-stone-400" />
        </button>
        {open === "deals" ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-3 shadow-xl ring-1 ring-stone-100">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Promos
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href="/products"
                  onClick={close}
                  className="block rounded-lg px-2 py-2 text-sm text-stone-700 hover:bg-[#f4f0ea]"
                >
                  Seleccionados con descuento
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  onClick={close}
                  className="block rounded-lg px-2 py-2 text-sm text-stone-700 hover:bg-[#f4f0ea]"
                >
                  Outlet
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      {/* Novedades */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900 data-[open=true]:bg-[#f4f0ea]"
          data-open={open === "news"}
          aria-expanded={open === "news"}
          onClick={() => setOpen((v) => (v === "news" ? null : "news"))}
        >
          Novedades
          <IconChevronDown className="size-4 text-stone-400" />
        </button>
        {open === "news" ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-3 shadow-xl ring-1 ring-stone-100">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Recién llegado
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href="/products"
                  onClick={close}
                  className="block rounded-lg px-2 py-2 text-sm text-stone-700 hover:bg-[#f4f0ea]"
                >
                  Últimos productos
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  onClick={close}
                  className="block rounded-lg px-2 py-2 text-sm text-stone-700 hover:bg-[#f4f0ea]"
                >
                  Lo más visto
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      {/* Envíos */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900 data-[open=true]:bg-[#f4f0ea]"
          data-open={open === "shipping"}
          aria-expanded={open === "shipping"}
          onClick={() => setOpen((v) => (v === "shipping" ? null : "shipping"))}
        >
          Envíos
          <IconChevronDown className="size-4 text-stone-400" />
        </button>
        {open === "shipping" ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-4 shadow-xl ring-1 ring-stone-100 sm:right-auto sm:left-0">
            <p className="text-sm font-semibold text-stone-900">Envíos nacionales</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              Tiempos y costos según zona. Esta plantilla muestra texto de ejemplo;
              personalizalo por cliente en el fork.
            </p>
            <Link
              href="/products"
              onClick={close}
              className="mt-3 inline-block text-sm font-semibold text-[#6b7f6a] hover:underline"
            >
              Seguir comprando →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
