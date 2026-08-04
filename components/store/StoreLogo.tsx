import Image from "next/image";
import { storeBrand, storeLogoPath } from "@/lib/brand";

type Variant = "header" | "footer" | "hero";

const variantClass: Record<Variant, string> = {
  header: "h-8 w-auto max-w-full sm:h-9 md:h-10 lg:h-11",
  footer: "h-10 w-auto sm:h-11 lg:h-12 max-w-[14rem]",
  hero: "h-14 w-auto max-w-[16rem] sm:h-16 sm:max-w-[18rem] md:h-[4.5rem] md:max-w-[22rem]",
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
  return (
    <Image
      src={storeLogoPath}
      alt={storeBrand}
      width={475}
      height={145}
      priority={priority}
      className={`object-contain object-center ${variantClass[variant]} ${className}`.trim()}
    />
  );
}
