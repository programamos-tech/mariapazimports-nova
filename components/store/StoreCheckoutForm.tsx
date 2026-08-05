"use client";

/**
 * Checkout en 2 pasos:
 * 1) Datos de envío esenciales
 * 2) Resumen + método de pago (Wompi o transferencia)
 */

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { startCheckout } from "@/app/actions/checkout";
import { createWompiCheckoutSession } from "@/app/actions/payments/create-wompi-session";
import { storeWompiSession } from "@/components/store/CheckoutWompiPayClient";
import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

export type CheckoutStep = 1 | 2;

type CheckoutFlowContextValue = {
  step: CheckoutStep;
  goToStep: (step: CheckoutStep) => void;
  continueToPayment: () => void;
};

const CheckoutFlowContext = createContext<CheckoutFlowContextValue | null>(
  null,
);

export function useCheckoutFlow() {
  const ctx = use(CheckoutFlowContext);
  if (!ctx) {
    throw new Error("useCheckoutFlow debe usarse dentro de StoreCheckoutForm");
  }
  return ctx;
}

type Props = {
  children: ReactNode;
  wompiEnabled: boolean;
  /** Si hubo error al pagar, arrancamos en el paso 2. */
  initialStep?: CheckoutStep;
};

export function StoreCheckoutForm({
  children,
  wompiEnabled,
  initialStep = 1,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<CheckoutStep>(initialStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const goToStep = useCallback((next: CheckoutStep) => {
    setError(null);
    setStep(next);
  }, []);

  const continueToPayment = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    setError(null);

    const requiredNames = [
      "firstName",
      "lastName",
      "address",
      "mobile",
      "shippingDepartmentCode",
      "shippingMunicipalityCode",
    ] as const;

    for (const name of requiredNames) {
      const el = form.elements.namedItem(name);
      const input = el instanceof RadioNodeList ? el[0] : el;
      if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLSelectElement ||
        input instanceof HTMLTextAreaElement
      ) {
        if (!String(input.value ?? "").trim()) {
          input.reportValidity();
          input.focus();
          setError(
            name.startsWith("shipping")
              ? "Elige departamento y municipio de envío."
              : "Completa los datos de envío para continuar.",
          );
          return;
        }
        if (!input.checkValidity()) {
          input.reportValidity();
          input.focus();
          return;
        }
      }
    }

    const emailEl = form.elements.namedItem("email");
    const emailInput =
      emailEl instanceof RadioNodeList ? emailEl[0] : emailEl;
    if (
      emailInput instanceof HTMLInputElement &&
      String(emailInput.value ?? "").trim() &&
      !emailInput.checkValidity()
    ) {
      emailInput.reportValidity();
      emailInput.focus();
      return;
    }

    setStep(2);
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      if (step !== 2) {
        e.preventDefault();
        continueToPayment();
        return;
      }

      const form = e.currentTarget;
      const fd = new FormData(form);
      const method = String(fd.get("paymentMethod") ?? "").trim();

      if (method === "bank_transfer") {
        setBusy(true);
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

      const emailVal = String(fd.get("email") ?? "").trim();
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        setError(
          "Para pagar en línea necesitas un email válido en los datos de envío.",
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
    [continueToPayment, step, wompiEnabled],
  );

  const value = useMemo(
    () => ({ step, goToStep, continueToPayment }),
    [step, goToStep, continueToPayment],
  );

  return (
    <CheckoutFlowContext value={value}>
      <form
        ref={formRef}
        action={startCheckout}
        onSubmit={onSubmit}
        className="relative"
      >
        {busy ? (
          <StoreLoadingScreen label="Creando tu pedido…" overlay />
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
    </CheckoutFlowContext>
  );
}

export function CheckoutStep({
  when,
  children,
  className = "",
}: {
  when: CheckoutStep;
  children: ReactNode;
  className?: string;
}) {
  const { step } = useCheckoutFlow();
  const active = step === when;
  return (
    <div
      className={active ? className : `hidden ${className}`.trim()}
      hidden={!active}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

export function CheckoutStepIndicator() {
  const { step, goToStep, continueToPayment } = useCheckoutFlow();

  return (
    <ol className="mb-5 flex flex-wrap items-center gap-x-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 sm:mb-6 sm:gap-x-3 sm:text-[11px]">
      <li>
        <button
          type="button"
          onClick={() => goToStep(1)}
          className={
            step === 1
              ? "text-stone-900"
              : "text-stone-500 transition hover:text-stone-900"
          }
          aria-current={step === 1 ? "step" : undefined}
        >
          <span className="tabular-nums">1</span>
          <span className="mx-1 text-stone-300">·</span>
          Envío
        </button>
      </li>
      <li aria-hidden className="text-stone-300">
        —
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            if (step === 2) return;
            continueToPayment();
          }}
          className={
            step === 2
              ? "text-stone-900"
              : "text-stone-400 transition hover:text-stone-800"
          }
          aria-current={step === 2 ? "step" : undefined}
        >
          <span className="tabular-nums">2</span>
          <span className="mx-1 text-stone-300">·</span>
          Resumen
        </button>
      </li>
      <li aria-hidden className="text-stone-300">
        —
      </li>
      <li className="cursor-default text-stone-300" title="Se abre al finalizar">
        <span className="tabular-nums">3</span>
        <span className="mx-1 text-stone-300">·</span>
        Confirmación
      </li>
    </ol>
  );
}

export function CheckoutContinueToPaymentButton({
  className,
}: {
  className?: string;
}) {
  const { continueToPayment } = useCheckoutFlow();
  return (
    <button type="button" onClick={continueToPayment} className={className}>
      Continuar al resumen
    </button>
  );
}

export function CheckoutBackToShippingButton({
  className,
}: {
  className?: string;
}) {
  const { goToStep } = useCheckoutFlow();
  return (
    <button type="button" onClick={() => goToStep(1)} className={className}>
      ← Volver a envío
    </button>
  );
}
