import { PaymentStatus as PS } from "@/types/payment";

const LABELS: Record<string, string> = {
  [PS.PENDING]: "Pendiente de confirmación",
  [PS.APPROVED]: "Pago aprobado",
  [PS.DECLINED]: "Pago rechazado",
  [PS.VOIDED]: "Pago anulado",
  [PS.ERROR]: "Error en el pago",
  [PS.FAILED]: "Pago fallido",
};

type Props = {
  status: string;
  reference?: string | null;
  statusMessage?: string | null;
  className?: string;
};

export function PaymentStatus({
  status,
  reference,
  statusMessage,
  className = "",
}: Props) {
  const label = LABELS[status] ?? status;
  const tone =
    status === PS.APPROVED
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : status === PS.PENDING
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-rose-200 bg-rose-50 text-rose-950";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${tone} ${className}`}
      role="status"
    >
      <p className="font-semibold">{label}</p>
      {reference ? (
        <p className="mt-1 font-mono text-xs opacity-80">Ref. {reference}</p>
      ) : null}
      {statusMessage ? (
        <p className="mt-2 text-xs opacity-90">{statusMessage}</p>
      ) : null}
      {status === PS.PENDING ? (
        <p className="mt-2 text-xs opacity-80">
          La confirmación final llega por webhook. Puedes refrescar en unos
          segundos.
        </p>
      ) : null}
    </div>
  );
}
