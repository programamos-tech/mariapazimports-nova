"use client";

import dynamic from "next/dynamic";
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
import { setLineQuantity } from "@/app/actions/cart";
import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

const StoreCartDrawerPanel = dynamic(
  () =>
    import("@/components/store/StoreCartDrawerPanel").then(
      (m) => m.StoreCartDrawerPanel,
    ),
  { ssr: false },
);

export type StoreCartDrawerItem = {
  productId: string;
  quantity: number;
  variantId: string | null;
  variantLabel: string | null;
  variantAxisLabel?: string | null;
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
    void import("@/components/store/StoreCartDrawerPanel");
    if (prefetchInflightRef.current || itemsRef.current.length > 0) return;
    const run = reloadCart("quiet").finally(() => {
      prefetchInflightRef.current = null;
    });
    prefetchInflightRef.current = run;
  }, [reloadCart]);

  const openCart = useCallback(() => {
    setOpen(true);
    void reloadCart(itemsRef.current.length > 0 ? "quiet" : "full");
  }, [reloadCart]);

  const closeCart = useCallback(() => {
    setOpen(false);
  }, []);

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

  const handleCheckout = useCallback(() => {
    setCheckoutNavPending(true);
    closeCart();
    router.push("/checkout");
  }, [closeCart, router]);

  return (
    <StoreCartDrawerContext.Provider value={value}>
      {children}
      {open ? (
        <StoreCartDrawerPanel
          closeRef={closeRef}
          closeCart={closeCart}
          loading={loading}
          items={items}
          suggestions={suggestions}
          linePending={linePending}
          subtotalCents={subtotalCents}
          onAdjustQty={adjustQty}
          onCheckout={handleCheckout}
        />
      ) : null}
      {checkoutNavPending ? (
        <StoreLoadingScreen label="Preparando tu compra…" overlay />
      ) : null}
    </StoreCartDrawerContext.Provider>
  );
}
