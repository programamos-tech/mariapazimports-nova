"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ProductQuantityInput,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import { formatQuantityInputGrouping } from "@/lib/money";

export type TransferDirection = "local_to_warehouse" | "warehouse_to_local";

type Props = {
  productName: string;
  stockLocal: number;
  stockWarehouse: number;
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
  formAction,
  returnTo,
}: Props) {
  const [direction, setDirection] = useState<TransferDirection>("local_to_warehouse");
  const [quantity, setQuantity] = useState(0);

  const fromLocal = direction === "local_to_warehouse";
  const available = fromLocal ? stockLocal : stockWarehouse;

  const { afterLocal, afterWh } = useMemo(() => {
    if (quantity <= 0) {
      return { afterLocal: stockLocal, afterWh: stockWarehouse };
    }
    const q = Math.min(quantity, available);
    if (fromLocal) {
      return {
        afterLocal: stockLocal - q,
        afterWh: stockWarehouse + q,
      };
    }
    return {
      afterLocal: stockLocal + q,
      afterWh: stockWarehouse - q,
    };
  }, [quantity, available, fromLocal, stockLocal, stockWarehouse]);

  const directionSummary = fromLocal
    ? "Local → Bodega · movés desde el mostrador hacia bodega"
    : "Bodega → Local · movés desde bodega al mostrador";

  const toggleWrap = "flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 gap-1";
  const toggleActive = "flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-center text-sm font-semibold text-white shadow-sm";
  const toggleIdle =
    "flex-1 rounded-lg px-3 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-white/70";

  return (
    <form
      action={formAction}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:items-start"
    >
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <span className={labelClass}>Producto</span>
            <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm font-medium text-zinc-900">
              {productName}
            </div>
          </div>

          <div className="mt-8">
            <span className={labelClass}>Stock actual</span>
            <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/90 p-4">
              <div>
                <p className="text-xs font-semibold text-zinc-500">Local</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">{fmtQty(stockLocal)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">Bodega</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">{fmtQty(stockWarehouse)}</p>
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
                Local → Bodega
              </button>
              <button
                type="button"
                className={!fromLocal ? toggleActive : toggleIdle}
                onClick={() => setDirection("warehouse_to_local")}
              >
                Bodega → Local
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Disponible para mover desde el origen:{" "}
              <span className="font-semibold text-zinc-700">{fmtQty(available)} u.</span>
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
            className="mt-10 w-full rounded-xl bg-zinc-200 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-300/80 transition hover:bg-zinc-300/90"
          >
            Transferir
          </button>
        </section>
      </div>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6">
          <h2 className={sectionTitle}>Operación</h2>
          <p className="mt-4 text-sm font-medium text-zinc-900">{productName}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{directionSummary}</p>
          {quantity > 0 && quantity <= available ? (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
              <p className="font-semibold text-zinc-800">Después del traslado</p>
              <p className="mt-2 tabular-nums text-zinc-700">
                Local: <span className="font-semibold">{fmtQty(afterLocal)}</span>
                <span className="mx-2 text-zinc-300">·</span>
                Bodega: <span className="font-semibold">{fmtQty(afterWh)}</span>
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-zinc-500">
              Escribí una cantidad válida para ver cómo quedará el stock en local y en bodega.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200/90 bg-white px-5 py-4 text-xs leading-relaxed text-zinc-600">
          <ul className="list-disc space-y-2 pl-4 marker:text-zinc-400">
            <li>
              El total en listado y en la ficha del producto sigue siendo la suma de local + bodega.
            </li>
            <li>
              Esta acción solo mueve unidades entre los dos depósitos; no crea ni elimina productos.
            </li>
            <li>
              Si usás ubicaciones detalladas en bodega, el total de bodega sigue reflejado en la columna
              agregada.
            </li>
          </ul>
          <p className="mt-4">
            <Link href="/admin/products" className="font-medium text-zinc-800 underline decoration-zinc-300">
              Cambiar de producto
            </Link>
          </p>
        </div>
      </aside>
    </form>
  );
}
