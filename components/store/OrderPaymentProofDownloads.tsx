import type { StorePaymentProof } from "@/app/actions/order-payment-proof";

export function OrderPaymentProofDownloads({
  proofs,
}: {
  proofs: StorePaymentProof[];
}) {
  if (proofs.length === 0) return null;

  const latest = proofs[0];

  return (
    <div className="space-y-2">
      {latest.signedUrl ? (
        <a
          href={latest.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={latest.fileName}
          className="flex w-full items-center justify-center border border-stone-900 bg-white py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-50"
        >
          Descargar comprobante
        </a>
      ) : (
        <p className="text-xs text-stone-500">
          Comprobante registrado ({latest.fileName}).
        </p>
      )}
      {proofs.length > 1 ? (
        <ul className="space-y-1.5">
          {proofs.slice(1).map((p) =>
            p.signedUrl ? (
              <li key={p.id}>
                <a
                  href={p.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-stone-600 underline underline-offset-2 transition hover:text-stone-900"
                >
                  Descargar {p.fileName}
                </a>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  );
}
