"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupplierInvoiceAction } from "@/app/actions/admin/suppliers";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import { formatCop, formatCopInputGrouping, parseCopInputDigitsToInt } from "@/lib/money";

const cardSectionClass = "rounded-xl border border-zinc-200/90 bg-white p-4 sm:p-6";

export type SupplierOption = { id: string; name: string };

type ProductHit = {
  id: string;
  name: string;
  reference: string | null;
  price_cents: number;
  cost_cents?: number | null;
};

type CartLine = {
  key: string;
  product: ProductHit;
  quantity: number;
  unitPriceCents: number;
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function defaultUnitCents(p: ProductHit): number {
  const cost = Number(p.cost_cents ?? 0);
  if (Number.isFinite(cost) && cost > 0) return Math.floor(cost);
  return Math.max(0, Math.floor(Number(p.price_cents ?? 0)));
}

function lineTotalCents(line: CartLine): number {
  return Math.max(0, Math.floor(line.quantity)) * Math.max(0, Math.floor(line.unitPriceCents));
}

export function SupplierNewInvoiceHeader({
  fixedSupplierId,
  supplierName,
}: {
  fixedSupplierId?: string | null;
  supplierName?: string | null;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/admin/proveedores" className="hover:text-zinc-800">
            Proveedores
          </Link>
          {fixedSupplierId && supplierName ? (
            <>
              <span className="mx-1.5 text-zinc-300">/</span>
              <Link
                href={`/admin/proveedores/${fixedSupplierId}`}
                className="hover:text-zinc-800"
              >
                {supplierName}
              </Link>
            </>
          ) : null}
          <span className="mx-1.5 text-zinc-300">/</span>
          <span className="text-zinc-700">Nueva factura</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">
          {fixedSupplierId && supplierName
            ? `Nueva factura · ${supplierName}`
            : "Nueva factura de proveedor"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Armá la orden de compra con productos del catálogo, precio unitario acordado con el proveedor y
          fecha de emisión. El total se calcula solo; después podés registrar abonos.
        </p>
      </div>
      <Link
        href={fixedSupplierId ? `/admin/proveedores/${fixedSupplierId}` : "/admin/proveedores"}
        className="inline-flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:bg-white hover:text-zinc-900 sm:self-auto"
        aria-label="Volver"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export function SupplierNewInvoiceForm({
  issueDateDefault,
  suppliers,
  fixedSupplierId = null,
  fixedSupplierName = null,
}: {
  /** YYYY-MM-DD desde el Server Component para evitar mismatch de hidratación (UTC vs local). */
  issueDateDefault: string;
  suppliers: SupplierOption[];
  fixedSupplierId?: string | null;
  fixedSupplierName?: string | null;
}) {
  const [supplierId, setSupplierId] = useState(
    fixedSupplierId ?? (suppliers[0]?.id ?? ""),
  );
  const [productQuery, setProductQuery] = useState("");
  const debouncedQ = useDebounced(productQuery, 280);
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);

  const effectiveSupplierId = fixedSupplierId ?? supplierId;

  useEffect(() => {
    const q = debouncedQ.trim();
    if (q.length < 1) {
      setProductHits([]);
      return;
    }
    let cancelled = false;
    setProductLoading(true);
    void fetch(`/api/admin/products-search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((j: { products?: ProductHit[] }) => {
        if (!cancelled) setProductHits(j.products ?? []);
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const totalCents = useMemo(
    () => lines.reduce((s, l) => s + lineTotalCents(l), 0),
    [lines],
  );

  const payloadJson = useMemo(
    () =>
      JSON.stringify({
        lines: lines.map((l) => ({
          productId: l.product.id,
          productName: l.product.name,
          quantity: Math.max(1, Math.floor(l.quantity)),
          unitPriceCents: Math.max(0, Math.floor(l.unitPriceCents)),
        })),
      }),
    [lines],
  );

  const canSubmit = effectiveSupplierId.length > 0 && lines.length > 0 && totalCents > 0;

  function addProduct(p: ProductHit) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          product: p,
          quantity: 1,
          unitPriceCents: defaultUnitCents(p),
        },
      ];
    });
    setProductQuery("");
    setProductHits([]);
  }

  function updateLine(key: string, patch: Partial<Pick<CartLine, "quantity" | "unitPriceCents">>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  return (
    <form action={createSupplierInvoiceAction} className="space-y-6">
      <input type="hidden" name="supplier_id" value={effectiveSupplierId} />
      <input type="hidden" name="payload" value={payloadJson} readOnly />
      <input
        type="hidden"
        name="form_context"
        value={fixedSupplierId ? "supplier" : "hub"}
        readOnly
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <section className={cardSectionClass}>
            <h2 className={sectionTitle}>Proveedor y emisión</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {fixedSupplierId ? (
                <div className="sm:col-span-2">
                  <p className={labelClass}>Proveedor</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">
                    {fixedSupplierName ?? "—"}
                  </p>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label htmlFor="sin-supplier" className={labelClass}>
                    Proveedor <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="sin-supplier"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar…</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="sin-issue" className={labelClass}>
                  Fecha de emisión <span className="text-red-600">*</span>
                </label>
                <input
                  id="sin-issue"
                  type="date"
                  name="issue_date"
                  required
                  defaultValue={issueDateDefault}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className={cardSectionClass}>
            <h2 className={sectionTitle}>Buscar productos</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-500">
              Escribí nombre o referencia del producto del catálogo. El precio unitario por defecto es el{" "}
              <strong className="font-medium text-zinc-700">costo</strong> del producto (o el precio de lista si no
              hay costo); podés ajustarlo por ítem.
            </p>
            <div className="relative mt-4">
              <input
                type="search"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Nombre o código…"
                autoComplete="off"
                className={inputClass}
              />
              {productQuery.trim().length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                  {productLoading ? (
                    <p className="px-3 py-2 text-sm text-zinc-500">Buscando…</p>
                  ) : productHits.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</p>
                  ) : (
                    productHits.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
                      >
                        <span className="font-medium text-zinc-900">{p.name}</span>
                        <span className="text-xs text-zinc-500">
                          {p.reference ? `${p.reference} · ` : null}
                          {formatCop(defaultUnitCents(p))} sugerido
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className={cardSectionClass}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className={sectionTitle}>Productos de la orden</h2>
              <span className="text-sm text-zinc-500">
                {lines.length === 0 ? "Sin ítems" : `${lines.length} ítem${lines.length === 1 ? "" : "s"}`}
              </span>
            </div>
            {lines.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                Agregá al menos un producto para generar la factura y el total.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {lines.map((line) => {
                  const sub = lineTotalCents(line);
                  return (
                    <li
                      key={line.key}
                      className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900">{line.product.name}</p>
                        <p className="text-xs text-zinc-500">
                          {line.product.reference ? `Ref. ${line.product.reference}` : line.product.id}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className={labelClass}>Cantidad</label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(line.key, {
                                  quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Precio unitario (COP)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                line.unitPriceCents <= 0
                                  ? ""
                                  : formatCopInputGrouping(line.unitPriceCents)
                              }
                              onChange={(e) => {
                                const n = parseCopInputDigitsToInt(e.target.value);
                                updateLine(line.key, { unitPriceCents: n });
                              }}
                              className={inputClass}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex shrink-0 items-center justify-between gap-3 sm:mt-0 sm:flex-col sm:items-end">
                        <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatCop(sub)}</p>
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={cardSectionClass}>
            <h2 className={sectionTitle}>Notas</h2>
            <textarea
              name="notes"
              rows={3}
              placeholder="Referencia de OC del proveedor, condiciones, etc."
              className={`${inputClass} mt-4`}
            />
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className={sectionTitle}>Resumen</h2>
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
              <dl className="space-y-2 text-zinc-700">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Proveedor</dt>
                  <dd className="max-w-[55%] truncate text-right font-medium text-zinc-900">
                    {fixedSupplierName ??
                      suppliers.find((s) => s.id === supplierId)?.name ??
                      "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-zinc-200/80 pt-2">
                  <dt className="text-zinc-500">Ítems</dt>
                  <dd className="text-right font-medium text-zinc-900">{lines.length}</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-zinc-200/80 pt-2">
                  <dt className="text-zinc-500">Total estimado</dt>
                  <dd className="text-right text-lg font-semibold tabular-nums text-zinc-900">
                    {formatCop(totalCents)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                El total guardado en la factura será exactamente la suma de cantidad × precio unitario de cada
                línea.
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-5 w-full rounded-lg bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              Crear factura
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
