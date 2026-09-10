import { ProductListingCard } from "@/components/store/ProductListingCard";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { ViewAllProductsLink } from "@/components/store/ViewAllProductsLink";
import { storeShellClass, storeProductGridClass } from "@/lib/store-layout";
import { storeProductCardImagePriority } from "@/lib/store-product-card-image";
import { REVEAL_BLOCK_DELAY_MS } from "@/lib/store-reveal-timing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  enrichListingProductsWithVariants,
  toProductListingCardProps,
} from "@/lib/store-listing-variant-meta";
import { getStoreListingCardContext } from "@/lib/store-listing-card-context";

const HOME_PRODUCTS_LIMIT = 8;

export async function HomeFeaturedSection() {
  const supabase = await createSupabaseServerClient();
  const [{ data, error }, { cartQtyByProductId, couponPctByProductId }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,brand,price_cents,image_path,image_paths,stock_quantity,fragrance_options,variant_axis,import_origin,size_options,size_value,size_unit,created_at",
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(HOME_PRODUCTS_LIMIT),
      getStoreListingCardContext(),
    ]);

  if (error) {
    console.error("[home] products:", error.message, error.code);
  }

  const rows = (data ?? []).map((p) => ({
    ...p,
    description: null,
  })) as Parameters<typeof enrichListingProductsWithVariants>[1];
  const enrichedFeatured = await enrichListingProductsWithVariants(
    supabase,
    rows,
  );

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className={storeShellClass}>
        <div className="mt-2 sm:mt-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-2xl">
              Productos destacados
            </h2>
          </div>

          {enrichedFeatured.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-stone-200/90 bg-[#faf8f5]/60 p-8 text-center text-sm text-stone-600">
              Aún no hay productos publicados. Cárgalos desde el admin para que
              aparezcan aquí.
            </p>
          ) : (
            <>
              <ul className={`mt-8 ${storeProductGridClass}`}>
                {enrichedFeatured.map((p, index) => (
                  <li key={p.id} className="h-full">
                    <ProductListingCard
                      imagePriority={storeProductCardImagePriority(index)}
                      cartQuantity={cartQtyByProductId[p.id] ?? 0}
                      couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                      product={toProductListingCardProps(p)}
                    />
                  </li>
                ))}
              </ul>
              <RevealOnScroll
                delayMs={REVEAL_BLOCK_DELAY_MS}
                className="mt-6 flex justify-center sm:mt-7"
              >
                <ViewAllProductsLink className="inline-flex border border-stone-900 bg-stone-900 px-10 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-stone-800">
                  Ver todos los productos
                </ViewAllProductsLink>
              </RevealOnScroll>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
