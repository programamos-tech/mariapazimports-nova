"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, SVGProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCop } from "@/lib/money";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  image_path: string | null;
};

function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function StoreSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const close = useCallback(() => setOpen(false), []);

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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    close();
    if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
    else router.push("/products");
  }

  const showPanel = open && debounced.length >= 2;

  return (
    <div ref={wrapRef} className="relative min-w-[200px] flex-1 lg:max-w-xl">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#faf8f5] py-2 pl-4 pr-3 shadow-sm"
      >
        <input
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Buscar producto"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            const t = v.trim();
            if (t.length < 2) {
              setProducts([]);
              setOpen(false);
            } else {
              setOpen(true);
            }
          }}
          onFocus={() => {
            if (debounced.length >= 2) setOpen(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
          aria-controls="store-search-results"
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center rounded-full p-1 text-stone-400 transition hover:bg-white/80 hover:text-[#6b7f6a]"
          aria-label="Buscar"
        >
          <IconSearch className="size-5" />
        </button>
      </form>

      {showPanel ? (
        <div
          id="store-search-results"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,22rem)] w-[min(100%,28rem)] overflow-y-auto rounded-xl border border-stone-200/90 bg-white shadow-xl shadow-stone-200/90 ring-1 ring-stone-100 sm:left-auto sm:right-0 sm:ml-auto sm:mr-0 lg:w-[28rem]"
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
                      onClick={close}
                      className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#faf8f5]"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/80">
                        {img ? (
                          <Image
                            src={img}
                            alt=""
                            fill
                            className="object-cover"
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
                        <p className="truncate text-sm font-medium text-stone-900">
                          {p.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-[11px] leading-none tracking-tight text-[#6b7f6a]" aria-hidden>
                            ★★★★★
                          </span>
                          <span className="text-[11px] text-stone-400">
                            ({reviews})
                          </span>
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
      ) : null}
    </div>
  );
}
