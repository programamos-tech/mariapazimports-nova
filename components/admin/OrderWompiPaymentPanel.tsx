import { formatCop } from "@/lib/money";

export type OrderWompiPaymentInfo = {
  reference: string | null;
  transactionId: string | null;
  status: string | null;
  paymentMethodType: string | null;
  statusMessage: string | null;
  approvedAt: string | null;
  /** Centavos Wompi (COP × 100). */
  amountInCents: number | null;
  currency: string | null;
  environment: string | null;
};

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400";

function wompiStatusLabel(status: string | null | undefined): string {
  switch ((status ?? "").toUpperCase()) {
    case "APPROVED":
      return "Aprobado";
    case "PENDING":
      return "Pendiente";
    case "DECLINED":
      return "Rechazado";
    case "VOIDED":
      return "Anulado";
    case "ERROR":
    case "FAILED":
      return "Fallido";
    default:
      return status?.trim() || "—";
  }
}

function wompiStatusClass(status: string | null | undefined): string {
  switch ((status ?? "").toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/90 dark:bg-emerald-950/45 dark:text-emerald-100 dark:ring-emerald-700/50";
    case "PENDING":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/90 dark:bg-amber-950/45 dark:text-amber-100 dark:ring-amber-700/50";
    case "DECLINED":
    case "VOIDED":
    case "ERROR":
    case "FAILED":
      return "bg-red-50 text-red-800 ring-1 ring-red-200/90 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-800/50";
    default:
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80 dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-zinc-600/70";
  }
}

function paymentMethodTypeLabel(type: string | null | undefined): string {
  const t = (type ?? "").trim().toUpperCase();
  if (!t) return "—";
  const map: Record<string, string> = {
    CARD: "Tarjeta",
    NEQUI: "Nequi",
    PSE: "PSE",
    BANCOLOMBIA_TRANSFER: "Transferencia Bancolombia",
    BANCOLOMBIA_COLLECT: "Botón Bancolombia",
    DAVIPLATA: "Daviplata",
    PCOL: "Puntos Colombia",
  };
  return map[t] ?? t;
}

function formatApprovedAt(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Monto Wompi: amount_in_cents es COP × 100. */
function formatWompiAmount(
  amountInCents: number | null,
  currency: string | null,
): string {
  if (amountInCents == null || !Number.isFinite(amountInCents)) return "—";
  const pesos = Math.round(amountInCents / 100);
  if ((currency ?? "COP").toUpperCase() === "COP") {
    return formatCop(pesos);
  }
  return `${pesos} ${currency}`;
}

export function OrderWompiPaymentPanel({
  payment,
  orderPaymentMethod,
}: {
  payment: OrderWompiPaymentInfo | null;
  orderPaymentMethod?: string | null;
}) {
  const isWompi =
    orderPaymentMethod === "wompi" ||
    Boolean(payment?.reference) ||
    Boolean(payment?.transactionId);

  if (!isWompi) return null;

  const status = payment?.status ?? null;
  const approved = (status ?? "").toUpperCase() === "APPROVED";

  return (
    <section className="mt-8 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20 print:border-zinc-300 print:bg-transparent">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Pago Wompi
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Datos de la pasarela para verificar el cobro en línea.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${wompiStatusClass(status)}`}
        >
          {wompiStatusLabel(status)}
        </span>
      </div>

      {approved ? (
        <p
          className="mt-4 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3.5 py-2.5 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          Transacción aprobada por Wompi
          {payment?.approvedAt
            ? ` · ${formatApprovedAt(payment.approvedAt)}`
            : ""}
          .
        </p>
      ) : null}

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <dt className={labelClass}>ID de transacción</dt>
          <dd className="mt-1 break-all font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {payment?.transactionId?.trim() || "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={labelClass}>Referencia</dt>
          <dd className="mt-1 break-all font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {payment?.reference?.trim() || "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={labelClass}>Medio</dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {paymentMethodTypeLabel(payment?.paymentMethodType)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={labelClass}>Monto cobrado</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatWompiAmount(payment?.amountInCents ?? null, payment?.currency ?? null)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={labelClass}>Ambiente</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
            {payment?.environment?.trim() || "—"}
          </dd>
        </div>
        {payment?.statusMessage?.trim() ? (
          <div className="min-w-0 sm:col-span-2 lg:col-span-3">
            <dt className={labelClass}>Mensaje</dt>
            <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {payment.statusMessage.trim()}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
