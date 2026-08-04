import Link from "next/link";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import {
  ProductDetailView,
  type ProductDetailVariant,
} from "@/components/store/ProductDetailView";
import { ProductDetailHeroServer } from "@/components/store/ProductDetailHeroServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productHeroImageSources } from "@/lib/storage-image-url";
import { STORE_PRODUCT_DETAIL_HERO_SIZES } from "@/lib/store-product-card-image";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import {
  normalizeProductImagePaths,
} from "@/lib/product-images";
import {
  formatSizeOption,
  normalizeSizeOptionsFromRow,
} from "@/lib/product-size-options";
import { storeShellClass } from "@/lib/store-layout";
import { fetchStorefrontCouponDiscountPercentForProduct } from "@/lib/store-coupons";
import {
  fetchProductVariantsForProduct,
  parseProductVariantAxis,
} from "@/lib/product-variants";
import { parseProductImportOrigin } from "@/lib/product-import-origin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function catalogHref(categoryId: string | null, brand: string | null): string {
  const params = new URLSearchParams();
  if (categoryId) params.set("category", categoryId);
  if (brand?.trim()) params.set("brand", brand.trim());
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: product }, variantsRaw] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,description,price_cents,stock_quantity,image_path,image_paths,variant_axis,size_options,size_value,size_unit,has_expiration,expiration_date,colors,has_vat,vat_percent,brand,category_id,import_origin,categories(name)",
      )
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle(),
    fetchProductVariantsForProduct(supabase, id),
  ]);

  if (!product) notFound();

  const variantAxis = parseProductVariantAxis(product.variant_axis);
  const variants: ProductDetailVariant[] = variantsRaw.map((v) => ({
    id: v.id,
    label: v.label,
    priceCents: v.priceCents,
    stockQuantity: v.stockQuantity,
    imageUrls: v.imagePaths
      .map((path) => storagePublicObjectUrl(path))
      .filter((u): u is string => Boolean(u)),
  }));

  const catRel = product.categories as { name?: string } | null | undefined;
  const categoryName =
    catRel && typeof catRel === "object" && "name" in catRel
      ? String(catRel.name ?? "").trim() || null
      : null;

  const catalogPaths = normalizeProductImagePaths(
    product.image_path,
    product.image_paths,
  );
  const imageUrls = catalogPaths
    .map((path) => storagePublicObjectUrl(path))
    .filter((u): u is string => Boolean(u));

  const couponDiscountPercent =
    await fetchStorefrontCouponDiscountPercentForProduct(supabase, product.id);

  const sizeLabels = normalizeSizeOptionsFromRow({
    size_options: product.size_options,
    size_value: product.size_value,
    size_unit: product.size_unit,
  }).map(formatSizeOption);

  const brandTrim =
    product.brand != null && String(product.brand).trim()
      ? String(product.brand).trim()
      : null;
  const categoryId = product.category_id;

  const defaultGalleryUrls =
    variants[0]?.imageUrls.length ? variants[0]!.imageUrls : imageUrls;
  const initialHeroSrc = defaultGalleryUrls[0] ?? imageUrls[0] ?? null;
  const initialHeroAlt =
    variants[0]?.label
      ? `${product.name} — ${variants[0]!.label}`
      : product.name;
  const { src: heroPreloadUrl, srcSet: heroPreloadSrcSet } =
    productHeroImageSources(initialHeroSrc);
  if (heroPreloadUrl) {
    preload(heroPreloadUrl, {
      as: "image",
      fetchPriority: "high",
      // Coincide con el <img> del hero para que el navegador precargue el mismo
      // candidato y no descargue dos imágenes distintas.
      imageSrcSet: heroPreloadSrcSet ?? undefined,
      imageSizes: heroPreloadSrcSet ? STORE_PRODUCT_DETAIL_HERO_SIZES : undefined,
    });
  }

  return (
    <>
      {heroPreloadUrl ? (
        <link
          rel="preload"
          as="image"
          href={heroPreloadUrl}
          imageSrcSet={heroPreloadSrcSet ?? undefined}
          imageSizes={
            heroPreloadSrcSet ? STORE_PRODUCT_DETAIL_HERO_SIZES : undefined
          }
          fetchPriority="high"
        />
      ) : null}
      <div
        className={`${storeShellClass} pb-10 pt-4 sm:pb-12 sm:pt-5 lg:pb-14 lg:pt-6`}
      >
      <nav aria-label="Migas de pan" className="mb-5 text-[11px] uppercase tracking-[0.12em] text-stone-400">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="transition hover:text-stone-700">
              Inicio
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          {categoryName && categoryId ? (
            <>
              <li>
                <Link
                  href={`/products?category=${encodeURIComponent(categoryId)}`}
                  className="transition hover:text-stone-700"
                  title={categoryName}
                >
                  {categoryName}
                </Link>
              </li>
              <li aria-hidden className="text-stone-300">
                /
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/products" className="transition hover:text-stone-700">
                  Productos
                </Link>
              </li>
              <li aria-hidden className="text-stone-300">
                /
              </li>
            </>
          )}
          {brandTrim ? (
            <>
              <li>
                <Link
                  href={catalogHref(categoryId, brandTrim)}
                  className="transition hover:text-stone-700"
                  title={brandTrim}
                >
                  {brandTrim}
                </Link>
              </li>
              <li aria-hidden className="text-stone-300">
                /
              </li>
            </>
          ) : null}
          <li
            className="max-w-[min(100%,28rem)] truncate text-stone-600"
            title={product.name}
          >
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductDetailView
        productId={product.id}
        name={product.name}
        description={product.description}
        priceCents={product.price_cents}
        stockQuantity={product.stock_quantity}
        variantAxis={variantAxis}
        variants={variants}
        imageUrls={imageUrls}
        sizeLabels={sizeLabels}
        hasExpiration={product.has_expiration}
        expirationDate={product.expiration_date}
        colors={Array.isArray(product.colors) ? product.colors : []}
        hasVat={product.has_vat}
        vatPercent={product.vat_percent}
        importOrigin={parseProductImportOrigin(product.import_origin)}
        couponDiscountPercent={couponDiscountPercent}
      >
        {initialHeroSrc ? (
          <ProductDetailHeroServer src={initialHeroSrc} alt={initialHeroAlt} />
        ) : null}
      </ProductDetailView>
      </div>
    </>
  );
}
