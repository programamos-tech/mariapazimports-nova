import Image from "next/image";
import { storeBrand, storeLogoPath } from "@/lib/brand";

type Variant = "header" | "footer" | "hero";

/** Dimensiones intrínsecas del PNG completo (2× Canva). */
const LOGO_WIDTH = 966;
const LOGO_HEIGHT = 306;

/** Variante ligera para header/footer (ya redimensionada en `/public`). */
const LOGO_SM_PATH = "/logo-maria-paz-imports-sm.png";
const LOGO_SM_WIDTH = 480;
const LOGO_SM_HEIGHT = 152;

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
  const useSm = variant === "header" || variant === "footer";
  const src = useSm ? LOGO_SM_PATH : storeLogoPath;
  const width = useSm ? LOGO_SM_WIDTH : LOGO_WIDTH;
  const height = useSm ? LOGO_SM_HEIGHT : LOGO_HEIGHT;

  return (
    <Image
      src={src}
      alt={storeBrand}
      width={width}
      height={height}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      sizes={variantSizes[variant]}
      className={`object-contain object-center ${variantClass[variant]} ${className}`.trim()}
    />
  );
}
