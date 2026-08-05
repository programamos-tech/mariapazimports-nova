/**
 * Medios de pago Wompi (Colombia) — marcas monocromo sin cajas.
 * @see https://docs.wompi.co/docs/colombia/metodos-de-pago/
 */

type MarkProps = {
  className?: string;
};

function VisaMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={36}
      height={12}
      viewBox="0 0 24 8"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M9.112.262 5.97 7.758H3.92L2.374 1.775C2.28 1.407 2.2 1.272 1.913 1.117.447.864.677.627 0 .479L.046.262h3.3a.904.904 0 0 1 .894.764l.817 4.338L7.075.262zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 0 1 1.913.336l.34-1.59a5.207 5.207 0 0 0-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24L22.435 0h-1.656a.883.883 0 0 0-.826.55L16.944 7.496h2.036l.405-1.12h2.488zm-2.163-2.656.02-.015 1.02-2.8.588 2.815zM11.883.262 10.28 7.758H8.34L9.945.262z" />
    </svg>
  );
}

function MastercardMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={26}
      height={16}
      viewBox="0 0 24 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="8.5" cy="7.5" r="6.5" fill="#57534e" />
      <circle cx="15.5" cy="7.5" r="6.5" fill="#a8a29e" />
      <path
        fill="#78716c"
        d="M12 2.4c1.55 1.4 2.5 3.35 2.5 5.1S13.55 11.7 12 13.1c-1.55-1.4-2.5-3.35-2.5-5.1S10.45 3.8 12 2.4Z"
      />
    </svg>
  );
}

function TextMark({
  className = "",
  children,
}: MarkProps & { children: string }) {
  return (
    <span
      className={`text-[0.6875rem] font-semibold tracking-wide text-stone-600 ${className}`}
    >
      {children}
    </span>
  );
}

const METHODS = [
  { id: "visa", label: "Visa", node: (c: string) => <VisaMark className={c} /> },
  {
    id: "mastercard",
    label: "Mastercard",
    node: (c: string) => <MastercardMark className={c} />,
  },
  {
    id: "amex",
    label: "American Express",
    node: (c: string) => <TextMark className={c}>AMEX</TextMark>,
  },
  {
    id: "pse",
    label: "PSE",
    node: (c: string) => <TextMark className={c}>PSE</TextMark>,
  },
  {
    id: "nequi",
    label: "Nequi",
    node: (c: string) => (
      <span className={`inline-flex items-center gap-1.5 ${c}`}>
        <span className="size-2 shrink-0 rounded-full bg-stone-600" aria-hidden />
        <TextMark>Nequi</TextMark>
      </span>
    ),
  },
  {
    id: "bancolombia",
    label: "Botón Bancolombia",
    node: (c: string) => <TextMark className={c}>Bancolombia</TextMark>,
  },
] as const;

const markClass = "shrink-0 text-stone-600";

export function StoreWompiPaymentLogos({
  className = "",
}: {
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}
      aria-label="Medios de pago aceptados con Wompi: Visa, Mastercard, American Express, PSE, Nequi y Bancolombia"
    >
      {METHODS.map(({ id, label, node }) => (
        <li key={id} className="flex shrink-0 items-center" title={label}>
          <span className="sr-only">{label}</span>
          {node(markClass)}
        </li>
      ))}
    </ul>
  );
}
