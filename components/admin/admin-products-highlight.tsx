"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const HighlightContext = createContext<string | null>(null);

export function useHighlightedProductId() {
  return useContext(HighlightContext);
}

const HIGHLIGHT_CLASS =
  "ring-2 ring-emerald-500/70 bg-emerald-50/90 shadow-md shadow-emerald-900/5 transition-[box-shadow,background-color] duration-500 dark:bg-emerald-950/45 dark:ring-emerald-400/50";

export function adminProductHighlightClass(
  productId: string,
  highlightedId: string | null,
): string {
  return productId === highlightedId ? HIGHLIGHT_CLASS : "";
}

type ProviderProps = {
  initialProductId: string | null;
  children: ReactNode;
};

export function AdminProductsHighlightProvider({
  initialProductId,
  children,
}: ProviderProps) {
  const [highlightId, setHighlightId] = useState<string | null>(
    initialProductId,
  );

  useEffect(() => {
    if (!initialProductId) return;
    setHighlightId(initialProductId);
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`admin-product-${initialProductId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    const clearTimer = window.setTimeout(() => setHighlightId(null), 8000);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [initialProductId]);

  return (
    <HighlightContext.Provider value={highlightId}>
      {children}
    </HighlightContext.Provider>
  );
}

type ShellProps = {
  productId: string;
  as: "article" | "tr";
  baseClassName: string;
  children: ReactNode;
};

export function HighlightableProductShell({
  productId,
  as,
  baseClassName,
  children,
}: ShellProps) {
  const highlightedId = useHighlightedProductId();
  const className = `${baseClassName} ${adminProductHighlightClass(productId, highlightedId)}`.trim();
  const id =
    highlightedId === productId ? `admin-product-${productId}` : undefined;

  if (as === "article") {
    return (
      <article id={id} className={className}>
        {children}
      </article>
    );
  }

  return (
    <tr id={id} className={className}>
      {children}
    </tr>
  );
}
