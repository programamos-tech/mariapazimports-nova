/**
 * Medios de pago Wompi (Colombia) en monocromo para el footer.
 * @see https://docs.wompi.co/docs/colombia/metodos-de-pago/
 */
const METHODS = [
  { id: "visa", label: "Visa", src: "/payments/visa.svg", width: 40, height: 24 },
  {
    id: "mastercard",
    label: "Mastercard",
    src: "/payments/mastercard.svg",
    width: 36,
    height: 24,
  },
  {
    id: "amex",
    label: "American Express",
    src: "/payments/amex.svg",
    width: 36,
    height: 24,
  },
  { id: "pse", label: "PSE", src: "/payments/pse.svg", width: 48, height: 24 },
  { id: "nequi", label: "Nequi", src: "/payments/nequi.svg", width: 56, height: 24 },
  {
    id: "bancolombia",
    label: "Botón Bancolombia",
    src: "/payments/bancolombia.svg",
    width: 78,
    height: 24,
  },
] as const;

export function StoreWompiPaymentLogos({
  className = "",
}: {
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 text-stone-500 ${className}`}
      aria-label="Medios de pago aceptados con Wompi"
    >
      {METHODS.map((m) => (
        <li key={m.id} className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estáticos locales monocromo */}
          <img
            src={m.src}
            alt={m.label}
            width={m.width}
            height={m.height}
            className="h-5 w-auto opacity-80 sm:h-6"
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
  );
}
