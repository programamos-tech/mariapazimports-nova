type Variant = "header" | "footer";

const variantClass: Record<Variant, string> = {
  header: "text-[1.05rem] leading-none sm:text-[1.15rem] md:text-[1.25rem] lg:text-[1.4rem]",
  footer: "text-[1.2rem] leading-none sm:text-[1.3rem] lg:text-[1.4rem]",
};

type Props = {
  variant?: Variant;
  /** Conservado por compatibilidad con usos previos del <Image>. */
  priority?: boolean;
  className?: string;
};

/**
 * Wordmark tipográfico (Playfair Display seminegrita), como en Canva:
 * MARÍA PAZ + IMPORTS.
 */
export function StoreLogo({
  variant = "header",
  className = "",
}: Props) {
  return (
    <span
      className={`font-store-display inline-flex flex-col items-center justify-center text-center font-semibold uppercase text-stone-900 ${variantClass[variant]} ${className}`.trim()}
      aria-label="María Paz Imports"
    >
      <span className="tracking-[0.04em]">María Paz</span>
      <span className="mt-[0.2em] text-[0.42em] font-semibold tracking-[0.42em]">
        Imports
      </span>
    </span>
  );
}
