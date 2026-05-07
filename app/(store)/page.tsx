import Link from "next/link";
import { CalendarDays, Headset, Star } from "lucide-react";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { fetchPublishedBanners } from "@/lib/store-banners";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";

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
  const { data: homeProducts } = await supabase
    .from("products")
    .select(
      "id,name,description,price_cents,image_path,stock_quantity,created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(HOME_PRODUCTS_LIMIT);

  const featuredProducts = homeProducts ?? [];
  const cartQtyByProductId = await getStorefrontCartQuantityByProductId();

  return (
    <div>
      {/* Hero: solo imágenes desde Admin → Banners (zona hero), ancho completo, sin textos */}
      <section className="w-full" aria-label="Banner principal">
        {heroBanners.length > 0 ? (
          <StoreBannerCarousel
            variant="hero"
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
              Aún no hay banner principal. Subí imágenes en el panel:{" "}
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

      {/* Highlights */}
      <section className="border-t border-stone-200/60 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <ul className="grid gap-8 border-y border-stone-200/70 py-8 sm:py-10 md:grid-cols-3 md:gap-6">
            {STORE_HIGHLIGHTS.map(({ title, Icon }) => (
              <li key={title} className="flex flex-col items-center text-center">
                <span className="inline-flex size-8 items-center justify-center text-zinc-900">
                  <Icon className="size-5" strokeWidth={2.2} />
                </span>
                <p className="mt-3 max-w-[19rem] text-sm leading-tight text-stone-800 sm:text-[15px]">
                  {title}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-16 border-t border-stone-200/80 pt-14 sm:mt-20 sm:pt-16">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              Productos destacados
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Una muestra del catálogo; entrá a cada ítem para ver detalle y
              comprar.
            </p>

            {featuredProducts.length === 0 ? (
              <p className="mt-10 rounded-xl border border-dashed border-stone-200/90 bg-[#faf8f5]/60 p-10 text-center text-sm text-stone-600">
                Aún no hay productos publicados. Cargalos desde el admin para que
                aparezcan aquí.
              </p>
            ) : (
              <>
                <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {featuredProducts.map((p) => (
                    <li key={p.id}>
                      <ProductListingCard
                        cartQuantity={cartQtyByProductId[p.id] ?? 0}
                        product={{
                          id: p.id,
                          name: p.name,
                          description: p.description,
                          price_cents: p.price_cents,
                          image_path: p.image_path,
                          stock_quantity: p.stock_quantity,
                        }}
                      />
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex justify-center">
                  <Link
                    href="/products"
                    className="inline-flex rounded-full border-2 border-[#6b7f6a] bg-white px-8 py-3 text-sm font-semibold text-[#556654] shadow-sm transition hover:bg-[#fff5eb]"
                  >
                    Ver catálogo completo
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
