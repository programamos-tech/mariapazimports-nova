import Link from "next/link";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { storeProductGridClass } from "@/lib/store-layout";
import type {
  CatalogBrowseProductRow,
  CatalogBrowseSection,
} from "@/lib/catalog-browse-rows";
import { revealCatalogRowStagger } from "@/lib/store-reveal-timing";

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
              <CatalogBrowseProductSlot
                key={p.id}
                product={p}
                index={index}
                sectionIndex={sectionIndex}
                cartQtyByProductId={cartQtyByProductId}
                couponPctByProductId={couponPctByProductId}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CatalogBrowseProductSlot({
  product,
  index,
  sectionIndex,
  cartQtyByProductId,
  couponPctByProductId,
}: {
  product: CatalogBrowseProductRow;
  index: number;
  sectionIndex: number;
  cartQtyByProductId: Record<string, number>;
  couponPctByProductId: Record<string, number>;
}) {
  return (
    <li>
      <RevealOnScroll
        className="h-full"
        delayMs={revealCatalogRowStagger(sectionIndex, index)}
      >
        <ProductListingCard
          cartQuantity={cartQtyByProductId[product.id] ?? 0}
          couponDiscountPercent={couponPctByProductId[product.id] ?? 0}
          product={{
            id: product.id,
            name: product.name,
            brand: product.brand,
            description: product.description,
            price_cents: product.price_cents,
            image_path: product.image_path,
            image_paths: product.image_paths,
            stock_quantity: product.stock_quantity,
            size_options: product.size_options,
            size_value: product.size_value,
            size_unit: product.size_unit,
            fragrance_options: product.fragrance_options,
          }}
        />
      </RevealOnScroll>
    </li>
  );
}
