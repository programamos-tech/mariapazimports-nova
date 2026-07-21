type Props = {
  label?: string;
  className?: string;
};

/** Indicador de carga para flujos de pago. */
export function PaymentLoader({
  label = "Procesando pago…",
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-8 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="size-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900"
        aria-hidden
      />
      <p className="text-sm text-stone-600">{label}</p>
    </div>
  );
}
