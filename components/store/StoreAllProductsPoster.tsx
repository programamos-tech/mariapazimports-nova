import {
  STORE_CATEGORY_MOSAIC_IMAGE_SIZES,
  STORE_PRODUCT_IMAGE_IMG_CLASS,
} from "@/lib/store-product-card-image";
import { productCardImageSources } from "@/lib/storage-image-url";

const MOSAIC_SLOTS = 4;

/** Café y crema del isotipo M. — el tile no debe parecer un SKU. */
const BRAND_MARK_BG = "#81523e";
const BRAND_MARK_FG = "#fff5e6";

function AllProductsBrandMark() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: BRAND_MARK_BG }}
      aria-hidden
    >
      <span
        className="font-store-display text-5xl leading-none tracking-tight sm:text-6xl"
        style={{ color: BRAND_MARK_FG }}
      >
        M.
      </span>
    </div>
  );
}

function MosaicCell({
  src,
  priority,
}: {
  src: string;
  priority?: boolean;
}) {
  const sources = productCardImageSources(src);
  if (!sources.src) return <div className="relative min-h-0 bg-white" />;

  return (
    <div className="relative min-h-0 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- original Storage, contain como vitrina */}
      <img
        src={sources.src}
        srcSet={sources.srcSet ?? undefined}
        sizes={STORE_CATEGORY_MOSAIC_IMAGE_SIZES}
        alt=""
        className={`${STORE_PRODUCT_IMAGE_IMG_CLASS} transition duration-500 ease-out group-hover/cat:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/cat:scale-100`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </div>
  );
}

/** Póster del catálogo completo: collage de categorías, o la M. de marca. */
export function StoreAllProductsPoster({
  images,
  priority,
}: {
  images?: string[];
  priority?: boolean;
}) {
  const mosaic =
    images && images.length >= MOSAIC_SLOTS
      ? images.slice(0, MOSAIC_SLOTS)
      : null;

  return (
    <div className="absolute inset-0 pb-11 sm:pb-12">
      <div className="relative size-full">
        {mosaic ? (
          <div className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-stone-200">
            {mosaic.map((src, i) => (
              <MosaicCell key={src} src={src} priority={priority && i < 2} />
            ))}
          </div>
        ) : (
          <AllProductsBrandMark />
        )}
      </div>
    </div>
  );
}
