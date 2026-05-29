import Link from "next/link";
import { CalendarDays, Headset, Star } from "lucide-react";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { storeBrand } from "@/lib/brand";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { fetchPublishedBanners } from "@/lib/store-banners";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";

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
  const supabase = await createSupabaseServerClient();
  const heroBanners = await fetchPublishedBanners(supabase, "hero");
  const { data: homeProducts, error: homeProductsError } = await supabase
    .from("products")
    .select(
      "id,name,brand,description,price_cents,image_path,stock_quantity,fragrance_options,created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(HOME_PRODUCTS_LIMIT);

  if (homeProductsError) {
    console.error(
      "[home] products:",
      homeProductsError.message,
      homeProductsError.code,
    );
  }

  const featuredProducts = homeProducts ?? [];
  const couponPctByProductId =
    await fetchStorefrontCouponDiscountPercentByProductId(supabase);

  return (
    <div>
      {/* Hero: solo imágenes desde Admin → Banners (zona hero), con respiro lateral en móvil/tablet */}
      <section
        className="w-full px-4 sm:px-6 md:px-8 lg:px-0"
        aria-label="Banner principal"
      >
        {heroBanners.length > 0 ? (
          <StoreBannerCarousel
            variant="hero"
            className="overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-none"
            slides={heroBanners.map((b) => ({
              id: b.id,
              image_path: b.image_path,
              href: b.href,
              alt_text: b.alt_text,
            }))}
          />
        ) : (
          <div className="flex min-h-[min(40vh,320px)] w-full flex-col items-center justify-center gap-3 bg-stone-100 px-4 py-16 text-center">
            <p className="max-w-md text-sm text-stone-500">
              Aún no hay banner principal. Sube imágenes en el panel:{" "}
              <Link
                href="/admin/banners"
                className="font-semibold text-[#6b7f6a] underline decoration-[#6b7f6a]/35 underline-offset-2 hover:text-[#556654]"
              >
                Administración → Banners
              </Link>{" "}
              (zona <span className="font-medium text-stone-600">hero</span>).
            </p>
          </div>
        )}
      </section>

      {/* Highlights + productos destacados */}
      <section className="border-t border-stone-200/60 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8">
          <ul className="grid gap-5 border-y border-stone-200/70 py-5 sm:grid-cols-3 sm:gap-4 sm:py-6">
            {STORE_HIGHLIGHTS.map(({ title, Icon }, i) => (
              <li key={title}>
                <RevealOnScroll
                  delayMs={Math.min(i * 100, 240)}
                  className="flex flex-col items-center text-center"
                >
                  <span className="inline-flex size-7 items-center justify-center text-zinc-900">
                    <Icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <p className="mt-2 max-w-[19rem] text-xs leading-snug text-stone-800 sm:text-[13px]">
                    {title}
                  </p>
                </RevealOnScroll>
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-8">
            <RevealOnScroll className="mx-auto max-w-3xl text-center">
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
            </RevealOnScroll>

            {featuredProducts.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-stone-200/90 bg-[#faf8f5]/60 p-8 text-center text-sm text-stone-600">
                Aún no hay productos publicados. Cárgalos desde el admin para que
                aparezcan aquí.
              </p>
            ) : (
              <>
                <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-5 lg:gap-x-6">
                  {featuredProducts.map((p, index) => (
                    <li key={p.id}>
                      <RevealOnScroll
                        className="h-full"
                        delayMs={Math.min(index * 40, 200)}
                      >
                        <ProductListingCard
                          presentation="editorial"
                          compact
                          accentImageBg={index % 4 === 3}
                          couponDiscountPercent={
                            couponPctByProductId[p.id] ?? 0
                          }
                          product={{
                            id: p.id,
                            name: p.name,
                            brand: p.brand,
                            description: p.description,
                            price_cents: p.price_cents,
                            image_path: p.image_path,
                            stock_quantity: p.stock_quantity,
                            fragrance_options: p.fragrance_options,
                          }}
                        />
                      </RevealOnScroll>
                    </li>
                  ))}
                </ul>
                <RevealOnScroll
                  delayMs={120}
                  className="mt-6 flex justify-center sm:mt-7"
                >
                  <Link
                    href="/products"
                    className="inline-flex border border-stone-900 bg-white px-10 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
                  >
                    Ver todos los productos
                  </Link>
                </RevealOnScroll>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
