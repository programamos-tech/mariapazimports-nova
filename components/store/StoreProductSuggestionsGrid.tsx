import type { ReactNode } from "react";
import Link from "next/link";
import { productColorSwatchClass } from "@/lib/product-colors";
import type { StoreProductSuggestion } from "@/lib/store-product-suggestions";
import { formatCop } from "@/lib/money";
import {
  STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS,
  STORE_PRODUCT_CARD_IMAGE_BG_CLASS,
} from "@/lib/store-product-card-image";
import {
  productCardImageSources,
} from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";

const storePrimaryBtnClass =
  "flex w-full items-center justify-center bg-stone-900 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800";

export function StorePrimaryLinkButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={storePrimaryBtnClass}>
      {children}
    </Link>
  );
}

export function StoreProductSuggestionsGrid({
  suggestions,
  title = "También te puede gustar",
  maxItems = 8,
}: {
  suggestions: StoreProductSuggestion[];
  title?: string;
  /** 4 columnas × 2 filas por defecto. */
  maxItems?: number;
}) {
  const visible = suggestions.slice(0, maxItems);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="store-product-suggestions-title">
      <h2
        id="store-product-suggestions-title"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900"
      >
        {title}
      </h2>
      <ul className="mt-4 grid grid-cols-4 gap-3 sm:gap-3.5">
        {visible.map((s) => {
          const framed = productCardImageSources(s.imagePath);
          const img = framed.src ?? storagePublicObjectUrl(s.imagePath);
          const swatches = s.colors.slice(0, 3);
          const extraColors = Math.max(0, s.colors.length - swatches.length);
          return (
            <li key={s.id} className="min-w-0">
              <Link
                href={`/products/${s.id}`}
                className="block outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-stone-900/25 focus-visible:ring-offset-2"
              >
                <div
                  className={`relative w-full overflow-hidden ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS} ${STORE_PRODUCT_CARD_IMAGE_BG_CLASS}`}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- srcSet card 4:5
                    <img
                      src={img}
                      srcSet={framed.srcSet ?? undefined}
                      sizes="(max-width: 640px) 22vw, 120px"
                      alt=""
                      className="absolute inset-0 size-full object-contain object-center"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-lg text-stone-200">
                      ◆
                    </div>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-2 text-[9px] font-semibold uppercase leading-snug tracking-[0.07em] text-stone-900 sm:text-[10px]">
                  {s.name}
                </p>
                <p className="mt-0.5 text-[10px] font-medium tabular-nums text-stone-900 sm:text-[11px]">
                  {formatCop(s.priceCents)}
                </p>
                {swatches.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
                    {swatches.map((c, i) => (
                      <span
                        key={`${s.id}-sw-${i}`}
                        className={`size-3 shrink-0 rounded-full sm:size-3.5 ${productColorSwatchClass(c)}`}
                        aria-hidden
                        title={c}
                      />
                    ))}
                    {extraColors > 0 ? (
                      <span className="text-[9px] font-medium tabular-nums text-stone-500">
                        +{extraColors}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
