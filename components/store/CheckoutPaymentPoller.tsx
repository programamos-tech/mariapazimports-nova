"use client";

import { useEffect, useState } from "react";
import { PaymentStatus } from "@/components/payments/PaymentStatus";
import { PaymentLoader } from "@/components/payments/PaymentLoader";

type Props = {
  reference: string;
  initialStatus?: string | null;
  initialMessage?: string | null;
};

/**
 * Consulta periódica del ledger de pagos mientras esté PENDING.
 * No confía en el query `widget=` del redirect.
 */
export function CheckoutPaymentPoller({
  reference,
  initialStatus,
  initialMessage,
}: Props) {
  const [status, setStatus] = useState(initialStatus ?? "PENDING");
  const [message, setMessage] = useState(initialMessage ?? null);
  const [polling, setPolling] = useState(
    !initialStatus || initialStatus === "PENDING",
  );

  useEffect(() => {
    if (!reference || status !== "PENDING") {
      setPolling(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    async function tick() {
      attempts += 1;
      try {
        const res = await fetch(
          `/api/payments/wompi/status?reference=${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          payment?: { status?: string; statusMessage?: string | null };
        };
        const next = json.payment?.status;
        if (next && !cancelled) {
          setStatus(next);
          setMessage(json.payment?.statusMessage ?? null);
          if (next !== "PENDING") {
            setPolling(false);
          }
        }
      } catch {
        /* silencioso; reintenta */
      }
      if (attempts >= maxAttempts && !cancelled) {
        setPolling(false);
      }
    }

    void tick();
    const id = window.setInterval(() => {
      if (attempts >= maxAttempts) {
        window.clearInterval(id);
        return;
      }
      void tick();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [reference, status]);

  return (
    <div className="space-y-3">
      <PaymentStatus
        status={status}
        reference={reference}
        statusMessage={message}
      />
      {polling && status === "PENDING" ? (
        <PaymentLoader label="Confirmando con Wompi…" />
      ) : null}
    </div>
  );
}
