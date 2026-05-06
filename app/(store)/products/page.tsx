import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductsListingPromo } from "@/components/store/ProductsListingPromo";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { ProductsFilterSortBar } from "@/components/store/ProductsFilterSortBar";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { fetchPublishedBanners } from "@/lib/store-banners";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const qRaw = sp.q;
  const q = typeof qRaw === "string" ? qRaw.trim() : "";
  const sortRaw = sp.sort;
  const sort =
    typeof sortRaw === "string" && sortRaw.trim()
      ? sortRaw.trim()
      : "newest";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(
      "id,name,description,price_cents,image_path,stock_quantity,created_at",
    )
    .eq("is_published", true);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  switch (sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: products } = await query;
  const list = products ?? [];

  const productsBanners = await fetchPublishedBanners(supabase, "products");

  const sectionTitle = q
    ? `Resultados para «${q}»`
    : "Productos para vos";

  return (
    <div className="bg-[#fffbf6]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:py-10">
        {productsBanners.length > 0 ? (
          <StoreBannerCarousel
            variant="products"
            slides={productsBanners.map((b) => ({
              id: b.id,
              image_path: b.image_path,
              href: b.href,
              alt_text: b.alt_text,
            }))}
          />
        ) : (
          <ProductsListingPromo />
        )}

        <ProductsFilterSortBar q={q} sort={sort} />

        <div>
          <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
            {sectionTitle}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Elegí favoritos y agregalos al carrito en un clic.
          </p>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-12 text-center text-stone-500">
            {q
              ? "No hay productos que coincidan. Probá otra búsqueda o orden."
              : "Aún no hay productos publicados. Cargalos desde el admin."}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
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
        )}
      </div>
    </div>
  );
}
