"use client";

/**
 * Página intermedia: abre el Widget Wompi sin depender del carrito/checkout.
 * Evita el bug donde vaciar el carrito re-renderiza /checkout como bolsa vacía
 * y deja el loader/overlay colgado.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resumeWompiCheckoutSession } from "@/app/actions/payments/resume-wompi-session";
import {
  openWompiWidgetCheckout,
  type WompiCheckoutSession,
} from "@/components/payments/WompiCheckout";
import { PaymentLoader } from "@/components/payments/PaymentLoader";
import { storeShellClass } from "@/lib/store-layout";

const STORAGE_PREFIX = "wompi_checkout_session:";

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  try {
    return `No se pudo abrir la pasarela de pago (${JSON.stringify(err)})`;
  } catch {
    return "No se pudo abrir la pasarela de pago";
  }
}

export function readStoredWompiSession(
  reference: string,
): WompiCheckoutSession | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${reference}`);
    if (!raw) return null;
    return JSON.parse(raw) as WompiCheckoutSession;
  } catch {
    return null;
  }
}

export function storeWompiSession(session: WompiCheckoutSession): void {
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}${session.reference}`,
      JSON.stringify(session),
    );
  } catch {
    /* private mode / quota */
  }
}

type Props = {
  orderId: string;
  reference: string;
};

export function CheckoutWompiPayClient({ orderId, reference }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "widget" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        let session = readStoredWompiSession(reference);
        if (!session || session.orderId !== orderId) {
          const resumed = await resumeWompiCheckoutSession(reference);
          if (!resumed.ok) {
            throw new Error(resumed.error);
          }
          session = resumed.session;
          storeWompiSession(session);
        }

        if (cancelled) return;
        setPhase("widget");

        const widgetResult = await openWompiWidgetCheckout({
          session,
          timeoutMs: 20 * 60 * 1000,
        });

        if (cancelled) return;

        // El correo de confirmación solo se envía cuando Wompi marca APPROVED
        // (webhook/reconcile). Acá solo navegamos al pedido creado.
        void widgetResult;

        const tracking = session.trackingToken?.trim();
        if (tracking) {
          router.replace(
            `/pedidos/seguimiento/${encodeURIComponent(tracking)}`,
          );
          return;
        }
        router.replace(`/cuenta/pedidos/${encodeURIComponent(orderId)}`);
      } catch (err) {
        if (cancelled) return;
        setPhase("error");
        setError(errorMessage(err));
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId, reference, router]);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white">
      <div className={`${storeShellClass} max-w-lg space-y-6 py-16`}>
        <h1 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-stone-900">
          Pago seguro
        </h1>

        {phase === "loading" || phase === "widget" ? (
          <div className="border border-stone-200 px-6 py-10 text-center">
            <PaymentLoader
              label={
                phase === "loading"
                  ? "Preparando Wompi…"
                  : "Completa el pago en la ventana de Wompi"
              }
            />
            <p className="mt-4 font-mono text-xs text-stone-500">
              Ref. {reference}
            </p>
            <p className="mt-2 text-xs text-stone-500">
              Si no ves la ventana de pago, desactiva bloqueadores o inténtalo de
              nuevo.
            </p>
            <button
              type="button"
              className="mt-6 text-sm font-medium text-stone-900 underline"
              onClick={() =>
                router.replace(`/cuenta/pedidos/${encodeURIComponent(orderId)}`)
              }
            >
              Ir a mi pedido
            </button>
          </div>
        ) : null}

        {phase === "error" && error ? (
          <div
            className="border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900"
            role="alert"
          >
            <p>{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
              type="button"
              className="underline"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
              <button
                type="button"
                className="underline"
                onClick={() =>
                  router.replace(
                    `/cuenta/pedidos/${encodeURIComponent(orderId)}`,
                  )
                }
              >
                Ver pedido
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
