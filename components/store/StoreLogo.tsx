import Image from "next/image";
import { storeBrand, storeLogoPath } from "@/lib/brand";

type Variant = "header" | "footer";

const variantClass: Record<Variant, string> = {
  header:
    "h-7 w-auto max-w-full sm:h-8 md:h-9 lg:h-11",
  footer: "h-9 w-auto sm:h-10 lg:h-11 max-w-[13rem]",
};

type Props = {
  variant?: Variant;
  priority?: boolean;
  className?: string;
};

/** Logo recortado (781×217): escala por altura para que el texto se lea bien. */
export function StoreLogo({
  variant = "header",
  priority = false,
  className = "",
}: Props) {
  return (
    <Image
      src={storeLogoPath}
      alt={storeBrand}
      width={781}
      height={217}
      priority={priority}
      className={`object-contain object-center ${variantClass[variant]} ${className}`.trim()}
    />
  );
}
