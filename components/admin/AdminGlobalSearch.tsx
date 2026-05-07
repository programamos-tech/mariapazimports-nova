"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCop } from "@/lib/money";
import {
  ventaEstadoBadge,
  ventaFormaPagoLabel,
} from "@/lib/ventas-sales";

type ProductHit = {
  id: string;
  name: string;
  reference: string | null;
  price_cents: number;
  stock_quantity?: number | null;
  stock_local?: number | null;
};

type CustomerHit = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document_id: string | null;
};

type OrderHit = {
  id: string;
  invoiceRef: string;
  customer_name: string;
  total_cents: number;
  created_at: string;
  status: string;
  wompi_reference: string | null;
};

const sectionTitle =
  "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Buscador del navbar del backoffice (`AdminTopBar`). No confundir con la tienda (`StoreSearch`). */

/** Panel bajo el input: vidrio más denso para leer bien sobre el dashboard. */
const liquidPanelClass =
  "absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-[min(65vh,440px)] overflow-y-auto overscroll-contain rounded-2xl border border-zinc-300/70 bg-gradient-to-b from-zinc-100/96 via-zinc-100/94 to-zinc-200/90 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl backdrop-saturate-150";

export function AdminGlobalSearch() {
  const [q, setQ] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [customers, setCustomers] = useState<CustomerHit[]>([]);
  const [orders, setOrders] = useState<OrderHit[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (term: string) => {
    const t = term.trim();
    if (t.length < 1) {
      setProducts([]);
      setCustomers([]);
      setOrders([]);
      setFetchError(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/admin/global-search?q=${encodeURIComponent(t)}`,
        { signal: ac.signal },
      );
      const json = (await res.json()) as {
        products?: ProductHit[];
        customers?: CustomerHit[];
        orders?: OrderHit[];
        error?: string;
      };
      if (!res.ok) {
        setFetchError(json.error ?? "Error al buscar");
        setProducts([]);
        setCustomers([]);
        setOrders([]);
        return;
      }
      setProducts(json.products ?? []);
      setCustomers(json.customers ?? []);
      setOrders(json.orders ?? []);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setFetchError("No se pudo completar la búsqueda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setPanelOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 1) {
      setProducts([]);
      setCustomers([]);
      setOrders([]);
      setFetchError(null);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, runSearch]);

  const hasResults =
    products.length > 0 || customers.length > 0 || orders.length > 0;
  const showPanel = panelOpen && q.trim().length > 0;
  const showEmpty =
    showPanel && !loading && !fetchError && !hasResults;

  const closePanel = () => {
    setPanelOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full min-w-0 overflow-visible">
      <label htmlFor="admin-global-search" className="sr-only">
        Buscar clientes, facturas y productos
      </label>
      <div className="relative min-w-0" role="search">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          id="admin-global-search"
          type="text"
          role="searchbox"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setPanelOpen(true)}
          autoComplete="off"
          placeholder="Clientes, facturas, productos, código…"
          className="box-border min-w-0 w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-11 pr-10 text-sm text-zinc-900 shadow-[0_1px_3px_0_rgb(24_24_27/0.06)] placeholder:text-zinc-500 focus:border-indigo-300/80 focus:outline-none focus:ring-2 focus:ring-indigo-200/50"
        />
        {q.trim() ? (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-indigo-600 transition hover:bg-indigo-50/80"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              setQ("");
              setProducts([]);
              setCustomers([]);
              setOrders([]);
              setFetchError(null);
              inputRef.current?.focus();
            }}
          >
            <IconX className="size-4" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          className={liquidPanelClass}
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {fetchError ? (
            <p className="px-4 py-6 text-center text-sm text-red-600">
              {fetchError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="size-7 animate-spin rounded-full border-2 border-zinc-300/60 border-t-zinc-700/80" />
            </div>
          ) : null}

          {showEmpty ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-700">
              No hay coincidencias. Probá con otro término o n.º de factura.
            </p>
          ) : null}

          {!loading && !fetchError && hasResults ? (
            <div className="p-1.5">
              {products.length > 0 ? (
                <div>
                  <p className={sectionTitle}>Productos</p>
                  <ul className="space-y-0.5">
                    {products.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/admin/products/${p.id}`}
                          onClick={closePanel}
                          className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-300/45"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900">{p.name}</p>
                            <p className="mt-0.5 font-mono text-xs text-zinc-700">
                              {p.reference?.trim() || "—"} ·{" "}
                              {formatCop(Number(p.price_cents ?? 0))}
                            </p>
                          </div>
                          <span className="shrink-0 tabular-nums rounded-full bg-zinc-200/80 px-2 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-300/60">
                            {Number(p.stock_local ?? p.stock_quantity ?? 0)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {customers.length > 0 ? (
                <div className={products.length > 0 ? "mt-3" : ""}>
                  <p className={sectionTitle}>Clientes</p>
                  <ul className="space-y-0.5">
                    {customers.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/admin/customers/${c.id}`}
                          onClick={closePanel}
                          className="block rounded-xl px-3 py-2.5 transition hover:bg-zinc-300/45"
                        >
                          <p className="font-medium text-zinc-900">{c.name}</p>
                          <p className="mt-0.5 text-xs text-zinc-700">
                            {[c.email, c.phone].filter(Boolean).join(" · ") ||
                              c.document_id ||
                              "—"}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {orders.length > 0 ? (
                <div
                  className={
                    products.length > 0 || customers.length > 0 ? "mt-3" : ""
                  }
                >
                  <p className={sectionTitle}>Facturas</p>
                  <ul className="space-y-0.5">
                    {orders.map((o) => {
                      const est = ventaEstadoBadge(o.status);
                      return (
                        <li key={o.id}>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            onClick={closePanel}
                            className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-300/45"
                          >
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-medium text-zinc-950">
                                  #{o.invoiceRef}
                                </span>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${est.className}`}
                                >
                                  {est.label}
                                </span>
                              </p>
                              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                                {o.customer_name}
                              </p>
                              <p className="mt-0.5 text-xs text-zinc-700">
                                {ventaFormaPagoLabel(o.wompi_reference)} ·{" "}
                                {formatCop(Number(o.total_cents ?? 0))}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
