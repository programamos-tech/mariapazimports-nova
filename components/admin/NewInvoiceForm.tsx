"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPosInvoiceAction } from "@/app/actions/admin/pos-invoice";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import { formatCop, parseCopInputDigitsToInt } from "@/lib/money";
import { storeBrand } from "@/lib/brand";

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

type ShipOption =
  | { kind: "pickup"; id: "pickup"; label: string; detail: string }
  | { kind: "address"; id: string; label: string; detail: string };

type CartLine = {
  key: string;
  product: ProductHit;
  quantity: number;
};

type PaymentTab = "cash" | "transfer" | "mixed";

function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10h5M9.5 14h5" strokeLinecap="round" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function NewInvoiceHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/admin/ventas" className="hover:text-zinc-800">
            Ventas
          </Link>
          <span className="mx-1.5 text-zinc-300">/</span>
          <span className="text-zinc-700">Nueva factura</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Nueva factura
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Selecciona el cliente, agrega productos al carrito y elige el método de pago.
        </p>
        <p className="mt-2 text-xs text-zinc-400">Sucursal: {storeBrand}</p>
      </div>
      <Link
        href="/admin/ventas"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
        aria-label="Volver a ventas"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "validation":
      return "Revisá cliente, productos y cantidades.";
    case "customer":
      return "No se encontró el cliente.";
    case "products":
      return "Algún producto no es válido o ya no existe.";
    case "stock":
      return "Stock insuficiente en tienda para uno o más productos.";
    case "db":
      return "No se pudo guardar. Aplicá la migración de permisos POS en Supabase (20260515120000_admin_orders_write_pos.sql) e intentá de nuevo.";
    default:
      return "Ocurrió un error al confirmar la factura.";
  }
}

function ConfirmInvoiceButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-6 w-full rounded-lg bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
    >
      {pending ? "Guardando…" : "Confirmar factura"}
    </button>
  );
}

export function NewInvoiceForm({ initialError }: { initialError?: string }) {
  const [productQuery, setProductQuery] = useState("");
  const debouncedProductQ = useDebounced(productQuery, 280);
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const debouncedCustomerQ = useDebounced(customerQuery, 280);
  const [customerHits, setCustomerHits] = useState<CustomerHit[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [customer, setCustomer] = useState<CustomerHit | null>(null);
  const [shipOptions, setShipOptions] = useState<ShipOption[]>([]);
  const [shipChoice, setShipChoice] = useState<string | null>(null);
  const [shipLoading, setShipLoading] = useState(false);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<PaymentTab>("cash");
  const [cashGivenRaw, setCashGivenRaw] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [mixedCashRaw, setMixedCashRaw] = useState("");
  const [mixedTransferRaw, setMixedTransferRaw] = useState("");

  const loadCustomerProfile = useCallback(async (id: string) => {
    setShipLoading(true);
    setShipChoice(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/pos-profile`);
      if (!res.ok) {
        setShipOptions([]);
        return;
      }
      const json = (await res.json()) as { shipOptions?: ShipOption[] };
      setShipOptions(json.shipOptions ?? []);
    } finally {
      setShipLoading(false);
    }
  }, []);

  useEffect(() => {
    if (customer) {
      void loadCustomerProfile(customer.id);
    } else {
      setShipOptions([]);
      setShipChoice(null);
    }
  }, [customer, loadCustomerProfile]);

  useEffect(() => {
    if (!customer || shipOptions.length === 0) return;
    setShipChoice((cur) =>
      cur && shipOptions.some((o) => o.id === cur) ? cur : shipOptions[0]!.id,
    );
  }, [customer, shipOptions]);

  useEffect(() => {
    const q = debouncedProductQ.trim();
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
  }, [debouncedProductQ]);

  useEffect(() => {
    const q = debouncedCustomerQ.trim();
    if (q.length < 1) {
      setCustomerHits([]);
      return;
    }
    let cancelled = false;
    setCustomerLoading(true);
    void fetch(`/api/admin/customers-search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((j: { customers?: CustomerHit[] }) => {
        if (!cancelled) setCustomerHits(j.customers ?? []);
      })
      .finally(() => {
        if (!cancelled) setCustomerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCustomerQ]);

  const subtotalCents = useMemo(() => {
    let s = 0;
    for (const line of lines) {
      s += Number(line.product.price_cents ?? 0) * line.quantity;
    }
    return s;
  }, [lines]);

  const totalCents = subtotalCents;

  const cashGivenCents = parseCopInputDigitsToInt(cashGivenRaw);
  const mixedCashCents = parseCopInputDigitsToInt(mixedCashRaw);
  const mixedTransferCents = parseCopInputDigitsToInt(mixedTransferRaw);

  const changeCents =
    payment === "cash" && cashGivenCents >= totalCents
      ? cashGivenCents - totalCents
      : null;

  const mixedOk =
    mixedCashCents + mixedTransferCents === totalCents && totalCents > 0;

  const paymentOk =
    payment === "cash"
      ? cashGivenCents >= totalCents
      : payment === "transfer"
        ? true
        : mixedOk;

  const canSubmit =
    customer !== null &&
    lines.length > 0 &&
    totalCents > 0 &&
    shipChoice !== null &&
    shipChoice !== "" &&
    !shipLoading &&
    paymentOk;

  function addProduct(p: ProductHit) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === p.id);
      const stock = Number(p.stock_local ?? p.stock_quantity ?? 0);
      if (idx >= 0) {
        const next = [...prev];
        const q = next[idx].quantity + 1;
        if (q > stock) return prev;
        next[idx] = { ...next[idx], quantity: q };
        return next;
      }
      if (stock < 1) return prev;
      return [...prev, { key: crypto.randomUUID(), product: p, quantity: 1 }];
    });
    setProductQuery("");
    setProductHits([]);
  }

  function setQty(key: string, q: number) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const stock = Number(line.product.stock_local ?? line.product.stock_quantity ?? 0);
        const next = Math.max(1, Math.min(stock, Math.floor(q)));
        return { ...line, quantity: next };
      }),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const payloadJson = useMemo(() => {
    if (!customer) return "";
    let address: string | null = null;
    if (!shipChoice || shipChoice === "pickup") {
      address = "Retiro en tienda";
    } else {
      const opt = shipOptions.find((o) => o.id === shipChoice);
      if (!opt || opt.kind === "pickup") {
        address = "Retiro en tienda";
      } else {
        address = [opt.label, opt.detail].filter(Boolean).join(" — ");
      }
    }
    const phone = customer.phone?.trim() || null;
    return JSON.stringify({
      customerId: customer.id,
      lines: lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
      })),
      paymentMethod: payment,
      shippingAddress: address,
      shippingPhone: phone,
    });
  }, [customer, lines, payment, shipChoice, shipOptions]);

  const banner = errorMessage(initialError);

  return (
    <div className="space-y-6">
      {banner ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {banner}
        </p>
      ) : null}

      <form action={createPosInvoiceAction} className="space-y-6">
        <input type="hidden" name="payload" value={payloadJson} readOnly />

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Productos</h2>
              <div className="relative mt-5">
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar por nombre o código"
                  className={inputClass}
                  autoComplete="off"
                />
                {productQuery.trim().length > 0 ? (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                    {productLoading ? (
                      <p className="px-3 py-2 text-sm text-zinc-500">Buscando…</p>
                    ) : productHits.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</p>
                    ) : (
                      productHits.map((p) => {
                        const stock = Number(p.stock_local ?? p.stock_quantity ?? 0);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProduct(p)}
                            disabled={stock < 1}
                            className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="font-medium text-zinc-900">{p.name}</span>
                            <span className="text-xs text-zinc-500">
                              {p.reference ? `${p.reference} · ` : null}
                              {formatCop(Number(p.price_cents ?? 0))}
                              {stock < 6 ? ` · Stock tienda: ${stock}` : null}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Productos seleccionados</h2>
              {lines.length === 0 ? (
                <p className="mt-5 text-sm text-zinc-500">
                  Agrega productos desde la búsqueda.
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-zinc-100">
                  {lines.map((line) => {
                    const stock = Number(
                      line.product.stock_local ?? line.product.stock_quantity ?? 0,
                    );
                    const lineTotal = Number(line.product.price_cents ?? 0) * line.quantity;
                    return (
                      <li
                        key={line.key}
                        className="flex flex-wrap items-center gap-3 py-4 first:pt-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900">{line.product.name}</p>
                          <p className="text-xs text-zinc-500">
                            {formatCop(Number(line.product.price_cents ?? 0))} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                            onClick={() => setQty(line.key, line.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                            onClick={() => setQty(line.key, line.quantity + 1)}
                            disabled={line.quantity >= stock}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-zinc-900">
                          {formatCop(lineTotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>
                Cliente <span className="text-red-600">*</span>
              </h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <input
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Buscar por nombre, cédula, email o teléfono"
                    className={inputClass}
                    disabled={!!customer}
                    autoComplete="off"
                  />
                  {!customer && customerQuery.trim().length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                      {customerLoading ? (
                        <p className="px-3 py-2 text-sm text-zinc-500">Buscando…</p>
                      ) : customerHits.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</p>
                      ) : (
                        customerHits.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCustomer(c);
                              setCustomerQuery("");
                              setCustomerHits([]);
                            }}
                            className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50"
                          >
                            <span className="font-medium text-zinc-900">{c.name}</span>
                            <span className="text-xs text-zinc-500">
                              {[c.document_id, c.email, c.phone].filter(Boolean).join(" · ")}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
                <Link
                  href="/admin/customers/new"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-100"
                >
                  + Nuevo cliente
                </Link>
              </div>
              {customer ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm">
                  <span className="font-medium text-zinc-900">{customer.name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline"
                    onClick={() => {
                      setCustomer(null);
                      setShipChoice(null);
                      setShipOptions([]);
                    }}
                  >
                    Cambiar
                  </button>
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className={`${sectionTitle} flex items-center gap-2`}>
                <IconHome />
                Envío
              </h2>
              {!customer ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Selecciona un cliente para habilitar el envío
                </p>
              ) : shipLoading ? (
                <p className="mt-4 text-sm text-zinc-500">Cargando direcciones…</p>
              ) : (
                <div className="mt-4">
                  <label className={labelClass}>Entrega</label>
                  <select
                    value={shipChoice ?? shipOptions[0]?.id ?? ""}
                    onChange={(e) => setShipChoice(e.target.value || null)}
                    className={inputClass}
                  >
                    {shipOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                        {o.kind === "address" ? ` — ${o.detail}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Método de pago</h2>
              <div className="mt-4 flex rounded-xl border border-zinc-200 bg-zinc-100 p-1">
                {(
                  [
                    { id: "cash" as const, label: "Efectivo", icon: <IconCoin /> },
                    { id: "transfer" as const, label: "Transferencia", icon: <IconCard /> },
                    { id: "mixed" as const, label: "Mixto", icon: <IconGrid /> },
                  ] as const
                ).map((tab) => {
                  const active = payment === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPayment(tab.id)}
                      className={[
                        "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:flex-row sm:text-sm",
                        active
                          ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800",
                      ].join(" ")}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {payment === "cash" ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Cuánto me dieron</label>
                    <input
                      value={cashGivenRaw}
                      onChange={(e) => setCashGivenRaw(e.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cuánto regreso</label>
                    <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold tabular-nums text-zinc-900">
                      {changeCents !== null ? formatCop(changeCents) : "—"}
                    </p>
                  </div>
                </div>
              ) : null}

              {payment === "transfer" ? (
                <div className="mt-5">
                  <label className={labelClass}>Referencia (opcional)</label>
                  <input
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    className={inputClass}
                    placeholder="Ej. comprobante #12345"
                  />
                </div>
              ) : null}

              {payment === "mixed" ? (
                <div className="mt-5 space-y-4">
                  <p className="text-xs text-zinc-500">
                    Los importes en efectivo y transferencia deben sumar el total exacto.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Efectivo</label>
                      <input
                        value={mixedCashRaw}
                        onChange={(e) => setMixedCashRaw(e.target.value)}
                        inputMode="numeric"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Transferencia</label>
                      <input
                        value={mixedTransferRaw}
                        onChange={(e) => setMixedTransferRaw(e.target.value)}
                        inputMode="numeric"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {!mixedOk && totalCents > 0 ? (
                    <p className="text-xs font-medium text-amber-700">
                      La suma debe ser {formatCop(totalCents)}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Resumen</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2 text-zinc-700">
                  <dt>Subtotal</dt>
                  <dd className="font-medium tabular-nums">{formatCop(subtotalCents)}</dd>
                </div>
                <div className="border-t border-zinc-100 pt-3">
                  <div className="flex justify-between gap-2 font-bold text-zinc-900">
                    <dt>TOTAL</dt>
                    <dd className="tabular-nums">{formatCop(totalCents)}</dd>
                  </div>
                </div>
              </dl>
              <ConfirmInvoiceButton disabled={!canSubmit} />
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}
