type Props = {
  label?: string;
  className?: string;
};

/** @deprecated Preferí `StoreLoadingScreen`. Mantener API para pagos. */
export function PaymentLoader({
  label = "Procesando pago…",
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 py-8 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="size-9 animate-spin rounded-full border border-stone-200 border-t-stone-900"
        aria-hidden
      />
      <p className="max-w-[16rem] text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
