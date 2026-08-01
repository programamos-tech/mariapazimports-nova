"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCop } from "@/lib/money";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_WEIGHT,
} from "@/lib/store-header-icons";

type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  price_cents: number;
  image_path: string | null;
};

const SEARCH_PLACEHOLDER = "Buscar productos";

const SUGGESTED_SEARCHES = [
  "Maquillaje",
  "Cuidado de la piel",
  "Vitaminas",
  "Termos",
  "Bolsos",
  "Cuidado corporal",
] as const;

export function StoreSearch({
  variant = "default",
}: {
  /** @deprecated El header usa siempre el drawer; se ignora. */
  variant?: "default" | "minimal";
}) {
  void variant;
  const router = useRouter();
  const baseId = useId();
  const resultsId = `${baseId}-results`;
  const titleId = `${baseId}-title`;
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!drawerOpen) return;

    let cancelled = false;
    const q = debounced.length >= 2 ? debounced : "";

    void (async () => {
      setLoading(true);
      try {
        const url =
          q.length >= 2
            ? `/api/products/search?q=${encodeURIComponent(q)}`
            : `/api/products/search`;
        const res = await fetch(url);
        const data = (await res.json()) as { products?: ProductRow[] };
        if (!cancelled) setProducts(data.products ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, drawerOpen]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [drawerOpen]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    closeDrawer();
    if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
    else router.push("/products");
  }

  function applySuggestion(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  const isFiltering = debounced.length >= 2;
  const iconBtn =
    "flex shrink-0 items-center justify-center rounded-none p-1.5 text-stone-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2";

  const drawer =
    portalTarget &&
    drawerOpen &&
    createPortal(
      <>
        <button
          type="button"
          className="store-cart-drawer-backdrop fixed inset-0 z-[78] bg-black/45"
          aria-label="Cerrar búsqueda"
          onClick={closeDrawer}
        />
        <div
          className="store-cart-drawer-panel fixed inset-y-0 right-0 z-[80] flex w-[min(100%,28rem)] flex-col bg-white shadow-[-12px_0_48px_rgba(15,23,42,0.12)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200/80 px-6 py-5 sm:px-8">
            <h2
              id={titleId}
              className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-900 sm:text-sm"
            >
              Buscar
            </h2>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex size-9 shrink-0 items-center justify-center border border-stone-900/80 text-stone-900 transition hover:bg-stone-900 hover:text-white"
              aria-label="Cerrar búsqueda"
            >
              <X className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          </header>

          <div className="store-cart-drawer-body-scroll flex min-h-0 flex-1 flex-col">
            <form
              onSubmit={onSubmit}
              className="shrink-0 border-b border-stone-200/80 px-6 py-5 sm:px-8"
            >
              <label className="flex items-center gap-3 border border-stone-200 bg-white px-3.5 py-3 focus-within:border-stone-400">
                <MagnifyingGlass
                  className="size-[18px] shrink-0 text-stone-900"
                  weight={STORE_HEADER_ICON_WEIGHT}
                  aria-hidden
                />
                <input
                  ref={inputRef}
                  name="q"
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={SEARCH_PLACEHOLDER}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-stone-900 placeholder:text-stone-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                  aria-controls={resultsId}
                  aria-autocomplete="list"
                />
              </label>
            </form>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8">
              {!isFiltering ? (
                <section className="mb-8" aria-labelledby={`${baseId}-suggestions`}>
                  <h3
                    id={`${baseId}-suggestions`}
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900"
                  >
                    Sugerencias
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {SUGGESTED_SEARCHES.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => applySuggestion(term)}
                          className="border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-800 transition hover:border-stone-900 hover:text-stone-900"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section aria-labelledby={`${baseId}-products`}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h3
                    id={`${baseId}-products`}
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900"
                  >
                    {isFiltering ? "Resultados" : "Productos"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      const q = query.trim();
                      router.push(
                        q
                          ? `/products?q=${encodeURIComponent(q)}`
                          : "/products",
                      );
                    }}
                    className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900"
                  >
                    Ver todos
                  </button>
                </div>

                <div id={resultsId} role="listbox" aria-label="Productos">
                  {loading ? (
                    <ul className="space-y-0">
                      {[1, 2, 3, 4].map((i) => (
                        <li
                          key={i}
                          className="flex animate-pulse gap-4 border-b border-stone-100 py-4"
                        >
                          <div className="size-16 shrink-0 bg-stone-100 sm:size-20" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 max-w-[14rem] bg-stone-100" />
                            <div className="h-2 max-w-[6rem] bg-stone-100" />
                            <div className="h-3 max-w-[4rem] bg-stone-100" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : products.length === 0 ? (
                    <p className="py-8 text-center text-sm text-stone-500">
                      {isFiltering
                        ? `No hay productos que coincidan con “${debounced}”.`
                        : "Aún no hay productos publicados."}
                    </p>
                  ) : (
                    <ul>
                      {products.map((p, idx) => {
                        const img = storagePublicObjectUrl(p.image_path);
                        return (
                          <li
                            key={p.id}
                            className={
                              idx < products.length - 1
                                ? "border-b border-stone-100"
                                : ""
                            }
                          >
                            <Link
                              href={`/products/${p.id}`}
                              onClick={closeDrawer}
                              className="flex items-center gap-4 py-4 transition hover:bg-stone-50"
                            >
                              <div className="relative size-16 shrink-0 overflow-hidden bg-stone-100 sm:size-20">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt=""
                                    fill
                                    className="object-contain object-center"
                                    sizes="80px"
                                    unoptimized={shouldUnoptimizeStorageImageUrl(
                                      img,
                                    )}
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs text-stone-400">
                                    —
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                {p.brand?.trim() ? (
                                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                                    {p.brand}
                                  </p>
                                ) : null}
                                <p className="mt-0.5 line-clamp-2 text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-900">
                                  {p.name}
                                </p>
                                <p className="mt-1.5 text-[13px] font-medium tabular-nums text-stone-900">
                                  {formatCop(p.price_cents)}
                                </p>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </>,
      portalTarget,
    );

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className={iconBtn}
        aria-label="Buscar productos"
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
      >
        <MagnifyingGlass
          className={STORE_HEADER_ICON_LG}
          weight={STORE_HEADER_ICON_WEIGHT}
          aria-hidden
        />
      </button>
      {drawer}
    </>
  );
}
