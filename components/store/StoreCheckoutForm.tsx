"use client";

/**
 * Formulario de checkout de la tienda.
 * - bank_transfer → action server startCheckout (redirect)
 * - wompi → crea sesión y navega a /checkout/pagar (página dedicada al Widget)
 *
 * No abre el Widget sobre /checkout: al vaciar el carrito Next re-renderiza
 * "bolsa vacía" y el overlay/loader quedaba colgado.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { startCheckout } from "@/app/actions/checkout";
import { createWompiCheckoutSession } from "@/app/actions/payments/create-wompi-session";
import { storeWompiSession } from "@/components/store/CheckoutWompiPayClient";
import { PaymentLoader } from "@/components/payments/PaymentLoader";

type Props = {
  children: ReactNode;
  wompiEnabled: boolean;
};

export function StoreCheckoutForm({ children, wompiEnabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

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
        storeWompiSession(session);

        // Navegación completa: corta cualquier overlay/pending de React
        // y abre Wompi en una página que no depende del carrito.
        window.location.assign(
          `/checkout/pagar?order_id=${encodeURIComponent(session.orderId)}&reference=${encodeURIComponent(session.reference)}`,
        );
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo iniciar el pago con Wompi",
        );
        setBusy(false);
      }
    },
    [wompiEnabled],
  );

  return (
    <form action={startCheckout} onSubmit={onSubmit} className="relative">
      {busy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
          <PaymentLoader label="Creando tu pedido…" />
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
        </div>
      ) : null}
    </form>
  );
}
