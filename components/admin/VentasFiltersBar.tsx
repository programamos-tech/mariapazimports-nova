"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  productInputClass as inputClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import type { VentaEstadoFilter, VentaPagoFilter } from "@/lib/ventas-sales";

function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none size-4 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

function buildQuery(
  pathname: string,
  next: { q?: string; status?: VentaEstadoFilter; payment?: VentaPagoFilter },
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  if (next.q !== undefined) {
    if (next.q.trim()) p.set("q", next.q.trim());
    else p.delete("q");
  }
  if (next.status !== undefined) {
    if (next.status === "all") p.delete("status");
    else p.set("status", next.status);
  }
  if (next.payment !== undefined) {
    if (next.payment === "all") p.delete("payment");
    else p.set("payment", next.payment);
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

type VentasFiltersBarProps = {
  initialQ: string;
};

export function VentasFiltersBar({ initialQ }: VentasFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const status = (searchParams.get("status") ?? "all") as VentaEstadoFilter;
  const payment = (searchParams.get("payment") ?? "all") as VentaPagoFilter;

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const pushQuery = useCallback(
    (patch: { q?: string; status?: VentaEstadoFilter; payment?: VentaPagoFilter }) => {
      const url = buildQuery(pathname, patch, searchParams);
      router.replace(url);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const urlQ = searchParams.get("q") ?? "";
      if (q.trim() === urlQ.trim()) return;
      pushQuery({ q });
    }, 380);
    return () => clearTimeout(t);
  }, [q, pushQuery, searchParams]);

  return (
    <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 md:px-6">
      <div className="relative min-w-0 flex-1 sm:max-w-xl">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <IconSearch />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Factura, cliente…"
          className={`${inputClass} pl-10`}
          autoComplete="off"
          aria-label="Buscar por factura o cliente"
        />
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-5">
        <div className="min-w-[140px]">
          <label className={`${sectionTitle} mb-2 block`}>Estado</label>
          <select
            value={status}
            onChange={(e) =>
              pushQuery({ status: e.target.value as VentaEstadoFilter })
            }
            className={inputClass}
          >
            <option value="all">Todas</option>
            <option value="paid">Finalizada</option>
            <option value="cancelled">Anulada</option>
            <option value="pending">Pendiente</option>
            <option value="failed">Fallida</option>
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className={`${sectionTitle} mb-2 block`}>Forma de pago</label>
          <select
            value={payment}
            onChange={(e) =>
              pushQuery({ payment: e.target.value as VentaPagoFilter })
            }
            className={inputClass}
          >
            <option value="all">Todas</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="mixed">Mixto</option>
            <option value="online">En línea</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function VentasRefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
        <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" strokeLinecap="round" />
        <path d="M16 21h5v-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Actualizar
    </button>
  );
}
