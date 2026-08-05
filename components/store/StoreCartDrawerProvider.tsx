"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { setLineQuantity } from "@/app/actions/cart";
import { formatCop } from "@/lib/money";
import { productColorSwatchClass } from "@/lib/product-colors";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";
import { productCardImageSources } from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

export type StoreCartDrawerItem = {
  productId: string;
  quantity: number;
  variantId: string | null;
  variantLabel: string | null;
  name: string;
  priceCents: number;
  imagePath: string | null;
  firstColor: string | null;
  lineTotalCents: number;
  maxStock: number;
};

type StoreCartSuggestion = {
  id: string;
  name: string;
  priceCents: number;
  imagePath: string | null;
  colors: string[];
};

const SCROLL_EDGE_EPS = 6;

function CartDrawerSuggestionsRow({
  suggestions,
  onPickProduct,
}: {
  suggestions: StoreCartSuggestion[];
  onPickProduct: () => void;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const overflow = maxScroll > SCROLL_EDGE_EPS;
    setCanPrev(overflow && scrollLeft > SCROLL_EDGE_EPS);
    setCanNext(overflow && scrollLeft < maxScroll - SCROLL_EDGE_EPS);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [suggestions, updateArrows]);

  const scrollStep = useCallback((dir: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.72, 280);
    el.scrollBy({
      left: dir === "next" ? step : -step,
      behavior: "smooth",
    });
  }, []);

  if (suggestions.length === 0) return null;

  const arrowBtnClass =
    "flex size-8 shrink-0 items-center justify-center border border-stone-300 text-stone-600 transition hover:border-stone-900 hover:bg-stone-50 hover:text-stone-900";

  return (
    <section
      className="mt-2 border-t border-stone-200/90 pt-8"
      aria-labelledby="store-cart-drawer-suggestions-title"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3
          id="store-cart-drawer-suggestions-title"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900"
        >
          También te puede gustar
        </h3>
        <div className="flex min-h-8 shrink-0 items-center gap-1">
          {canPrev ? (
            <button
              type="button"
              className={arrowBtnClass}
              aria-label="Ver productos anteriores"
              onClick={() => scrollStep("prev")}
            >
              <ChevronLeft className="size-4" strokeWidth={1.35} aria-hidden />
            </button>
          ) : null}
          {canNext ? (
            <button
              type="button"
              className={arrowBtnClass}
              aria-label="Ver más productos"
              onClick={() => scrollStep("next")}
            >
              <ChevronRight className="size-4" strokeWidth={1.35} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <ul
        ref={scrollerRef}
        className="store-cart-suggestions-scroll -mx-1 flex list-none gap-3 px-1 pb-2"
      >
        {suggestions.map((s) => {
          const img =
            productCardImageSources(storagePublicObjectUrl(s.imagePath)).src ??
            storagePublicObjectUrl(s.imagePath);
          const swatches = s.colors.slice(0, 4);
          const extraColors = Math.max(0, s.colors.length - swatches.length);
          return (
            <li key={s.id} className="w-[8.125rem] shrink-0">
              <Link
                href={`/products/${s.id}`}
                onClick={onPickProduct}
                className="block outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-stone-900/25 focus-visible:ring-offset-2"
              >
                <div
                  className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Storage directo, igual que vitrina
                    <img
                      src={img}
                      alt=""
                      className={STORE_PRODUCT_IMAGE_IMG_CLASS}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xl text-stone-200">
                      ◆
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.08em] text-stone-900">
                  {s.name}
                </p>
                <p className="mt-1 text-[11px] font-medium tabular-nums text-stone-900">
                  {formatCop(s.priceCents)}
                </p>
                {swatches.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {swatches.map((c, i) => (
                      <span
                        key={`${s.id}-sw-${i}`}
                        className={`size-4 shrink-0 rounded-full ${productColorSwatchClass(c)}`}
                        aria-hidden
                        title={c}
                      />
                    ))}
                    {extraColors > 0 ? (
                      <span className="text-[10px] font-medium tabular-nums text-stone-500">
                        +{extraColors}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type StoreCartDrawerContextValue = {
  openCart: () => void;
  closeCart: () => void;
  /** Precarga en hover/focus del ícono de bolsa — la apertura se siente instantánea. */
  prefetchCart: () => void;
};

const StoreCartDrawerContext =
  createContext<StoreCartDrawerContextValue | null>(null);

export function useStoreCartDrawer() {
  const ctx = useContext(StoreCartDrawerContext);
  if (!ctx) {
    throw new Error(
      "useStoreCartDrawer debe usarse dentro de StoreCartDrawerProvider",
    );
  }
  return ctx;
}

function DrawerLine({
  item,
  pending,
  onAdjustQty,
}: {
  item: StoreCartDrawerItem;
  pending: boolean;
  onAdjustQty: (nextQty: number) => void;
}) {
  const img = storagePublicObjectUrl(item.imagePath);
  return (
    <li className="py-6">
      <div className="flex gap-4">
        <Link
          href={`/products/${item.productId}`}
          className={`relative w-24 shrink-0 overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element -- Storage directo, igual que vitrina
            <img
              src={img}
              alt=""
              className={STORE_PRODUCT_IMAGE_IMG_CLASS}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl text-stone-200">
              ◆
            </div>
          )}
        </Link>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/products/${item.productId}`}
              className="text-[13px] font-semibold uppercase leading-snug tracking-wide text-stone-900 transition hover:text-stone-600"
            >
              {item.name}
            </Link>
            <div className="mt-3 space-y-1 text-[12px] text-stone-600">
              {item.variantLabel ? (
                <p>
                  <span className="text-stone-500">Presentación:</span>{" "}
                  {item.variantLabel}
                </p>
              ) : null}
              {item.firstColor ? (
                <p>
                  <span className="text-stone-500">Color:</span>{" "}
                  {item.firstColor}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-stone-500">Cant.</span>
                <div className="inline-flex items-center border border-stone-900/25 bg-white">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onAdjustQty(item.quantity - 1)}
                    className="flex size-8 items-center justify-center text-stone-700 transition hover:bg-stone-100 disabled:opacity-35"
                    aria-label={
                      item.quantity <= 1
                        ? "Quitar de la bolsa"
                        : "Menos una unidad"
                    }
                  >
                    <Minus className="size-3.5" strokeWidth={1.35} />
                  </button>
                  <span className="min-w-[1.75rem] text-center text-xs font-semibold tabular-nums text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={pending || item.quantity >= item.maxStock}
                    onClick={() => onAdjustQty(item.quantity + 1)}
                    className="flex size-8 items-center justify-center text-stone-700 transition hover:bg-stone-100 disabled:opacity-35"
                    aria-label="Más una unidad"
                  >
                    <Plus className="size-3.5" strokeWidth={1.35} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="shrink-0 pt-px text-[14px] font-medium tabular-nums text-stone-900">
            {formatCop(item.lineTotalCents)}
          </p>
        </div>
      </div>
    </li>
  );
}

export function StoreCartDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StoreCartDrawerItem[]>([]);
  const [suggestions, setSuggestions] = useState<StoreCartSuggestion[]>([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkoutNavPending, setCheckoutNavPending] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const fetchGenRef = useRef(0);
  const suggestionsGenRef = useRef(0);
  const prefetchInflightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!checkoutNavPending) return;
    if (pathname.startsWith("/checkout")) {
      setCheckoutNavPending(false);
    }
  }, [pathname, checkoutNavPending]);

  const loadSuggestions = useCallback(async () => {
    const gen = ++suggestionsGenRef.current;
    try {
      const res = await fetch("/api/store/cart?suggestions=1", {
        cache: "no-store",
      });
      if (!res.ok || gen !== suggestionsGenRef.current) return;
      const body = (await res.json()) as {
        suggestions?: StoreCartSuggestion[];
      };
      setSuggestions(body.suggestions ?? []);
    } catch {
      /* red intermitente: la bolsa ya tiene ítems */
    }
  }, []);

  const reloadCart = useCallback(
    async (mode: "full" | "quiet" = "full") => {
      const gen = ++fetchGenRef.current;
      if (mode === "full") setLoading(true);
      try {
        // Ítems primero (lite) — la bolsa pinta sin esperar sugerencias.
        const res = await fetch("/api/store/cart?lite=1", {
          cache: "no-store",
        });
        if (gen !== fetchGenRef.current) return;
        if (!res.ok) {
          setItems([]);
          setSuggestions([]);
          setSubtotalCents(0);
          return;
        }
        const body = (await res.json()) as {
          items?: StoreCartDrawerItem[];
          subtotalCents?: number;
        };
        setItems(body.items ?? []);
        setSubtotalCents(Number(body.subtotalCents ?? 0));
      } finally {
        if (mode === "full" && gen === fetchGenRef.current) {
          setLoading(false);
        }
      }
      if (gen === fetchGenRef.current) void loadSuggestions();
    },
    [loadSuggestions],
  );

  const prefetchCart = useCallback(() => {
    if (prefetchInflightRef.current || itemsRef.current.length > 0) return;
    const run = reloadCart("quiet").finally(() => {
      prefetchInflightRef.current = null;
    });
    prefetchInflightRef.current = run;
  }, [reloadCart]);

  const openCart = useCallback(() => {
    setOpen(true);
    // Con ítems en pantalla: refresca en silencio. Vacío: loading corto (lite).
    void reloadCart(itemsRef.current.length > 0 ? "quiet" : "full");
  }, [reloadCart]);

  const closeCart = useCallback(() => {
    setOpen(false);
  }, []);

  // Precarga en idle para que el primer click no espere la red.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => prefetchCart(), {
        timeout: 1800,
      });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => prefetchCart(), 900);
    return () => window.clearTimeout(t);
  }, [prefetchCart]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeCart]);

  const value = useMemo(
    () => ({ openCart, closeCart, prefetchCart }),
    [openCart, closeCart, prefetchCart],
  );

  const [linePending, startLineTransition] = useTransition();

  const adjustQty = useCallback(
    (productId: string, variantId: string | null, nextQty: number) => {
      startLineTransition(() => {
        void (async () => {
          await setLineQuantity(
            productId,
            nextQty,
            variantId ?? undefined,
          );
          await reloadCart("quiet");
          router.refresh();
        })();
      });
    },
    [reloadCart, router],
  );

  return (
    <StoreCartDrawerContext.Provider value={value}>
      {children}
      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar bolsa de compras"
            className="store-cart-drawer-backdrop fixed inset-0 z-[65] bg-black/45"
            onClick={closeCart}
          />
          <div
            className="store-cart-drawer-panel fixed inset-y-0 right-0 z-[70] flex w-[min(100%,26rem)] flex-col bg-white shadow-[-12px_0_48px_rgba(15,23,42,0.12)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-cart-drawer-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-stone-200/80 px-6 py-5 sm:px-8">
              <h2
                id="store-cart-drawer-title"
                className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-900"
              >
                Bolsa de compras
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={closeCart}
                className="flex size-9 shrink-0 items-center justify-center border border-stone-900/80 text-stone-900 transition hover:bg-stone-900 hover:text-white"
                aria-label="Cerrar"
              >
                <span className="text-lg font-light leading-none">×</span>
              </button>
            </header>

            <div className="store-cart-drawer-body-scroll flex min-h-0 flex-1 flex-col px-6 sm:px-8">
              {loading && items.length === 0 ? (
                <p className="py-12 text-center text-sm text-stone-500">
                  Cargando…
                </p>
              ) : items.length === 0 ? (
                <>
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
                    <p className="text-sm leading-relaxed text-stone-600">
                      Tu bolsa está vacía.
                    </p>
                    <Link
                      href="/products"
                      onClick={closeCart}
                      className="border border-stone-900 bg-stone-900 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-stone-800"
                    >
                      Explorar productos
                    </Link>
                  </div>
                  <CartDrawerSuggestionsRow
                    suggestions={suggestions}
                    onPickProduct={closeCart}
                  />
                </>
              ) : (
                <>
                  <ul className="divide-y divide-stone-200/90 pb-2">
                    {items.map((item) => (
                      <DrawerLine
                        key={`${item.productId}-${item.variantId ?? ""}`}
                        item={item}
                        pending={linePending}
                        onAdjustQty={(next) =>
                          adjustQty(item.productId, item.variantId, next)
                        }
                      />
                    ))}
                  </ul>
                  <CartDrawerSuggestionsRow
                    suggestions={suggestions}
                    onPickProduct={closeCart}
                  />
                </>
              )}
            </div>

            {items.length > 0 ? (
              <footer className="border-t border-stone-200/80 bg-white px-6 pb-8 pt-6 sm:px-8">
                <div className="flex items-baseline justify-between gap-4 text-[13px] text-stone-800">
                  <span className="font-medium uppercase tracking-[0.12em] text-stone-600">
                    Subtotal
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums text-stone-900">
                    {formatCop(subtotalCents)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutNavPending(true);
                    closeCart();
                    router.push("/checkout");
                  }}
                  className="mt-5 flex w-full items-center justify-center bg-stone-900 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800"
                >
                  Revisar y finalizar compra
                </button>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="mt-4 block text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-700 underline decoration-stone-400 underline-offset-4 transition hover:text-stone-900"
                >
                  Seguir comprando
                </Link>
              </footer>
            ) : null}
          </div>
        </>
      ) : null}
      {checkoutNavPending ? (
        <StoreLoadingScreen label="Preparando tu compra…" overlay />
      ) : null}
    </StoreCartDrawerContext.Provider>
  );
}
