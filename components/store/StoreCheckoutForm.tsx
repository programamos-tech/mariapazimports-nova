"use client";

/**
 * Formulario de checkout de la tienda.
 * - bank_transfer → action server startCheckout (redirect)
 * - wompi → createWompiCheckoutSession + Widget in-site
 *
 * Importante: el overlay de carga se quita ANTES de abrir el Widget.
 * Si se deja encima, tapa el modal de Wompi y el checkout queda colgado
 * (el carrito ya se vació al crear el pedido).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { startCheckout } from "@/app/actions/checkout";
import { createWompiCheckoutSession } from "@/app/actions/payments/create-wompi-session";
import {
  openWompiWidgetCheckout,
  type WompiCheckoutSession,
} from "@/components/payments/WompiCheckout";
import { PaymentLoader } from "@/components/payments/PaymentLoader";

type Props = {
  children: ReactNode;
  wompiEnabled: boolean;
};

export function StoreCheckoutForm({ children, wompiEnabled }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [waitingWidget, setWaitingWidget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] =
    useState<WompiCheckoutSession | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const goToReturn = useCallback(
    (session: WompiCheckoutSession, widgetStatus: string) => {
      const returnUrl = `/checkout/return?order_id=${encodeURIComponent(session.orderId)}&reference=${encodeURIComponent(session.reference)}&widget=${encodeURIComponent(widgetStatus)}`;
      router.push(returnUrl);
    },
    [router],
  );

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const method = String(fd.get("paymentMethod") ?? "").trim();

      if (method === "bank_transfer") {
        return;
      }

      e.preventDefault();
      setError(null);
      setActiveSession(null);

      if (!method || method !== "wompi") {
        setError("Elige un método de pago disponible para continuar.");
        return;
      }

      if (!wompiEnabled) {
        setError(
          "El pago en línea no está disponible todavía. Usa transferencia bancaria o vuelve más tarde.",
        );
        return;
      }

      setBusy(true);

      try {
        const result = await createWompiCheckoutSession(fd);
        if (!result.ok) {
          setError(result.error);
          setBusy(false);
          return;
        }

        const session = result.session;
        setActiveSession(session);

        // Quitar overlay opaco ANTES de abrir Wompi (si no, tapa el modal).
        setBusy(false);
        setWaitingWidget(true);

        const email = String(fd.get("email") ?? "").trim() || undefined;
        const first = String(fd.get("firstName") ?? "").trim();
        const last = String(fd.get("lastName") ?? "").trim();
        const fullName = [first, last].filter(Boolean).join(" ") || undefined;

        const widgetResult = await openWompiWidgetCheckout({
          session,
          customerEmail: email,
          customerFullName: fullName,
        });

        const status = (
          widgetResult?.transaction?.status ?? "PENDING"
        ).toUpperCase();

        setWaitingWidget(false);

        if (status === "APPROVED") {
          goToReturn(session, "approved");
          return;
        }
        if (
          status === "DECLINED" ||
          status === "ERROR" ||
          status === "VOIDED"
        ) {
          goToReturn(session, status.toLowerCase());
          return;
        }
        goToReturn(session, "pending");
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setWaitingWidget(false);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo iniciar el pago con Wompi",
        );
        setBusy(false);
      }
    },
    [goToReturn, wompiEnabled],
  );

  return (
    <form action={startCheckout} onSubmit={onSubmit} className="relative">
      {busy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
          <PaymentLoader label="Creando tu pedido…" />
        </div>
      ) : null}

      {waitingWidget && activeSession ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[40] border-t border-stone-200 bg-white/95 px-4 py-3 text-center text-sm text-stone-700 shadow-lg">
          Completa el pago en la ventana de Wompi. Si la cierras, te llevaremos
          al resultado del pedido.
          <span className="mt-1 block font-mono text-xs text-stone-500">
            Ref. {activeSession.reference}
          </span>
        </div>
      ) : null}

      {children}

      {error ? (
        <div
          ref={errorRef}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-900 shadow-lg lg:static lg:mt-4 lg:border lg:text-left lg:shadow-none"
          role="alert"
        >
          {error}
          {activeSession ? (
            <p className="mt-2 text-xs">
              Pedido ya creado.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => goToReturn(activeSession, "pending")}
              >
                Ver estado del pago
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
