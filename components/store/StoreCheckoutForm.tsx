"use client";

/**
 * Formulario de checkout de la tienda.
 * - bank_transfer → action server startCheckout (redirect)
 * - wompi → createWompiCheckoutSession + Widget in-site
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
import { openWompiWidgetCheckout } from "@/components/payments/WompiCheckout";
import { PaymentLoader } from "@/components/payments/PaymentLoader";

type Props = {
  children: ReactNode;
  wompiEnabled: boolean;
};

export function StoreCheckoutForm({ children, wompiEnabled }: Props) {
  const router = useRouter();
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
        // Dejar que el action del form (startCheckout) haga el redirect.
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
        const returnUrl = `/checkout/return?order_id=${encodeURIComponent(session.orderId)}&reference=${encodeURIComponent(session.reference)}`;

        if (status === "APPROVED") {
          router.push(`${returnUrl}&widget=approved`);
          return;
        }
        if (
          status === "DECLINED" ||
          status === "ERROR" ||
          status === "VOIDED"
        ) {
          router.push(`${returnUrl}&widget=${status.toLowerCase()}`);
          return;
        }
        router.push(`${returnUrl}&widget=pending`);
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
    [router, wompiEnabled],
  );

  return (
    <form action={startCheckout} onSubmit={onSubmit} className="relative">
      {busy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
          <PaymentLoader label="Procesando tu pedido y abriendo Wompi…" />
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
