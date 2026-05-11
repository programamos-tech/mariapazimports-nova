"use client";

import { useState } from "react";
import { registerSupplierInvoicePaymentAction } from "@/app/actions/admin/suppliers";
import { productInputOnWhiteClass } from "@/components/admin/product-form-primitives";

export function SupplierAbonoForm({
  invoiceId,
  supplierId,
  pendingCents,
}: {
  invoiceId: string;
  supplierId: string;
  pendingCents: number;
}) {
  const [open, setOpen] = useState(false);
  if (pendingCents <= 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
      >
        + Registrar abono
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
          <p className="text-xs text-zinc-500">
            Saldo pendiente según factura. Ingresá el monto en pesos COP (entero, sin puntos ni comas).
          </p>
          <form action={registerSupplierInvoicePaymentAction} className="mt-4 space-y-3">
            <input type="hidden" name="invoice_id" value={invoiceId} />
            <input type="hidden" name="supplier_id" value={supplierId} />
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Monto (COP)
              </label>
              <input
                name="amount_cents"
                type="number"
                min={1}
                max={pendingCents}
                required
                placeholder="Ej. 500000"
                className={productInputOnWhiteClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Método
              </label>
              <select name="payment_method" className={productInputOnWhiteClass} defaultValue="transferencia">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Notas (opcional)
              </label>
              <input name="notes" type="text" className={productInputOnWhiteClass} placeholder="Referencia banco…" />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Guardar abono
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Cerrar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
