"use client";

/**
 * Cliente del Widget Checkout Wompi (in-site).
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 *
 * No marca el pedido como pagado: eso lo hace el webhook / reconcile.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentLoader } from "@/components/payments/PaymentLoader";
import type { CreateWompiCheckoutSessionResult } from "@/types/payment";
import type {
  WidgetCheckoutParams,
  WompiWidgetCheckoutResult,
} from "@/types/wompi";
import { buildWompiCustomerData } from "@/types/wompi";

const WIDGET_SCRIPT = "https://checkout.wompi.co/widget.js";

export type WompiCheckoutSession = CreateWompiCheckoutSessionResult;

type Props = {
  /** Sesión ya creada en servidor (referencia, firma, monto en centavos Wompi). */
  session: WompiCheckoutSession;
  customerEmail?: string;
  customerFullName?: string;
  onSuccess?: (result: {
    transactionId: string;
    status: string;
    reference: string;
    orderId: string;
  }) => void;
  onError?: (message: string) => void;
  onPending?: (result: {
    transactionId: string;
    status: string;
    reference: string;
    orderId: string;
  }) => void;
  /** Si true, abre el widget al montar. */
  autoOpen?: boolean;
  className?: string;
};

function loadWompiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window no disponible"));
  }
  if (window.WidgetCheckout) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${WIDGET_SCRIPT}"]`,
  );
  if (existing) {
    // Ya terminó de cargar (éxito o fallo) → no esperar eventos que no volverán.
    if (existing.dataset.wompiLoaded === "1" || window.WidgetCheckout) {
      if (window.WidgetCheckout) return Promise.resolve();
      return Promise.reject(new Error("No se pudo cargar el Widget Wompi"));
    }
    return new Promise((resolve, reject) => {
      existing.addEventListener(
        "load",
        () => {
          existing.dataset.wompiLoaded = "1";
          if (window.WidgetCheckout) resolve();
          else reject(new Error("WidgetCheckout no disponible tras cargar el script"));
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar el Widget Wompi")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => {
      script.dataset.wompiLoaded = "1";
      if (window.WidgetCheckout) resolve();
      else reject(new Error("WidgetCheckout no disponible tras cargar el script"));
    };
    script.onerror = () =>
      reject(new Error("No se pudo cargar el Widget Wompi (bloqueado o red)"));
    document.body.appendChild(script);
  });
}

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


async function reconcileStatus(
  reference: string,
  transactionId: string,
): Promise<{ status: string; statusMessage?: string | null } | null> {
  const qs = new URLSearchParams({ reference, transactionId });
  const res = await fetch(`/api/payments/wompi/status?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    ok?: boolean;
    payment?: { status: string; statusMessage?: string | null };
  };
  return json.payment ?? null;
}

export function WompiCheckout({
  session,
  customerEmail,
  customerFullName,
  onSuccess,
  onError,
  onPending,
  autoOpen = false,
  className = "",
}: Props) {
  const [busy, setBusy] = useState(false);
  const openedRef = useRef(false);

  const openWidget = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await loadWompiScript();
      if (!window.WidgetCheckout) {
        throw new Error("WidgetCheckout no disponible");
      }

      const customerData = buildWompiCustomerData({
        email: customerEmail,
        fullName: customerFullName,
      });

      const params: WidgetCheckoutParams = {
        currency: session.currency,
        amountInCents: session.amountInCents,
        reference: session.reference,
        publicKey: session.publicKey,
        signature: { integrity: session.integritySignature },
        redirectUrl: session.redirectUrl,
        ...(customerData ? { customerData } : {}),
      };

      const checkout = new window.WidgetCheckout(params);
      checkout.open(async (result: WompiWidgetCheckoutResult) => {
        const txn = result?.transaction;
        const transactionId = txn?.id ?? "";
        const status = (txn?.status ?? "PENDING").toUpperCase();

        if (transactionId) {
          try {
            await reconcileStatus(session.reference, transactionId);
          } catch {
            // El webhook sigue siendo la fuente de verdad.
          }
        }

        const payload = {
          transactionId,
          status,
          reference: session.reference,
          orderId: session.orderId,
        };

        if (status === "APPROVED") {
          onSuccess?.(payload);
        } else if (
          status === "DECLINED" ||
          status === "ERROR" ||
          status === "VOIDED"
        ) {
          onError?.(
            `Pago ${status.toLowerCase()}. Si el cobro no se refleja, contacta soporte con la referencia ${session.reference}.`,
          );
        } else {
          onPending?.(payload);
        }
        setBusy(false);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo abrir Wompi";
      onError?.(message);
      setBusy(false);
    }
  }, [
    busy,
    customerEmail,
    customerFullName,
    onError,
    onPending,
    onSuccess,
    session,
  ]);

  useEffect(() => {
    if (!autoOpen || openedRef.current) return;
    openedRef.current = true;
    void openWidget();
  }, [autoOpen, openWidget]);

  return (
    <div className={className}>
      {busy ? <PaymentLoader label="Abriendo pasarela Wompi…" /> : null}
      {!autoOpen ? (
        <button
          type="button"
          onClick={() => void openWidget()}
          disabled={busy}
          className="inline-flex w-full items-center justify-center bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          Pagar con Wompi
        </button>
      ) : null}
    </div>
  );
}

/** Abre el widget sin montar UI (para el submit del checkout). */
export async function openWompiWidgetCheckout(input: {
  session: WompiCheckoutSession;
  customerEmail?: string;
  customerFullName?: string;
  /** Si el usuario no completa, evita colgar el UI para siempre. */
  timeoutMs?: number;
}): Promise<WompiWidgetCheckoutResult> {
  await loadWompiScript();
  if (!window.WidgetCheckout) {
    throw new Error("WidgetCheckout no disponible");
  }

  const customerData = buildWompiCustomerData({
    email: input.customerEmail ?? input.session.customerEmail,
    fullName: input.customerFullName ?? input.session.customerFullName,
    phoneNumber: input.session.customerPhone,
    phoneNumberPrefix: "+57",
  });

  const params: WidgetCheckoutParams = {
    currency: input.session.currency,
    amountInCents: input.session.amountInCents,
    reference: input.session.reference,
    publicKey: input.session.publicKey,
    signature: { integrity: input.session.integritySignature },
    redirectUrl: input.session.redirectUrl,
    ...(customerData ? { customerData } : {}),
  };

  const timeoutMs = input.timeoutMs ?? 15 * 60 * 1000;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result: WompiWidgetCheckoutResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      // No rechazar: el pedido ya existe; el return page hará poll.
      resolve({
        transaction: {
          id: "",
          status: "PENDING",
          reference: input.session.reference,
        },
      });
    }, timeoutMs);

    try {
      const checkout = new window.WidgetCheckout!(params);
      checkout.open((result) => {
        void (async () => {
          const txnId = result?.transaction?.id;
          if (txnId) {
            try {
              await reconcileStatus(input.session.reference, txnId);
            } catch {
              /* webhook es la fuente de verdad */
            }
          }
          finish(result ?? { transaction: { id: "", status: "PENDING" } });
        })();
      });
    } catch (err) {
      window.clearTimeout(timer);
      settled = true;
      reject(err);
    }
  });
}
