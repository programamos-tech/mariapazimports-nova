import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CategoryListingHero } from "@/components/store/CategoryListingHero";
import { ProductsListingPromo } from "@/components/store/ProductsListingPromo";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { fetchPublishedBanners } from "@/lib/store-banners";
import { parseProductsCategoryId } from "@/lib/product-list-query";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import { resolveCategoryListingHeroSrc } from "@/lib/category-listing-hero-url";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
    category?: string | string[];
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
  const categoryId = parseProductsCategoryId(sp.category);

  const supabase = await createSupabaseServerClient();

  let categoryName: string | null = null;
  let categoryFilterId: string | null = null;
  let categoryListingHeroPath: string | null = null;
  let categoryListingHeroAlt: string | null = null;
  if (categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name,listing_hero_image_path,listing_hero_alt_text")
      .eq("id", categoryId)
      .maybeSingle();
    if (cat?.name) {
      categoryName = cat.name;
      categoryFilterId = categoryId;
      categoryListingHeroPath =
        typeof cat.listing_hero_image_path === "string" &&
        cat.listing_hero_image_path.trim()
          ? cat.listing_hero_image_path.trim()
          : null;
      categoryListingHeroAlt =
        typeof cat.listing_hero_alt_text === "string" &&
        cat.listing_hero_alt_text.trim()
          ? cat.listing_hero_alt_text.trim()
          : null;
    }
  }

  const categoryHeroResolvedSrc = categoryListingHeroPath
    ? resolveCategoryListingHeroSrc(categoryListingHeroPath)
    : null;
  const categoryView = Boolean(categoryFilterId && categoryName);
  const showCategoryListingHero = Boolean(
    categoryView && categoryHeroResolvedSrc,
  );

  let query = supabase
    .from("products")
    .select(
      "id,name,brand,description,price_cents,image_path,stock_quantity,size_value,size_unit,created_at",
    )
    .eq("is_published", true);

  if (categoryFilterId) {
    query = query.eq("category_id", categoryFilterId);
  }

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

  const cartQtyByProductId = await getStorefrontCartQuantityByProductId();

  const productsBanners = categoryView
    ? []
    : await fetchPublishedBanners(supabase, "products");
  const couponPctByProductId =
    await fetchStorefrontCouponDiscountPercentByProductId(supabase);

  const invalidCategory = Boolean(categoryId && !categoryName);
  return (
    <div className="bg-white">
      {showCategoryListingHero &&
      categoryListingHeroPath &&
      categoryName &&
      categoryHeroResolvedSrc ? (
        <CategoryListingHero
          imagePath={categoryListingHeroPath}
          title={categoryName}
          alt={categoryListingHeroAlt}
        />
      ) : null}

      <div
        className={`mx-auto max-w-7xl space-y-10 px-4 sm:space-y-12 lg:py-14 ${
          categoryView
            ? "py-8 sm:py-10"
            : "py-10 sm:py-12 lg:py-14"
        }`}
      >
        {!categoryView ? (
          productsBanners.length > 0 ? (
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
          )
        ) : null}

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-12 text-center text-stone-500">
            {invalidCategory
              ? "Esa categoría no existe o fue eliminada. Vuelve al catálogo completo."
              : q
                ? "No hay productos que coincidan. Prueba otra búsqueda o orden."
                : categoryName
                  ? "Todavía no hay productos publicados en esta categoría."
                  : "Aún no hay productos publicados. Cárgalos desde el admin."}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10 xl:grid-cols-4">
            {list.map((p, index) => (
              <li key={p.id}>
                <ProductListingCard
                  accentImageBg={index % 4 === 3}
                  cartQuantity={cartQtyByProductId[p.id] ?? 0}
                  couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                  product={{
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    description: p.description,
                    price_cents: p.price_cents,
                    image_path: p.image_path,
                    stock_quantity: p.stock_quantity,
                    size_value: p.size_value,
                    size_unit: p.size_unit,
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
