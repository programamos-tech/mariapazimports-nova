"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptBankTransferOrder } from "@/app/actions/admin/order-fulfillment";

type Proof = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  signedUrl: string | null;
  uploadedAt: string;
};

function isImageProof(proof: Proof) {
  const mime = (proof.mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  const name = proof.fileName.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function OrderTransferPanel({
  orderId,
  paymentStatus,
  fulfillmentStatus,
  isBankTransfer,
  proofs,
  trackingUrl,
}: {
  orderId: string;
  paymentStatus: string;
  fulfillmentStatus: string | null;
  isBankTransfer: boolean;
  proofs: Proof[];
  trackingUrl?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isBankTransfer) return null;

  const fulfillment = fulfillmentStatus ?? "awaiting_payment";

  const canAccept =
    paymentStatus === "pending" &&
    (fulfillment === "payment_submitted" ||
      fulfillment === "awaiting_payment" ||
      proofs.length > 0);

  return (
    <section className="mt-8 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 dark:border-sky-900/50 dark:bg-sky-950/20 print:hidden">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Transferencia bancaria
      </h2>

      {trackingUrl ? (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Seguimiento cliente:{" "}
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-sky-700 underline underline-offset-2 dark:text-sky-300"
          >
            {trackingUrl}
          </a>
        </p>
      ) : null}

      {proofs.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {proofs.map((proof) => (
            <li
              key={proof.id}
              className="overflow-hidden rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            >
              {proof.signedUrl && isImageProof(proof) ? (
                <a
                  href={proof.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-zinc-50 dark:bg-zinc-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
                  <img
                    src={proof.signedUrl}
                    alt={`Comprobante ${proof.fileName}`}
                    className="mx-auto max-h-72 w-full object-contain object-center"
                  />
                </a>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="truncate text-zinc-800 dark:text-zinc-200">
                  {proof.fileName}
                </span>
                {proof.signedUrl ? (
                  <a
                    href={proof.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-semibold text-sky-700 underline underline-offset-2 dark:text-sky-300"
                  >
                    {isImageProof(proof) ? "Abrir imagen" : "Ver comprobante"}
                  </a>
                ) : (
                  <span className="text-xs text-zinc-500">Sin vista previa</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Aún no hay comprobante subido por el cliente.
        </p>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {canAccept ? (
        <div className="mt-5">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await acceptBankTransferOrder(orderId);
                if (!res.ok) {
                  if (res.error === "stock") {
                    setError("No hay stock suficiente para aceptar el pedido.");
                  } else if (res.error === "forbidden") {
                    setError("No tienes permiso para aceptar pedidos.");
                  } else {
                    setError("No se pudo aceptar el pedido.");
                  }
                  return;
                }
                router.refresh();
              });
            }}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Procesando…" : "Pedido aceptado"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
