"use client";

import { useState } from "react";

export function CheckoutPaymentMethods({
  bankTransferEnabled,
  wompiEnabled,
  compact = false,
}: {
  bankTransferEnabled: boolean;
  wompiEnabled: boolean;
  compact?: boolean;
}) {
  const defaultMethod: "wompi" | "bank_transfer" =
    wompiEnabled ? "wompi" : bankTransferEnabled ? "bank_transfer" : "wompi";
  const [method, setMethod] = useState<"wompi" | "bank_transfer">(defaultMethod);

  const optionClass = (active: boolean) =>
    active
      ? "flex cursor-pointer items-start gap-2.5 border border-stone-900 bg-white p-3"
      : "flex cursor-pointer items-start gap-2.5 border border-stone-200 bg-white p-3 transition hover:border-stone-400";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          Método de pago
        </p>
      ) : (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          Cómo pagar
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="sr-only">Elige método de pago</legend>

        {wompiEnabled ? (
          <label className={optionClass(method === "wompi")}>
            <input
              type="radio"
              name="paymentMethod"
              value="wompi"
              checked={method === "wompi"}
              onChange={() => setMethod("wompi")}
              className="mt-0.5 size-3.5 shrink-0 border-stone-400 text-stone-900 focus:ring-stone-900"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-900">
                Wompi
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">
                Tarjeta, PSE y más
              </span>
            </span>
          </label>
        ) : (
          <label className="flex cursor-not-allowed items-start gap-2.5 border border-stone-200 bg-stone-50 p-3 opacity-60">
            <input type="radio" disabled className="mt-0.5 size-3.5 shrink-0" />
            <span className="text-sm text-stone-600">
              Wompi <span className="text-stone-400">(no disponible)</span>
            </span>
          </label>
        )}

        {bankTransferEnabled ? (
          <label className={optionClass(method === "bank_transfer")}>
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={method === "bank_transfer"}
              onChange={() => setMethod("bank_transfer")}
              className="mt-0.5 size-3.5 shrink-0 border-stone-400 text-stone-900 focus:ring-stone-900"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-900">
                Transferencia
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">
                Datos y comprobante en el paso 3
              </span>
            </span>
          </label>
        ) : (
          <label className="flex cursor-not-allowed items-center gap-2.5 border border-stone-200 bg-stone-50 p-3 opacity-60">
            <input type="radio" disabled className="size-3.5" />
            <span className="text-sm text-stone-600">
              Transferencia{" "}
              <span className="text-stone-400">(próximamente)</span>
            </span>
          </label>
        )}
      </fieldset>
    </div>
  );
}
