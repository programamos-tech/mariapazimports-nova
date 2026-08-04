import type { ProductImportOrigin } from "@/lib/product-import-origin";
import {
  productImportOriginLabel,
  productImportOriginShortLabel,
} from "@/lib/product-import-origin";

function UsaFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 11"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="16" height="11" fill="#B22234" />
      <path
        fill="#fff"
        d="M0 1.4h16v1.1H0zm0 2.2h16v1.1H0zm0 2.2h16v1.1H0zm0 2.2h16V9H0z"
      />
      <rect width="7.2" height="5.9" fill="#3C3B6E" />
    </svg>
  );
}

function EuFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 11"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="16" height="11" fill="#003399" />
      <circle cx="8" cy="5.5" r="0.55" fill="#FFCC00" />
      <circle cx="8" cy="2.85" r="0.45" fill="#FFCC00" />
      <circle cx="8" cy="8.15" r="0.45" fill="#FFCC00" />
      <circle cx="5.9" cy="3.55" r="0.45" fill="#FFCC00" />
      <circle cx="10.1" cy="3.55" r="0.45" fill="#FFCC00" />
      <circle cx="5.9" cy="7.45" r="0.45" fill="#FFCC00" />
      <circle cx="10.1" cy="7.45" r="0.45" fill="#FFCC00" />
      <circle cx="4.85" cy="5.5" r="0.45" fill="#FFCC00" />
      <circle cx="11.15" cy="5.5" r="0.45" fill="#FFCC00" />
    </svg>
  );
}

type Props = {
  origin: ProductImportOrigin | null | undefined;
  /** `compact` para cards; `detail` para ficha. */
  variant?: "compact" | "detail";
  className?: string;
};

/** Indicador sutil de origen (USA / Europa) en cards y ficha. */
export function ProductImportOriginMark({
  origin,
  variant = "compact",
  className = "",
}: Props) {
  if (!origin || origin === "OTHER") return null;

  const label = productImportOriginLabel(origin);
  const short = productImportOriginShortLabel(origin);
  const Flag = origin === "EU" ? EuFlagIcon : UsaFlagIcon;

  if (variant === "detail") {
    return (
      <p
        className={`mt-2.5 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 ${className}`.trim()}
        title={label}
      >
        <Flag className="h-[11px] w-4 shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
        <span>{label}</span>
      </p>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.1em] text-stone-400 ${className}`.trim()}
      title={label}
    >
      <Flag className="h-[9px] w-[13px] shrink-0 rounded-[1px] opacity-90 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
      <span>{short}</span>
    </span>
  );
}
