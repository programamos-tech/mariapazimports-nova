import Link from "next/link";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { storeBrand } from "@/lib/brand";
import { fetchPublishedBanners } from "@/lib/store-banners";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const categories = [
  { name: "Hogar", hint: "Mobiliario y decoración", className: "bg-[#d8e5d4]" },
  { name: "Bolsos", hint: "Accesorios", className: "bg-[#edd8cc]" },
  { name: "Tech", hint: "Gadgets", className: "bg-[#d4e5e8]" },
  { name: "Moda", hint: "Ropa y calzado", className: "bg-[#e5dde8]" },
  { name: "Bienestar", hint: "Cuidado personal", className: "bg-[#e8e4d4]" },
  { name: "Regalos", hint: "Detalles especiales", className: "bg-[#f0e8dc]" },
] as const;

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/3] max-h-[420px] w-full max-w-lg">
      {/* Pastel “steps” composition */}
      <div className="absolute bottom-[8%] left-[6%] h-[28%] w-[42%] rounded-2xl bg-[#c7d4c2] shadow-md shadow-stone-200/80" />
      <div className="absolute bottom-[18%] left-[28%] h-[32%] w-[48%] rounded-2xl bg-[#e3d0c4] shadow-md shadow-stone-200/80" />
      <div className="absolute bottom-[28%] right-[8%] h-[38%] w-[44%] rounded-2xl bg-[#c9dde0] shadow-md shadow-stone-200/80" />
      <div className="absolute right-[12%] top-[10%] h-[24%] w-[36%] rounded-2xl bg-[#e0d8e8] shadow-md shadow-stone-200/80" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-white/90 px-6 py-3 text-center shadow-lg shadow-stone-200/60 ring-1 ring-stone-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7f6a]">
            Nuevo
          </p>
          <p className="text-sm font-medium text-stone-700">Catálogo actualizado</p>
        </div>
      </div>
    </div>
  );
}

const HOME_PRODUCTS_LIMIT = 8;

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

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-[3.25rem]">
              Comprá en tu tienda, todo en un solo lugar.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-stone-600">
              Descubrí productos seleccionados, envíos claros y checkout seguro.
              Plantilla <span className="font-medium text-stone-800">{storeBrand}</span>{" "}
              lista para personalizar por marca.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex rounded-full bg-[#6b7f6a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5c6e5b]"
              >
                Ver catálogo
              </Link>
              <Link
                href="/products"
                className="inline-flex rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-[#fff5eb]"
              >
                Saber más
              </Link>
            </div>
          </div>
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
            <HeroVisual />
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-stone-200/60 bg-[#fffbf6] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Nuestras categorías destacadas
          </h2>
          <p className="mt-2 max-w-2xl text-stone-600">
            Explorá el catálogo completo; estas áreas te ayudan a orientarte.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.name}>
                <Link
                  href="/products"
                  className={`group flex min-h-[140px] flex-col justify-between rounded-2xl p-5 shadow-sm ring-1 ring-stone-200/60 transition hover:shadow-md hover:ring-stone-300/80 ${c.className}`}
                >
                  <span className="text-lg font-semibold text-stone-900">
                    {c.name}
                  </span>
                  <span className="text-sm text-stone-700/90">{c.hint}</span>
                  <span className="mt-3 text-sm font-medium text-[#556654] group-hover:underline">
                    Ver productos →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-16 border-t border-stone-200/80 pt-14 sm:mt-20 sm:pt-16">
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              Productos destacados
            </h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              Una muestra del catálogo; entrá a cada ítem para ver detalle y
              comprar.
            </p>

            {featuredProducts.length === 0 ? (
              <p className="mt-10 rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-10 text-center text-stone-500">
                Aún no hay productos publicados. Cargalos desde el admin para que
                aparezcan aquí.
              </p>
            ) : (
              <>
                <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {featuredProducts.map((p) => (
                    <li key={p.id}>
                      <ProductListingCard
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
