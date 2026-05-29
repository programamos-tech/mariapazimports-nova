import Image from "next/image";
import {
  productDisplayImageUrl,
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";

/** Hero SSR: mismo marco 4/5 que las tarjetas, sin espacio vacío. */
export function ProductDetailHeroServer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const display = productDisplayImageUrl(src, "hero") ?? src;

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
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
    </div>
  );
}
