import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CatalogListingHero } from "@/components/store/CatalogListingHero";
import { CatalogPagination } from "@/components/store/CatalogPagination";
import { CategoryListingHero } from "@/components/store/CategoryListingHero";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { ProductsListingControls } from "@/components/store/ProductsListingControls";
import { storeShellClass, storeProductGridClass } from "@/lib/store-layout";
import { storeProductCardImagePriority } from "@/lib/store-product-card-image";
import { fetchPublishedBanners } from "@/lib/store-banners";
import {
  computeListingFacetsFromProductRows,
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
import {
  enrichListingProductsWithVariants,
  toProductListingCardProps,
} from "@/lib/store-listing-variant-meta";
import {
  fetchPublishedProductsForListing,
  shuffleStoreListingProducts,
  STORE_CATALOG_PAGE_SIZE,
  type StoreListingProductRow,
} from "@/lib/store-products-listing-query";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import { resolveCategoryListingHeroSrc } from "@/lib/category-listing-hero-url";
import { fetchHomeCategoryCards } from "@/lib/fetch-home-categories";
import { CatalogMoreCategories } from "@/components/store/CatalogMoreCategories";
import { categoryGroupKey } from "@/lib/store-category-group";

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
    page?: string | string[];
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
  const pageRaw = firstSearchParam(sp.page);
  const pageParsed = Number.parseInt(pageRaw, 10);
  const page =
    Number.isFinite(pageParsed) && pageParsed > 0 ? Math.floor(pageParsed) : 1;
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
  if (
    priceMin != null &&
    priceMax != null &&
    priceMin > priceMax
  ) {
    const t = priceMin;
    priceMin = priceMax;
    priceMax = t;
  }

  const supabase = await createSupabaseServerClient();

  const categoryLookupPromise =
    categoryId ?
      supabase
        .from("categories")
        .select("name,listing_hero_image_path,listing_hero_alt_text")
        .eq("id", categoryId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const categoriesPromise = supabase
    .from("categories")
    .select("id,name,sort_order,parent_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const [categoryLookup, { data: allCategoryRows, error: categoriesReadError }] =
    await Promise.all([categoryLookupPromise, categoriesPromise]);

  if (categoriesReadError) {
    console.error(
      "[products] categories:",
      categoriesReadError.message,
      categoriesReadError.code,
    );
  }

  let categoryName: string | null = null;
  let categoryFilterId: string | null = null;
  let categoryListingHeroPath: string | null = null;
  let categoryListingHeroAlt: string | null = null;
  const cat = categoryLookup.data;
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

  const categoryHeroResolvedSrc = categoryListingHeroPath
    ? resolveCategoryListingHeroSrc(categoryListingHeroPath)
    : null;
  const categoryView = Boolean(categoryFilterId && categoryName);
  const showCategoryListingHero = Boolean(
    categoryView && categoryHeroResolvedSrc,
  );

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

  const categoriesForFilterMenu = categoryFilterId
    ? []
    : mergeCategoryRowsForFilterMenu(allCategoryRows ?? []);

  const hasListingFilters =
    q.length > 0 ||
    activeBrands.length > 0 ||
    activeColors.length > 0 ||
    activeSizes.length > 0 ||
    filterCategoryIds.length > 0 ||
    priceMin != null ||
    priceMax != null ||
    sort !== "newest";

  const catalogBrowseMode = !categoryView && !hasListingFilters;

  const [
    listingFacetsFromQuery,
    productsBanners,
    listingResult,
    cartQtyByProductId,
    couponPctByProductId,
    homeCategoryCards,
  ] = await Promise.all([
    fetchListingFacets(supabase, { categoryIds: facetCategoryIds }),
    categoryView ?
      Promise.resolve([] as Awaited<ReturnType<typeof fetchPublishedBanners>>)
    : fetchPublishedBanners(supabase, "products"),
    fetchPublishedProductsForListing(supabase, {
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
      page,
    }),
    getStorefrontCartQuantityByProductId(),
    fetchStorefrontCouponDiscountPercentByProductId(supabase),
    categoryView ? fetchHomeCategoryCards(supabase) : Promise.resolve([]),
  ]);

  const categoryNameById = new Map(
    (allCategoryRows ?? []).map((c) => [c.id, c.name] as const),
  );

  let list: StoreListingProductRow[] = listingResult.products;
  let listingTotal = listingResult.total;

  let totalPages = Math.max(1, Math.ceil(listingTotal / STORE_CATALOG_PAGE_SIZE));
  let currentPage = Math.min(page, totalPages);

  if (page > totalPages && listingTotal > 0) {
    const clamped = await fetchPublishedProductsForListing(supabase, {
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
      page: totalPages,
    });
    list = clamped.products;
    listingTotal = clamped.total;
    totalPages = Math.max(
      1,
      Math.ceil(listingTotal / STORE_CATALOG_PAGE_SIZE),
    );
    currentPage = totalPages;
  }

  const listingFacets =
    listingFacetsFromQuery ?? computeListingFacetsFromProductRows([]);

  const enrichedList = await enrichListingProductsWithVariants(supabase, list);

  const withCategory = enrichedList.map((p) => ({
    ...p,
    categoryName:
      p.category_id ? (categoryNameById.get(p.category_id) ?? null) : null,
  }));

  const currentCategoryGroupKey =
    categoryName ? categoryGroupKey(categoryName) : null;
  const excludeCategoryIds = new Set(
    (expandedCategoryIds ?? []).map((id) => id.trim().toLowerCase()),
  );
  if (categoryFilterId) {
    excludeCategoryIds.add(categoryFilterId.trim().toLowerCase());
  }

  const moreCategories =
    categoryView && currentPage >= totalPages
      ? shuffleStoreListingProducts(
          homeCategoryCards.filter((c) => {
            if (c.productCount <= 0) return false;
            if (excludeCategoryIds.has(c.id.trim().toLowerCase())) return false;
            if (
              currentCategoryGroupKey &&
              categoryGroupKey(c.name) === currentCategoryGroupKey
            ) {
              return false;
            }
            return true;
          }),
        ).slice(0, 3)
      : [];

  const invalidCategory = Boolean(categoryId && !categoryName);

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

  const paginationParams = new URLSearchParams();
  if (q) paginationParams.set("q", q);
  if (sort && sort !== "newest") paginationParams.set("sort", sort);
  if (categoryFilterId) paginationParams.set("category", categoryFilterId);
  if (activeBrands.length === 1 && !firstSearchParam(sp.brands)) {
    paginationParams.set("brand", activeBrands[0]!);
  } else if (activeBrands.length > 0) {
    paginationParams.set("brands", activeBrands.join("|"));
  }
  if (activeColors.length > 0) {
    paginationParams.set("colors", activeColors.join("|"));
  }
  if (activeSizes.length > 0) {
    paginationParams.set(
      "sizes",
      activeSizes.map((s) => `${s.value}:${s.unit}`).join("|"),
    );
  }
  if (filterCategoryIds.length > 0) {
    paginationParams.set("categories", filterCategoryIds.join("|"));
  }
  if (priceMin != null) paginationParams.set("price_min", String(priceMin));
  if (priceMax != null) paginationParams.set("price_max", String(priceMax));
  const paginationBaseQuery = paginationParams.toString();

  const catalogHeroBanner = productsBanners[0];

  return (
    <div className="bg-white">
      {catalogBrowseMode ? (
        <div className="w-full">
          <CatalogListingHero
            title="CATÁLOGO"
            banner={
              catalogHeroBanner ?
                {
                  image_path: catalogHeroBanner.image_path,
                  alt_text: catalogHeroBanner.alt_text,
                }
              : null
            }
          />
        </div>
      ) : null}

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

      {categoryView && categoryName && !showCategoryListingHero ? (
        <header
          className={`${storeShellClass} border-b border-stone-100 pb-6 pt-8 text-center sm:pb-8 sm:pt-10`}
        >
          <h1 className="text-xl font-semibold uppercase tracking-[0.12em] text-stone-900 sm:text-2xl">
            {categoryName}
          </h1>
        </header>
      ) : null}

      {q && !categoryView ? (
        <header
          className={`${storeShellClass} border-b border-stone-100 pb-6 pt-8 text-center sm:pb-8 sm:pt-10`}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
            Resultados de búsqueda
          </p>
          <h1 className="mt-2 text-xl font-semibold uppercase tracking-[0.12em] text-stone-900 sm:text-2xl">
            «{q}»
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {listingTotal === 1
              ? "1 producto encontrado"
              : `${listingTotal} productos encontrados`}
          </p>
        </header>
      ) : null}

      <div className="w-full bg-white">
        <div className={storeShellClass}>
          <ProductsListingControls
            key={controlsKey}
            lockedCategoryId={categoryFilterId}
            facets={{
              brands: listingFacets.brands,
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
        </div>
      </div>

      <div
        className={`${storeShellClass} space-y-10 sm:space-y-12 lg:py-14 ${
          categoryView
            ? "py-8 sm:py-10"
            : "py-10 sm:py-12 lg:py-14"
        }`}
      >
        {!categoryView && !catalogBrowseMode && productsBanners.length > 0 ? (
          <StoreBannerCarousel
            variant="products"
            slides={productsBanners.map((b) => ({
              id: b.id,
              image_path: b.image_path,
              href: b.href,
              alt_text: b.alt_text,
            }))}
          />
        ) : null}

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-12 text-center text-stone-500">
            {invalidCategory
              ? "Esa categoría no existe o fue eliminada. Vuelve a ver todos los productos."
              : q
                ? "No hay productos que coincidan. Prueba otra búsqueda o orden."
                : categoryName
                  ? "Todavía no hay productos publicados en esta categoría."
                  : "Aún no hay productos publicados. Cárgalos desde el admin."}
          </p>
        ) : (
          <div className="space-y-10">
            <ul className={storeProductGridClass}>
              {withCategory.map((p, index) => (
                <li key={p.id} className="h-full">
                  <ProductListingCard
                    imagePriority={storeProductCardImagePriority(index)}
                    cartQuantity={cartQtyByProductId[p.id] ?? 0}
                    couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                    product={toProductListingCardProps({
                      ...p,
                      categoryName: catalogBrowseMode ? p.categoryName : null,
                    })}
                  />
                </li>
              ))}
            </ul>
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseQuery={paginationBaseQuery}
            />
          </div>
        )}

        {moreCategories.length > 0 ? (
          <CatalogMoreCategories categories={moreCategories} />
        ) : null}
      </div>
    </div>
  );
}
