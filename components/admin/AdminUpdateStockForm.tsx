"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ProductQuantityInput,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import { formatQuantityInputGrouping } from "@/lib/money";

type MovementMode = "replace" | "add";
type StockLoc = "local" | "warehouse";

type Props = {
  productName: string;
  referenceLabel: string;
  stockLocal: number;
  stockWarehouse: number;
  formAction: (formData: FormData) => void;
  returnTo: string;
};

function fmtQty(n: number) {
  return n <= 0 ? "0" : formatQuantityInputGrouping(n);
}

export function AdminUpdateStockForm({
  productName,
  referenceLabel,
  stockLocal,
  stockWarehouse,
  formAction,
  returnTo,
}: Props) {
  const [movementMode, setMovementMode] = useState<MovementMode>("replace");
  const [location, setLocation] = useState<StockLoc>("local");
  const [quantity, setQuantity] = useState(0);

  const currentForLoc = location === "local" ? stockLocal : stockWarehouse;

  const stockAfter = useMemo(() => {
    if (movementMode === "replace") return quantity;
    return currentForLoc + quantity;
  }, [movementMode, quantity, currentForLoc]);

  const afterLabel = useMemo(() => {
    if (movementMode === "add" && quantity <= 0) return "—";
    return `${fmtQty(stockAfter)} unidades`;
  }, [movementMode, quantity, stockAfter]);

  const toggleBase =
    "flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300";
  const toggleInactive = "text-zinc-600 hover:bg-zinc-100/80";
  const toggleActive = "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/90";

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
      <input type="hidden" name="movement_mode" value={movementMode} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className={sectionTitle}>Producto y movimiento</h2>

          <div className="mt-6">
            <span className={labelClass}>Buscar producto</span>
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                {productName}{" "}
                <span className="font-mono text-zinc-600">({referenceLabel})</span>
              </p>
              <Link
                href="/admin/products"
                className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
              >
                Cambiar
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <span className={labelClass}>Tipo de movimiento</span>
            <div className="mt-2 flex rounded-xl border border-zinc-200 bg-zinc-100/90 p-1">
              <button
                type="button"
                className={`${toggleBase} ${movementMode === "replace" ? toggleActive : toggleInactive}`}
                onClick={() => setMovementMode("replace")}
              >
                Reemplazar stock
              </button>
              <button
                type="button"
                className={`${toggleBase} ${movementMode === "add" ? toggleActive : toggleInactive}`}
                onClick={() => setMovementMode("add")}
              >
                Entrada (sumar)
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Reemplazar: el valor que ingresás es el nuevo stock total en la ubicación elegida.
              Entrada: sumás esa cantidad al stock actual en esa ubicación.
            </p>
          </div>

          <div className="mt-8">
            <span className={labelClass}>Ubicación</span>
            <div className="mt-2 flex rounded-xl border border-zinc-200 bg-zinc-100/90 p-1">
              <button
                type="button"
                className={`${toggleBase} ${location === "local" ? toggleActive : toggleInactive}`}
                onClick={() => setLocation("local")}
              >
                Local
              </button>
              <button
                type="button"
                className={`${toggleBase} ${location === "warehouse" ? toggleActive : toggleInactive}`}
                onClick={() => setLocation("warehouse")}
              >
                Bodega
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Indicá si la entrada o el ajuste aplica al stock en local o en bodega.
            </p>
          </div>

          <div className="mt-8">
            <label htmlFor="stock-qty" className={labelClass}>
              Cantidad
            </label>
            <div className="mt-2">
              <ProductQuantityInput
                id="stock-qty"
                name="quantity"
                value={quantity}
                onChange={setQuantity}
              />
            </div>
          </div>

          <div className="mt-8">
            <label htmlFor="stock-reason" className={labelClass}>
              Motivo (opcional)
            </label>
            <textarea
              id="stock-reason"
              name="reason"
              rows={3}
              placeholder="Ej. Entrada por compra a proveedor"
              className="mt-2 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <h2 className={sectionTitle}>Resumen del movimiento</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Producto</dt>
              <dd className="max-w-[65%] text-right font-medium text-zinc-900">{productName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Tipo</dt>
              <dd className="text-right font-medium text-zinc-800">
                {movementMode === "replace" ? "Reemplazar stock" : "Entrada (sumar)"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Ubicación</dt>
              <dd className="text-right font-medium text-zinc-800">
                {location === "local" ? "Local" : "Bodega"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-4">
              <dt className="text-zinc-500">Stock actual</dt>
              <dd className="tabular-nums font-semibold text-zinc-900">{fmtQty(currentForLoc)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Después del movimiento</dt>
              <dd className="tabular-nums font-semibold text-zinc-900">{afterLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <h2 className={sectionTitle}>Paso final</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Cuando confirmes, se actualizará el inventario de este producto.
          </p>
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-zinc-200 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-300/80 transition hover:bg-zinc-300/90"
          >
            Actualizar stock
          </button>
        </section>
      </div>
    </form>
  );
}
