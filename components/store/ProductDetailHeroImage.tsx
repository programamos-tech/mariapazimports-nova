"use client";

import Image from "next/image";
import {
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  fetchPriority?: "high" | "auto";
};

/** Hero PDP: llena el marco 4/5 sin bandas vacías. */
export function ProductDetailHeroImage({
  src,
  alt,
  priority = false,
  fetchPriority = "auto",
}: Props) {
  const unopt = shouldUseUnoptimizedImage(src);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority={priority}
        fetchPriority={fetchPriority}
        unoptimized={unopt}
      />
    </div>
  );
}
