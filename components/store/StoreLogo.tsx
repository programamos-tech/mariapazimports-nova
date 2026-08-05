import Image from "next/image";
import { storeBrand, storeLogoPath } from "@/lib/brand";

type Variant = "header" | "footer" | "hero";

/** Dimensiones intrínsecas del PNG (2× Canva, fondo transparente). */
const LOGO_WIDTH = 966;
const LOGO_HEIGHT = 306;

/** Versión ligera para footer (menos peso al scroll). */
const FOOTER_LOGO_PATH = "/logo-maria-paz-imports-sm.png";
const FOOTER_LOGO_WIDTH = 480;
const FOOTER_LOGO_HEIGHT = 152;

const variantClass: Record<Variant, string> = {
  header:
    "h-8 w-auto max-h-8 sm:h-9 sm:max-h-9 md:h-10 md:max-h-10 lg:h-11 lg:max-h-11",
  footer: "h-10 w-auto max-h-10 sm:h-11 sm:max-h-11 lg:h-12 lg:max-h-12",
  hero: "h-12 w-auto max-h-12 sm:h-14 sm:max-h-14 md:h-16 md:max-h-16",
};

const variantSizes: Record<Variant, string> = {
  header: "140px",
  footer: "160px",
  hero: "200px",
};

type Props = {
  variant?: Variant;
  priority?: boolean;
  className?: string;
};

/** Wordmark oficial (Canva): MARÍA PAZ + IMPORTS. */
export function StoreLogo({
  variant = "header",
  priority = false,
  className = "",
}: Props) {
  const isFooter = variant === "footer";
  return (
    <Image
      src={isFooter ? FOOTER_LOGO_PATH : storeLogoPath}
      alt={storeBrand}
      width={isFooter ? FOOTER_LOGO_WIDTH : LOGO_WIDTH}
      height={isFooter ? FOOTER_LOGO_HEIGHT : LOGO_HEIGHT}
      priority={priority}
      sizes={variantSizes[variant]}
      className={`object-contain object-center ${variantClass[variant]} ${className}`.trim()}
    />
  );
}
