import Image from "next/image";
import {
  productDisplayImageUrl,
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";

/** Hero SSR: la imagen entra en el HTML antes de hidratar el detalle. */
export function ProductDetailHeroServer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const display = productDisplayImageUrl(src, "hero") ?? src;

  return (
    <Image
      src={display}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="(max-width: 1024px) 100vw, 50vw"
      priority
      fetchPriority="high"
      unoptimized={shouldUseUnoptimizedImage(display)}
    />
  );
}
