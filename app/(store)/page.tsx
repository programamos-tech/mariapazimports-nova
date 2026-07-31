import { preconnect } from "react-dom";
import { CalendarDays, Headset, Star } from "lucide-react";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { ViewAllProductsLink } from "@/components/store/ViewAllProductsLink";
import { storeShellClass, storeProductGridClass } from "@/lib/store-layout";
import {
  STORE_PRODUCT_CARD_IMAGE_SIZES,
  storeProductCardImagePriority,
} from "@/lib/store-product-card-image";
import {
  REVEAL_BLOCK_DELAY_MS,
} from "@/lib/store-reveal-timing";
import { productCardDisplayImages } from "@/lib/product-card-display-images";
import { storeBrand } from "@/lib/brand";
import { StoreNetflixHero } from "@/components/store/StoreNetflixHero";
import { StoreNetflixCategories } from "@/components/store/StoreNetflixCategories";
import { MPI_HERO_IMAGES } from "@/lib/mpi-hero-images";
import { fetchHomeCategoryCards } from "@/lib/fetch-home-categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";
import {
  enrichListingProductsWithVariants,
  toProductListingCardProps,
} from "@/lib/store-listing-variant-meta";

export const dynamic = "force-dynamic";

const HOME_PRODUCTS_LIMIT = 8;
const STORE_HIGHLIGHTS = [
  {
    title: "Productos 100% originales de la más alta calidad",
    Icon: Star,
  },
  {
    title: "Envíamos dentro de las 24 horas posteriores a tu compra",
    Icon: CalendarDays,
  },
  {
    title: "Te asesoramos diariamente por WhatsApp",
    Icon: Headset,
  },
] as const;

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) preconnect(supabaseUrl);

  const supabase = await createSupabaseServerClient();

  const productsQuery = supabase
    .from("products")
    .select(
      "id,name,brand,description,price_cents,image_path,image_paths,stock_quantity,fragrance_options,variant_axis,size_options,size_value,size_unit,created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(HOME_PRODUCTS_LIMIT);

  const [
    homeCategories,
    { data: homeProducts, error: homeProductsError },
    cartQtyByProductId,
    couponPctByProductId,
  ] = await Promise.all([
    fetchHomeCategoryCards(supabase),
    productsQuery,
    getStorefrontCartQuantityByProductId(),
    fetchStorefrontCouponDiscountPercentByProductId(supabase),
  ]);

  if (homeProductsError) {
    console.error(
      "[home] products:",
      homeProductsError.message,
      homeProductsError.code,
    );
  }

  const featuredProducts = homeProducts ?? [];
  const enrichedFeatured = await enrichListingProductsWithVariants(
    supabase,
    featuredProducts as Parameters<typeof enrichListingProductsWithVariants>[1],
  );

  const featuredImagePreloads = enrichedFeatured
    .slice(0, 2)
    .map((p) => {
      const imgs = productCardDisplayImages(p.image_path, p.image_paths);
      if (!imgs.primary) return null;
      return {
        href: imgs.primary,
        srcSet: imgs.primarySrcSet,
      };
    })
    .filter((row): row is { href: string; srcSet: string | null } =>
      Boolean(row),
    );

  return (
    <div>
      {MPI_HERO_IMAGES.slice(0, 3).map((href) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href}
          fetchPriority="high"
        />
      ))}
      {featuredImagePreloads.map(({ href, srcSet }) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href}
          imageSrcSet={srcSet ?? undefined}
          imageSizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
        />
      ))}

      <StoreNetflixHero />

      <StoreNetflixCategories categories={homeCategories} />

      {/* Highlights + productos destacados */}
      <section className="bg-white py-8 sm:py-10">
        <div className={storeShellClass}>
          <ul className="grid gap-5 border-y border-stone-200/70 py-5 sm:grid-cols-3 sm:gap-4 sm:py-6">
            {STORE_HIGHLIGHTS.map(({ title, Icon }) => (
              <li key={title}>
                <div className="flex flex-col items-center text-center">
                  <span className="inline-flex size-7 items-center justify-center text-zinc-900">
                    <Icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <p className="mt-2 max-w-[19rem] text-xs leading-snug text-stone-800 sm:text-[13px]">
                    {title}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                Destacado en {storeBrand.split(/\s+/)[0]}
              </p>
              <h2 className="mt-1 text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-2xl">
                Productos destacados
              </h2>
              <p className="mx-auto mt-1.5 max-w-lg text-xs leading-snug text-stone-500 sm:text-[13px]">
                Versatilidad y estilo; abrí cada producto para ver detalle y
                comprar.
              </p>
            </div>

            {featuredProducts.length === 0 ? (
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
                        couponDiscountPercent={
                          couponPctByProductId[p.id] ?? 0
                        }
                        product={toProductListingCardProps(p)}
                      />
                    </li>
                  ))}
                </ul>
                <RevealOnScroll
                  delayMs={REVEAL_BLOCK_DELAY_MS}
                  className="mt-6 flex justify-center sm:mt-7"
                >
                  <ViewAllProductsLink
                    className="inline-flex border border-stone-900 bg-white px-10 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
                  >
                    Ver todos los productos
                  </ViewAllProductsLink>
                </RevealOnScroll>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
