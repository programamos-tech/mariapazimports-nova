import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CatalogBrowseSections } from "@/components/store/CatalogBrowseSections";
import { CatalogListingHero } from "@/components/store/CatalogListingHero";
import { CategoryListingHero } from "@/components/store/CategoryListingHero";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { ProductsListingControls } from "@/components/store/ProductsListingControls";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { storeShellClass, storeProductGridClass } from "@/lib/store-layout";
import { storeProductCardRevealOptions } from "@/lib/store-product-card-image";
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
  type StoreListingProductRow,
} from "@/lib/store-products-listing-query";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import { fetchCatalogBrowseSections } from "@/lib/catalog-browse-rows";
import { resolveCategoryListingHeroSrc } from "@/lib/category-listing-hero-url";

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

export default async function ProductsPage({ searchParams }: Props) {
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
    .select("id,name,sort_order")
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
    catalogBrowseData,
    list,
    cartQtyByProductId,
    couponPctByProductId,
  ] = await Promise.all([
    catalogBrowseMode ?
      Promise.resolve(null)
    : fetchListingFacets(supabase, { categoryIds: facetCategoryIds }),
    categoryView ?
      Promise.resolve([] as Awaited<ReturnType<typeof fetchPublishedBanners>>)
    : fetchPublishedBanners(supabase, "products"),
    catalogBrowseMode && allCategoryRows?.length ?
      fetchCatalogBrowseSections(supabase, allCategoryRows)
    : Promise.resolve(null),
    catalogBrowseMode ?
      Promise.resolve([] as StoreListingProductRow[])
    : fetchPublishedProductsForListing(supabase, {
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
      }),
    getStorefrontCartQuantityByProductId(),
    fetchStorefrontCouponDiscountPercentByProductId(supabase),
  ]);

  const catalogSections = catalogBrowseData?.sections ?? null;
  const listingFacets =
    catalogBrowseMode && catalogBrowseData ?
      catalogBrowseData.facets
    : listingFacetsFromQuery ?? computeListingFacetsFromProductRows([]);

  /** Si el modo “por categorías” no devolvió secciones pero hay filas publicadas (p. ej. error al leer categorías), mostrar grid plano. */
  let browseFlatFallback: StoreListingProductRow[] = [];
  let publishedProductHeadCount: number | null = null;
  if (
    catalogBrowseMode &&
    (!catalogSections || catalogSections.length === 0)
  ) {
    const { count, error: countErr } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);
    if (countErr) {
      console.error("[products] count published:", countErr.message, countErr.code);
    } else {
      publishedProductHeadCount = count ?? 0;
    }
    if ((publishedProductHeadCount ?? 0) > 0) {
      browseFlatFallback = await fetchPublishedProductsForListing(supabase, {
        categoryFilterId: null,
        filterCategoryIds: [],
        activeBrands: [],
        activeColors: [],
        activeSizes: [],
        priceMin: null,
        priceMax: null,
        q: "",
        sort,
        allCategoryRows,
      });
    }
  }

  const showCatalogBrowseSections =
    catalogBrowseMode &&
    Boolean(catalogSections && catalogSections.length > 0);
  const showBrowseFlatFallback =
    catalogBrowseMode &&
    !showCatalogBrowseSections &&
    browseFlatFallback.length > 0;

  const enrichedList = catalogBrowseMode
    ? []
    : await enrichListingProductsWithVariants(supabase, list);
  const enrichedBrowseFlat = showBrowseFlatFallback
    ? await enrichListingProductsWithVariants(supabase, browseFlatFallback)
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
        <RevealOnScroll className="w-full">
          <CategoryListingHero
            imagePath={categoryListingHeroPath}
            title={categoryName}
            alt={categoryListingHeroAlt}
          />
        </RevealOnScroll>
      ) : null}

      {categoryView && categoryName && !showCategoryListingHero ? (
        <RevealOnScroll className="w-full">
          <header
            className={`${storeShellClass} border-b border-stone-100 pb-6 pt-8 text-center sm:pb-8 sm:pt-10`}
          >
            <h1 className="text-xl font-semibold uppercase tracking-[0.12em] text-stone-900 sm:text-2xl">
              {categoryName}
            </h1>
          </header>
        </RevealOnScroll>
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
          <RevealOnScroll className="w-full">
            <StoreBannerCarousel
              variant="products"
              slides={productsBanners.map((b) => ({
                id: b.id,
                image_path: b.image_path,
                href: b.href,
                alt_text: b.alt_text,
              }))}
            />
          </RevealOnScroll>
        ) : null}

        {showCatalogBrowseSections ? (
          <CatalogBrowseSections
            sections={catalogSections!}
            cartQtyByProductId={cartQtyByProductId}
            couponPctByProductId={couponPctByProductId}
          />
        ) : showBrowseFlatFallback ? (
          <ul className={storeProductGridClass}>
            {browseFlatFallback.map((p, index) => {
              const reveal = storeProductCardRevealOptions(index);
              return (
              <li key={p.id}>
                <RevealOnScroll
                  className="h-full"
                  initialVisible={reveal.revealInitialVisible}
                  delayMs={reveal.revealDelayMs}
                >
                  <ProductListingCard
                    imagePriority={reveal.imagePriority}
                    cartQuantity={cartQtyByProductId[p.id] ?? 0}
                    couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                    product={toProductListingCardProps(enrichedBrowseFlat[index]!)}
                  />
                </RevealOnScroll>
              </li>
              );
            })}
          </ul>
        ) : catalogBrowseMode ? (
          <p className="rounded-2xl border border-dashed border-stone-200/80 bg-white/80 p-12 text-center text-stone-500">
            {publishedProductHeadCount != null && publishedProductHeadCount > 0
              ? "Hay productos publicados en la base de datos, pero no se pudieron agrupar para la vitrina. Revisa en Vercel que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY sean del mismo proyecto Supabase donde ves los datos, y vuelve a desplegar tras cambiar variables."
              : "Aún no hay productos publicados. Cárgalos desde el admin."}
          </p>
        ) : list.length === 0 ? (
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
          <ul className={storeProductGridClass}>
            {enrichedList.map((p, index) => {
              const reveal = storeProductCardRevealOptions(index);
              return (
              <li key={p.id}>
                <RevealOnScroll
                  className="h-full"
                  initialVisible={reveal.revealInitialVisible}
                  delayMs={reveal.revealDelayMs}
                >
                  <ProductListingCard
                    imagePriority={reveal.imagePriority}
                    cartQuantity={cartQtyByProductId[p.id] ?? 0}
                    couponDiscountPercent={couponPctByProductId[p.id] ?? 0}
                    product={toProductListingCardProps(p)}
                  />
                </RevealOnScroll>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
