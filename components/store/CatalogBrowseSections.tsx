import Link from "next/link";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { storeProductGridClass } from "@/lib/store-layout";
import { storeProductCardImagePriority } from "@/lib/store-product-card-image";
import { toProductListingCardProps } from "@/lib/store-listing-variant-meta";
import type { CatalogBrowseSection } from "@/lib/catalog-browse-rows";

export function CatalogBrowseSections({
  sections,
  cartQtyByProductId,
  couponPctByProductId,
}: {
  sections: CatalogBrowseSection[];
  cartQtyByProductId: Record<string, number>;
  couponPctByProductId: Record<string, number>;
}) {
  return (
    <div className="space-y-12 sm:space-y-14">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.categoryId ?? "sin-categoria"}
          aria-labelledby={`cat-row-${section.categoryId ?? "sin-categoria"}`}
          className="w-full"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-0 sm:mb-5">
            <h2
              id={`cat-row-${section.categoryId ?? "sin-categoria"}`}
              className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-900"
            >
              {section.categoryName}
            </h2>
            {section.showSeeAll && section.categoryId ? (
              <Link
                href={`/products?category=${encodeURIComponent(section.categoryId)}`}
                className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 underline-offset-4 transition hover:text-stone-800 hover:underline"
              >
                Ver más
              </Link>
            ) : null}
          </div>

          <ul className={storeProductGridClass}>
            {section.products.map((p, index) => (
              <li key={p.id}>
                <ProductListingCard
                  imagePriority={
                    sectionIndex === 0 &&
                    storeProductCardImagePriority(index)
                  }
                  cartQuantity={cartQtyByProductId[p.id] ?? 0}
                  couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                  product={toProductListingCardProps(p)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
