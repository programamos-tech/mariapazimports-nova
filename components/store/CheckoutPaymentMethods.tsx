"use client";

import { useState } from "react";
import { TransferBankDetails } from "@/components/store/TransferBankDetails";

type Props = {
  bankTransferEnabled: boolean;
  wompiEnabled: boolean;
};

export function CheckoutPaymentMethods({
  bankTransferEnabled,
  wompiEnabled,
}: Props) {
  const defaultMethod: "wompi" | "bank_transfer" =
    wompiEnabled ? "wompi" : bankTransferEnabled ? "bank_transfer" : "wompi";
  const [method, setMethod] = useState<"wompi" | "bank_transfer">(defaultMethod);

  return (
    <>
      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">Elige método de pago</legend>

        {wompiEnabled ? (
          <label
            className={
              method === "wompi"
                ? "flex cursor-pointer items-start gap-3 border border-stone-900 bg-white p-4 ring-1 ring-stone-900"
                : "flex cursor-pointer items-start gap-3 border border-stone-200 bg-white p-4 transition hover:border-stone-400"
            }
          >
            <input
              type="radio"
              name="paymentMethod"
              value="wompi"
              checked={method === "wompi"}
              onChange={() => setMethod("wompi")}
              className="mt-0.5 size-4 shrink-0 border-stone-400 text-stone-900 focus:ring-stone-900"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-900">
                Pago en línea (Wompi)
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Tarjeta, PSE y otros medios en esta misma página.
              </span>
            </span>
          </label>
        ) : (
          <label className="flex cursor-not-allowed items-start gap-3 border border-stone-200 bg-stone-50 p-4 opacity-60">
            <input type="radio" disabled className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-stone-600">
                Pago en línea (Wompi){" "}
                <span className="text-stone-400">(no disponible)</span>
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Falta configurar las llaves de Wompi en el servidor.
              </span>
            </span>
          </label>
        )}

        {bankTransferEnabled ? (
          <label
            className={
              method === "bank_transfer"
                ? "flex cursor-pointer items-start gap-3 border border-stone-900 bg-white p-4 ring-1 ring-stone-900"
                : "flex cursor-pointer items-start gap-3 border border-stone-200 bg-white p-4 transition hover:border-stone-400"
            }
          >
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={method === "bank_transfer"}
              onChange={() => setMethod("bank_transfer")}
              className="mt-0.5 size-4 border-stone-400 text-stone-900 focus:ring-stone-900"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-900">
                Transferencia bancaria
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-stone-500">
                Transfiere el valor total y sube tu comprobante para confirmar el
                pedido.
              </span>
            </span>
          </label>
        ) : (
          <label className="flex cursor-not-allowed items-center gap-3 border border-stone-200 bg-stone-50 p-4 opacity-60">
            <input type="radio" disabled className="size-4" />
            <span className="text-sm text-stone-600">
              Transferencia bancaria{" "}
              <span className="text-stone-400">(próximamente)</span>
            </span>
          </label>
        )}
      </fieldset>

      {method === "bank_transfer" && bankTransferEnabled ? (
        <TransferBankDetails compact />
      ) : null}

      {method === "wompi" && wompiEnabled ? (
        <p className="mt-5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span className="font-medium uppercase tracking-wide text-stone-700">
            Medios típicos
          </span>
          <span className="border border-stone-200 px-2 py-0.5 font-mono text-[10px] tracking-wide">
            VISA
          </span>
          <span className="border border-stone-200 px-2 py-0.5 font-mono text-[10px] tracking-wide">
            MC
          </span>
          <span className="border border-stone-200 px-2 py-0.5 font-mono text-[10px] tracking-wide">
            PSE
          </span>
        </p>
      ) : null}
    </>
  );
}
