"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCop } from "@/lib/money";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_SM,
  STORE_HEADER_ICON_STROKE,
} from "@/lib/store-header-icons";

type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  price_cents: number;
  image_path: string | null;
};

function SearchResultsPanel({
  resultsId,
  debounced,
  loading,
  products,
  onPick,
  panelClassName,
}: {
  resultsId: string;
  debounced: string;
  loading: boolean;
  products: ProductRow[];
  onPick: () => void;
  panelClassName: string;
}) {
  return (
    <div
      id={resultsId}
      role="listbox"
      aria-label="Resultados de búsqueda"
      className={panelClassName}
    >
      {loading ? (
        <div className="space-y-0 p-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex animate-pulse gap-3 border-b border-stone-100 p-3 last:border-b-0"
            >
              <div className="size-12 shrink-0 rounded-lg bg-stone-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-full max-w-[12rem] rounded bg-stone-100" />
                <div className="h-2 w-full max-w-[6rem] rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="p-4 text-center text-sm text-stone-500">
          No hay productos que coincidan con “{debounced}”.
        </p>
      ) : (
        <ul className="py-1">
          {products.map((p, idx) => {
            const img = storagePublicObjectUrl(p.image_path);
            const reviews = pseudoReviewCount(p.id);
            return (
              <li
                key={p.id}
                className={idx < products.length - 1 ? "border-b border-stone-100" : ""}
              >
                <Link
                  href={`/products/${p.id}`}
                  onClick={onPick}
                  className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#faf8f5] active:bg-[#f5f2ee]"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/80">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-contain object-center"
                        sizes="48px"
                        unoptimized={shouldUnoptimizeStorageImageUrl(img)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-stone-400">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">{p.name}</p>
                    {p.brand?.trim() ? (
                      <p className="truncate text-[11px] text-stone-500">{p.brand}</p>
                    ) : null}
                    <p className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="text-[11px] leading-none tracking-tight text-[#6b7f6a]"
                        aria-hidden
                      >
                        ★★★★★
                      </span>
                      <span className="text-[11px] text-stone-400">({reviews})</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#556654]">
                    {formatCop(p.price_cents)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function StoreSearch({
  variant = "default",
}: {
  variant?: "default" | "minimal";
}) {
  const router = useRouter();
  const baseId = useId();
  const desktopResultsId = `${baseId}-desktop-results`;
  const mobileResultsId = `${baseId}-mobile-results`;
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(debounced)}`,
        );
        const data = (await res.json()) as { products?: ProductRow[] };
        if (!cancelled) {
          setProducts(data.products ?? []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setOpen(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const closeDesktop = useCallback(() => setOpen(false), []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setOpen(false);
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
    if (debounced.length >= 2) setOpen(true);
  }, [debounced.length]);

  useEffect(() => {
    if (!open || mobileOpen) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) closeDesktop();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDesktop();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, mobileOpen, closeDesktop]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobile();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const t = window.setTimeout(() => mobileInputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [mobileOpen]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    closeDesktop();
    closeMobile();
    if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
    else router.push("/products");
  }

  function onQueryChange(v: string) {
    setQuery(v);
    const t = v.trim();
    if (t.length < 2) {
      setProducts([]);
      setOpen(false);
    } else {
      setOpen(true);
    }
  }

  const showPanel = open && debounced.length >= 2;

  const panelBase =
    "absolute left-0 top-full z-50 mt-2 max-h-[min(70vh,22rem)] min-w-0 overflow-y-auto rounded-xl border border-stone-200/90 bg-white shadow-xl shadow-stone-200/90 ring-1 ring-stone-100";

  const desktopResultsPanel = showPanel && !mobileOpen ? (
    <SearchResultsPanel
      resultsId={desktopResultsId}
      debounced={debounced}
      loading={loading}
      products={products}
      onPick={closeDesktop}
      panelClassName={
        variant === "minimal"
          ? `${panelBase} left-auto right-0 w-[min(22rem,calc(100svw-2rem))]`
          : `${panelBase} right-0 w-full`
      }
    />
  ) : null;

  const mobileOverlay =
    portalTarget &&
    createPortal(
      <div
        className={`fixed inset-0 z-[88] flex flex-col bg-white transition-[visibility,opacity] duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar productos"
        aria-hidden={!mobileOpen}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-stone-200/90 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4">
          <form onSubmit={onSubmit} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-stone-200 bg-[#faf8f5] py-2.5 pl-3.5 pr-3 shadow-sm">
              <Search
                className={STORE_HEADER_ICON_SM}
                strokeWidth={STORE_HEADER_ICON_STROKE}
                aria-hidden
              />
              <input
                ref={mobileInputRef}
                name="q"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Buscar producto o marca"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
                aria-controls={mobileResultsId}
                aria-autocomplete="list"
                aria-haspopup="listbox"
              />
            </div>
            <button
              type="submit"
              className="hidden shrink-0 rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 sm:inline-flex"
            >
              Buscar
            </button>
          </form>
          <button
            type="button"
            onClick={closeMobile}
            className="inline-flex size-11 shrink-0 items-center justify-center text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50"
            aria-label="Cerrar búsqueda"
          >
            <X className="size-5" strokeWidth={1.25} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          {showPanel ? (
            <SearchResultsPanel
              resultsId={mobileResultsId}
              debounced={debounced}
              loading={loading}
              products={products}
              onPick={closeMobile}
              panelClassName="w-full"
            />
          ) : (
            <p className="px-6 py-10 text-center text-sm text-stone-500">
              Escribí al menos 2 caracteres para ver productos.
            </p>
          )}
        </div>
      </div>,
      portalTarget,
    );

  if (variant === "minimal") {
    return (
      <>
        <button
          type="button"
          onClick={openMobile}
          className="flex shrink-0 items-center justify-center p-1 text-stone-600 transition hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2 lg:hidden"
          aria-label="Buscar productos"
          aria-expanded={mobileOpen}
          aria-haspopup="dialog"
        >
          <Search
            className={STORE_HEADER_ICON_LG}
            strokeWidth={STORE_HEADER_ICON_STROKE}
            aria-hidden
          />
        </button>

        <div
          ref={wrapRef}
          className="relative hidden min-w-0 lg:block lg:max-w-[16rem]"
        >
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-b border-stone-400 pb-1 transition-colors focus-within:border-stone-600"
          >
            <Search
              className={`mb-0.5 ${STORE_HEADER_ICON_SM}`}
              strokeWidth={STORE_HEADER_ICON_STROKE}
              aria-hidden
            />
            <input
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Buscar producto o marca"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => {
                if (debounced.length >= 2) setOpen(true);
              }}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-stone-800 placeholder:text-stone-400 focus:outline-none"
              aria-controls={desktopResultsId}
              aria-autocomplete="list"
              aria-haspopup="listbox"
            />
          </form>
          {desktopResultsPanel}
        </div>

        {mobileOverlay}
      </>
    );
  }

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full max-w-none flex-1 lg:min-w-[12rem]">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#faf8f5] py-2 pl-4 pr-3 shadow-sm"
      >
        <input
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Buscar producto o marca"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => {
            if (debounced.length >= 2) setOpen(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
          aria-controls={desktopResultsId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center rounded-full p-1 text-stone-500 transition hover:bg-white/80 hover:text-stone-700"
          aria-label="Buscar"
        >
          <Search className="size-5" strokeWidth={STORE_HEADER_ICON_STROKE} aria-hidden />
        </button>
      </form>
      {desktopResultsPanel}
    </div>
  );
}
