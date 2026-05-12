import Link from "next/link";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { ProductsListingControls } from "@/components/store/ProductsListingControls";
import { storeBrand } from "@/lib/brand";
import {
  groupPublishedProductsByBrand,
  isUsableStoreBrand,
} from "@/lib/fetch-store-catalog-by-brand";
import {
  fetchListingFacets,
  mergeCategoryRowsForFilterMenu,
} from "@/lib/product-listing-facets";
import {
  expandCategoryIdsFromRows,
  expandManyCategoryIdsFromRows,
  fetchExpandedCategoryIds,
} from "@/lib/store-category-group";
import {
  parseProductsBrandFilter,
  parseProductsBrandsParam,
  parseProductsCategoriesFilterParam,
  parseProductsCategoryId,
  parseProductsColorsParam,
  parseProductsPriceMaxParam,
  parseProductsPriceMinParam,
  parseProductsSizesParam,
} from "@/lib/product-list-query";
import { fetchPublishedProductsForListing } from "@/lib/store-products-listing-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function firstSearchParam(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

type Props = {
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
    category?: string | string[];
    brand?: string | string[];
    brands?: string | string[];
    colors?: string | string[];
    sizes?: string | string[];
    categories?: string | string[];
    price_min?: string | string[];
    price_max?: string | string[];
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Marcas · ${storeBrand}`,
    description: `Catálogo de productos por marca en ${storeBrand}.`,
  };
}

export default async function StoreBrandsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const qRaw = sp.q;
  const q = typeof qRaw === "string" ? qRaw.trim() : "";
  const sortRaw = sp.sort;
  const sort =
    typeof sortRaw === "string" && sortRaw.trim()
      ? sortRaw.trim()
      : "newest";
  const categoryId = parseProductsCategoryId(firstSearchParam(sp.category));
  const brandsParam = parseProductsBrandsParam(firstSearchParam(sp.brands));
  const legacyBrand = parseProductsBrandFilter(firstSearchParam(sp.brand));
  const activeBrands =
    brandsParam.length > 0
      ? brandsParam
      : legacyBrand
        ? [legacyBrand]
        : [];

  const activeColors = parseProductsColorsParam(firstSearchParam(sp.colors));
  const activeSizes = parseProductsSizesParam(firstSearchParam(sp.sizes));
  let priceMin = parseProductsPriceMinParam(firstSearchParam(sp.price_min));
  let priceMax = parseProductsPriceMaxParam(firstSearchParam(sp.price_max));
  if (priceMin != null && priceMax != null && priceMin > priceMax) {
    const t = priceMin;
    priceMin = priceMax;
    priceMax = t;
  }

  const supabase = await createSupabaseServerClient();

  let categoryName: string | null = null;
  let categoryFilterId: string | null = null;
  if (categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .maybeSingle();
    if (cat?.name) {
      categoryName = cat.name;
      categoryFilterId = categoryId;
    }
  }

  const { data: allCategoryRows } = await supabase
    .from("categories")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const filterCategoryIds = categoryFilterId
    ? []
    : parseProductsCategoriesFilterParam(firstSearchParam(sp.categories));

  let expandedCategoryIds: string[] | null = null;
  if (categoryFilterId) {
    expandedCategoryIds =
      allCategoryRows?.length ?
        expandCategoryIdsFromRows(allCategoryRows, categoryFilterId)
      : await fetchExpandedCategoryIds(supabase, categoryFilterId);
  }

  let facetCategoryIds: string[] | null = expandedCategoryIds;
  if (
    !categoryFilterId &&
    filterCategoryIds.length > 0 &&
    allCategoryRows?.length
  ) {
    facetCategoryIds = expandManyCategoryIdsFromRows(
      allCategoryRows,
      filterCategoryIds,
    );
  }
  if (!facetCategoryIds?.length) facetCategoryIds = null;

  const listingFacets = await fetchListingFacets(supabase, {
    categoryIds: facetCategoryIds,
  });

  const categoriesForFilterMenu = categoryFilterId
    ? []
    : mergeCategoryRowsForFilterMenu(allCategoryRows ?? []);

  const invalidCategory = Boolean(categoryId && !categoryName);

  const list = invalidCategory
    ? []
    : await fetchPublishedProductsForListing(supabase, {
        categoryFilterId,
        filterCategoryIds,
        activeBrands,
        activeColors,
        activeSizes,
        priceMin,
        priceMax,
        q,
        sort,
        allCategoryRows,
      });

  const sections = groupPublishedProductsByBrand(list);

  const cartQtyByProductId = await getStorefrontCartQuantityByProductId();
  const couponPctByProductId =
    await fetchStorefrontCouponDiscountPercentByProductId(supabase);

  const controlsKey = [
    categoryFilterId ?? "",
    activeBrands.join(","),
    activeColors.join("|"),
    activeSizes.map((s) => `${s.value}:${s.unit}`).join("|"),
    filterCategoryIds.join(","),
    priceMin ?? "",
    priceMax ?? "",
    sort,
    q,
  ].join("::");

  return (
    <div className="bg-white">
      <RevealOnScroll className="w-full">
        <header className="mx-auto max-w-7xl border-b border-stone-100 px-4 pb-6 pt-8 text-center sm:pb-8 sm:pt-10">
          <h1 className="text-xl font-semibold uppercase tracking-[0.12em] text-stone-900 sm:text-2xl">
            Marcas
          </h1>
        </header>
      </RevealOnScroll>

      <div className="w-full bg-white">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="w-full">
            <ProductsListingControls
              key={controlsKey}
              listingPath="/marcas"
              lockedCategoryId={categoryFilterId}
              facets={{
                brands: listingFacets.brands.filter(isUsableStoreBrand),
                colors: listingFacets.colors,
                sizes: listingFacets.sizes,
                priceMin: listingFacets.priceMin,
                priceMax: listingFacets.priceMax,
                categories: categoriesForFilterMenu,
              }}
              selection={{
                brands: activeBrands,
                colors: activeColors,
                sizes: activeSizes.map((s) => `${s.value}:${s.unit}`),
                categoryIds: filterCategoryIds,
                priceMin,
                priceMax,
              }}
              sort={sort}
              searchQuery={q}
            />
          </RevealOnScroll>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:py-12">
        {invalidCategory ? (
          <p className="rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-12 text-center text-stone-500">
            Esa categoría no existe o fue eliminada.{" "}
            <Link
              href="/marcas"
              className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-4"
            >
              Volver a marcas
            </Link>
          </p>
        ) : sections.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-12 text-center text-stone-500">
            {q
              ? "No hay productos que coincidan. Probá otra búsqueda o ajustá los filtros."
              : "Aún no hay productos publicados. Cargá el catálogo desde Administración."}
          </p>
        ) : (
          <>
            <div className="space-y-14 sm:space-y-16 lg:space-y-20">
              {sections.map((section, sIndex) => (
                <section
                  key={section.id}
                  aria-labelledby={`${section.id}-heading`}
                >
                  <RevealOnScroll className="border-b border-stone-200/80 pb-5">
                    <div>
                      <h2
                        id={`${section.id}-heading`}
                        className="text-lg font-semibold uppercase tracking-[0.08em] text-stone-900 sm:text-xl"
                      >
                        {section.title}
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        {section.products.length}{" "}
                        {section.products.length === 1
                          ? "producto"
                          : "productos"}
                      </p>
                    </div>
                  </RevealOnScroll>

                  <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10 xl:grid-cols-4">
                    {section.products.map((p, index) => (
                      <li key={p.id}>
                        <RevealOnScroll
                          className="h-full"
                          delayMs={Math.min(index * 45, 360)}
                        >
                          <ProductListingCard
                            accentImageBg={(sIndex + index) % 4 === 3}
                            cartQuantity={cartQtyByProductId[p.id] ?? 0}
                            couponDiscountPercent={
                              couponPctByProductId[p.id] ?? 0
                            }
                            product={{
                              id: p.id,
                              name: p.name,
                              brand: p.brand || section.title,
                              description: p.description,
                              price_cents: p.price_cents,
                              image_path: p.image_path,
                              stock_quantity: p.stock_quantity,
                              size_options: p.size_options,
                              size_value: p.size_value,
                              size_unit: p.size_unit,
                              fragrance_options: p.fragrance_options,
                            }}
                          />
                        </RevealOnScroll>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <p className="mt-14 text-center">
              <Link
                href="/products"
                className="text-sm font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900"
              >
                Ver catálogo completo
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
