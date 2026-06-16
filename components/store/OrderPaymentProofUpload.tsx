"use client";

import { useState } from "react";
import { uploadOrderPaymentProofAction } from "@/app/actions/order-payment-proof";

export function OrderPaymentProofUpload({
  orderId,
  token,
  disabled = false,
}: {
  orderId: string;
  token: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
        className="w-full bg-stone-900 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Subir comprobante de pago
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px]"
            aria-label="Cerrar"
            onClick={pending ? undefined : () => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-stone-900">
              Subir comprobante
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Después de hacer la transferencia, adjunta una foto o PDF del
              comprobante. Revisaremos el pago y te avisaremos por el enlace de
              seguimiento.
            </p>
            <form
              className="mt-5 space-y-4"
              action={async (formData) => {
                setPending(true);
                try {
                  await uploadOrderPaymentProofAction(formData);
                } finally {
                  setPending(false);
                }
              }}
            >
              <input type="hidden" name="order_id" value={orderId} />
              <input type="hidden" name="token" value={token} />
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-700">
                  Archivo
                </span>
                <input
                  type="file"
                  name="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                  disabled={pending}
                  className="mt-2 block w-full text-sm text-stone-700 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-stone-800"
                />
              </label>
              <p className="text-xs text-stone-500">
                JPG, PNG, WebP o PDF · máximo 8 MB
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {pending ? "Subiendo…" : "Enviar comprobante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
