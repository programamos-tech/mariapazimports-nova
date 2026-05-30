"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ProductQuantityInput,
  productInputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import type { AdminVariantStockOption } from "@/components/admin/AdminUpdateStockForm";
import { formatQuantityInputGrouping } from "@/lib/money";
import {
  STOCK_LOCAL_SHORT_LABEL,
  STOCK_TRANSFER_PREVIEW_HELP,
  STOCK_TRANSFER_TO_LOCAL,
  STOCK_TRANSFER_TO_LOCAL_SUMMARY,
  STOCK_TRANSFER_TO_WAREHOUSE,
  STOCK_TRANSFER_TO_WAREHOUSE_SUMMARY,
  STOCK_TRANSFER_TOTAL_NOTE,
  STOCK_WAREHOUSE_SHELF_NOTE,
  STOCK_WAREHOUSE_SHORT_LABEL,
} from "@/lib/stock-locations";

export type TransferDirection = "local_to_warehouse" | "warehouse_to_local";

type Props = {
  productName: string;
  stockLocal: number;
  stockWarehouse: number;
  variants?: AdminVariantStockOption[];
  formAction: (formData: FormData) => void;
  returnTo: string;
};

function fmtQty(n: number) {
  return n <= 0 ? "0" : formatQuantityInputGrouping(n);
}

export function AdminTransferStockForm({
  productName,
  stockLocal,
  stockWarehouse,
  variants = [],
  formAction,
  returnTo,
}: Props) {
  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [direction, setDirection] = useState<TransferDirection>("local_to_warehouse");
  const [quantity, setQuantity] = useState(0);

  const selectedVariant =
    variants.find((v) => v.id === variantId) ?? variants[0] ?? null;
  const effectiveLocal = selectedVariant?.stockLocal ?? stockLocal;
  const effectiveWarehouse = selectedVariant?.stockWarehouse ?? stockWarehouse;

  const fromLocal = direction === "local_to_warehouse";
  const available = fromLocal ? effectiveLocal : effectiveWarehouse;

  const { afterLocal, afterWh } = useMemo(() => {
    if (quantity <= 0) {
      return { afterLocal: effectiveLocal, afterWh: effectiveWarehouse };
    }
    const q = Math.min(quantity, available);
    if (fromLocal) {
      return {
        afterLocal: effectiveLocal - q,
        afterWh: effectiveWarehouse + q,
      };
    }
    return {
      afterLocal: effectiveLocal + q,
      afterWh: effectiveWarehouse - q,
    };
  }, [quantity, available, fromLocal, effectiveLocal, effectiveWarehouse]);

  const directionSummary = fromLocal
    ? STOCK_TRANSFER_TO_WAREHOUSE_SUMMARY
    : STOCK_TRANSFER_TO_LOCAL_SUMMARY;

  const cardBase =
    "rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";
  const shellMain = `${cardBase} p-6 sm:p-8`;

  const toggleWrap =
    "flex gap-1 rounded-xl border border-zinc-200/90 bg-zinc-100/70 p-1 dark:border-zinc-700 dark:bg-zinc-950/80";
  const toggleActive =
    "flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-center text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950";
  const toggleIdle =
    "flex-1 rounded-lg px-3 py-3 text-center text-sm font-medium text-zinc-700 transition hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-zinc-800/50";

  return (
    <form
      action={formAction}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:items-start"
    >
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="return_to" value={returnTo} />
      {hasVariants && selectedVariant ? (
        <input type="hidden" name="variant_id" value={selectedVariant.id} />
      ) : null}

      <div className="space-y-8">
        <section className={shellMain}>
          {hasVariants ? (
            <div className="mb-8">
              <span className={labelClass}>Presentación (SKU)</span>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className={`${productInputClass} mt-2 max-w-md`}
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <span className={labelClass}>Producto</span>
            <div className="mt-2 rounded-lg border border-zinc-200/90 bg-white/60 px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100">
              {productName}
              {selectedVariant ? (
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedVariant.label}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-8">
            <span className={labelClass}>Stock actual</span>
            <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl border border-zinc-200/90 bg-white/60 p-4 dark:border-zinc-700 dark:bg-zinc-950/60">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{STOCK_LOCAL_SHORT_LABEL}</p>
                <p className="mt-1 text-lg font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {fmtQty(effectiveLocal)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{STOCK_WAREHOUSE_SHORT_LABEL}</p>
                <p className="mt-1 text-lg font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {fmtQty(effectiveWarehouse)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <span className={labelClass}>Dirección</span>
            <div className={`mt-2 ${toggleWrap}`}>
              <button
                type="button"
                className={fromLocal ? toggleActive : toggleIdle}
                onClick={() => setDirection("local_to_warehouse")}
              >
                {STOCK_TRANSFER_TO_WAREHOUSE}
              </button>
              <button
                type="button"
                className={!fromLocal ? toggleActive : toggleIdle}
                onClick={() => setDirection("warehouse_to_local")}
              >
                {STOCK_TRANSFER_TO_LOCAL}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Disponible para mover desde el origen:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{fmtQty(available)} u.</span>
            </p>
          </div>

          <div className="mt-8">
            <label htmlFor="transfer-qty" className={labelClass}>
              Cantidad
            </label>
            <div className="mt-2">
              <ProductQuantityInput
                id="transfer-qty"
                name="quantity"
                value={quantity}
                onChange={setQuantity}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-10 w-full rounded-xl border border-zinc-900 bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Transferir
          </button>
        </section>
      </div>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-white/[0.06]">
          <h2 className={sectionTitle}>Operación</h2>
          <p className="mt-4 text-sm text-zinc-900 dark:text-zinc-100">{productName}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{directionSummary}</p>
          {quantity > 0 && quantity <= available ? (
            <div className="mt-5 rounded-xl border border-zinc-200/90 bg-white/60 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950/60">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Después del traslado</p>
              <p className="mt-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                {STOCK_LOCAL_SHORT_LABEL}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{fmtQty(afterLocal)}</span>
                <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
                {STOCK_WAREHOUSE_SHORT_LABEL}:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{fmtQty(afterWh)}</span>
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {STOCK_TRANSFER_PREVIEW_HELP}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200/90 bg-white px-5 py-4 text-xs leading-relaxed text-zinc-600 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none dark:ring-white/[0.06]">
          <ul className="list-disc space-y-2 pl-4 marker:text-zinc-400 dark:marker:text-zinc-500">
            <li>
              {hasVariants
                ? "El traslado aplica a la presentación elegida; el total del producto se recalcula."
                : STOCK_TRANSFER_TOTAL_NOTE}
            </li>
            <li>
              Esta acción solo mueve unidades entre los dos depósitos; no crea ni elimina productos.
            </li>
            <li>
              {STOCK_WAREHOUSE_SHELF_NOTE}
            </li>
          </ul>
          <p className="mt-4">
            <Link
              href="/admin/products"
              className="font-medium text-zinc-800 underline decoration-zinc-300 dark:text-zinc-200 dark:decoration-zinc-600"
            >
              Cambiar de producto
            </Link>
          </p>
        </div>
      </aside>
    </form>
  );
}
