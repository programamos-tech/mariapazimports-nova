import { CatalogRowScroller } from "@/components/store/CatalogRowScroller";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { storeShellClass } from "@/lib/store-layout";
import { REVEAL_BLOCK_DELAY_MS } from "@/lib/store-reveal-timing";
import {
  toProductListingCardProps,
  type ListingProductWithVariantMeta,
} from "@/lib/store-listing-variant-meta";

/** Fila tipo Netflix: solo cards completas, sin recortes. */
export function StoreBestsellersRow({
  products,
  couponPctByProductId,
}: {
  products: ListingProductWithVariantMeta[];
  couponPctByProductId: Record<string, number>;
}) {
  if (products.length === 0) return null;

  return (
    <section
      className="border-t border-stone-200/70 bg-white py-10 sm:py-12"
      aria-labelledby="home-bestsellers-heading"
    >
      <div className={storeShellClass}>
        <RevealOnScroll delayMs={REVEAL_BLOCK_DELAY_MS}>
          <h2
            id="home-bestsellers-heading"
            className="text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-2xl"
          >
            Lo más top de la semana
          </h2>
        </RevealOnScroll>

        <div className="mt-6 sm:mt-8">
          <CatalogRowScroller>
            {products.map((p, index) => (
              <ProductListingCard
                key={p.id}
                presentation="editorial"
                compact
                detailCtaLabel="Conoce más"
                imagePriority={index < 2}
                couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                product={toProductListingCardProps(p)}
              />
            ))}
          </CatalogRowScroller>
        </div>
      </div>
    </section>
  );
}
