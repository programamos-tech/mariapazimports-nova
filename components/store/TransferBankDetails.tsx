"use client";

import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import { getPublicBankTransferDetails } from "@/lib/bank-transfer";
import { formatCop } from "@/lib/money";

function CopyableValue({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback silencioso */
    }
  }, [value]);

  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-stone-500">{label}</dt>
      <dd className="flex min-w-0 items-center justify-end gap-2">
        <span className="font-mono text-[13px] font-semibold tracking-wide text-stone-900">
          {value}
        </span>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="flex size-8 shrink-0 items-center justify-center border border-stone-300 bg-white text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
          aria-label={copyLabel}
          title={copied ? "Copiado" : "Copiar"}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" strokeWidth={2.25} />
          ) : (
            <Copy className="size-3.5" strokeWidth={1.75} />
          )}
        </button>
      </dd>
    </div>
  );
}

export function TransferBankDetails({
  orderRef,
  amountCents,
  compact = false,
}: {
  orderRef?: string;
  amountCents?: number;
  compact?: boolean;
}) {
  const bank = getPublicBankTransferDetails();
  if (!bank) return null;

  return (
    <div
      className={
        compact
          ? "border border-stone-200 bg-white p-4"
          : "border border-stone-200 bg-white p-5"
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
        Datos para transferencia
      </p>
      <dl className="mt-3 space-y-2.5 text-sm text-stone-800">
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Banco</dt>
          <dd className="text-right font-medium">{bank.bankName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Tipo de cuenta</dt>
          <dd className="text-right font-medium">{bank.accountType}</dd>
        </div>
        <CopyableValue
          label="Número de cuenta"
          value={bank.accountNumber}
          copyLabel="Copiar número de cuenta"
        />
        {bank.paymentKey ? (
          <CopyableValue
            label="Llave Bre-B"
            value={bank.paymentKey}
            copyLabel="Copiar llave Bre-B"
          />
        ) : null}
        {amountCents != null ? (
          <div className="flex justify-between gap-4 border-t border-stone-200 pt-2.5">
            <dt className="text-stone-500">Monto exacto</dt>
            <dd className="text-right font-semibold tabular-nums text-stone-900">
              {formatCop(amountCents)}
            </dd>
          </div>
        ) : null}
        {orderRef ? (
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Referencia</dt>
            <dd className="text-right font-mono text-xs text-stone-900">
              {orderRef}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-stone-500">
        {bank.referenceHint}
      </p>
    </div>
  );
}
