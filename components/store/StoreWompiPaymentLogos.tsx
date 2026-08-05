/**
 * Medios de pago Wompi (Colombia) — SVG inline monocromo.
 * width/height intrínsecos: sin ellos `w-auto` colapsa el icono a 0px.
 * @see https://docs.wompi.co/docs/colombia/metodos-de-pago/
 */

type MarkProps = {
  className?: string;
};

function VisaMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={48}
      height={32}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="46"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        fill="currentColor"
        d="M18.9 11.05 15.55 20.95h-2.18l-1.64-6.36c-.1-.39-.19-.53-.49-.7-.48-.27-1.28-.52-1.99-.68l.05-.23h3.51c.45 0 .84.3.95.81l.87 4.61 2.15-5.42h2.17Zm8.55 5.37c.01-2.1-2.91-2.22-2.89-3.16.01-.29.28-.59.87-.67a3.9 3.9 0 0 1 2.04.36l.36-1.69a5.54 5.54 0 0 0-1.93-.35c-2.04 0-3.47 1.08-3.49 2.64-.01 1.15 1.02 1.79 1.81 2.17.8.39 1.07.64 1.07.99-.01.54-.64.77-1.23.78-1.04.02-1.64-.28-2.12-.5l-.37 1.75c.48.22 1.37.41 2.29.42 2.17 0 3.59-1.07 3.59-2.73Zm5.39 2.6h2.17l-1.66-7.97h-1.76a.94.94 0 0 0-.88.58l-3.1 7.39h2.16l.43-1.19h2.65Zm-2.3-2.83.1-.01 1.08-2.99.63 3Zm-8.68-5.15-1.71 7.97h-2.07l1.71-7.97z"
      />
    </svg>
  );
}

function MastercardMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={48}
      height={32}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="46"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="20" cy="16" r="7" fill="#57534e" />
      <circle cx="28" cy="16" r="7" fill="#a8a29e" />
      <path
        fill="#78716c"
        d="M24 10.5c1.7 1.55 2.75 3.75 2.75 5.5S25.7 20 24 21.5C22.3 20 21.25 17.75 21.25 16S22.3 12.05 24 10.5Z"
      />
    </svg>
  );
}

function AmexMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={48}
      height={32}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="46"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.08em"
      >
        AMEX
      </text>
    </svg>
  );
}

function PseMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={48}
      height={32}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="46"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.16em"
      >
        PSE
      </text>
    </svg>
  );
}

function NequiMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={64}
      height={32}
      viewBox="0 0 64 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="62"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="14" cy="16" r="3.4" fill="currentColor" />
      <text
        x="40"
        y="20"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10"
        fontWeight="700"
      >
        Nequi
      </text>
    </svg>
  );
}

function BancolombiaMark({ className = "" }: MarkProps) {
  return (
    <svg
      className={className}
      width={108}
      height={32}
      viewBox="0 0 108 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="106"
        height="30"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <text
        x="54"
        y="20"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="0.02em"
      >
        Bancolombia
      </text>
    </svg>
  );
}

const METHODS = [
  { id: "visa", label: "Visa", Mark: VisaMark },
  { id: "mastercard", label: "Mastercard", Mark: MastercardMark },
  { id: "amex", label: "American Express", Mark: AmexMark },
  { id: "pse", label: "PSE", Mark: PseMark },
  { id: "nequi", label: "Nequi", Mark: NequiMark },
  { id: "bancolombia", label: "Botón Bancolombia", Mark: BancolombiaMark },
] as const;

const markClass = "block h-8 w-auto shrink-0 text-stone-800 sm:h-9";

export function StoreWompiPaymentLogos({
  className = "",
}: {
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap items-center gap-2.5 sm:gap-3 ${className}`}
      aria-label="Medios de pago aceptados con Wompi: Visa, Mastercard, American Express, PSE, Nequi y Bancolombia"
    >
      {METHODS.map(({ id, label, Mark }) => (
        <li key={id} className="flex shrink-0 items-center" title={label}>
          <span className="sr-only">{label}</span>
          <Mark className={markClass} />
        </li>
      ))}
    </ul>
  );
}
