import Link from "next/link";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { ProductDetailView } from "@/components/store/ProductDetailView";
import { ProductDetailHeroServer } from "@/components/store/ProductDetailHeroServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productDisplayImageUrl } from "@/lib/storage-image-url";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import { expandFragranceLabels } from "@/lib/fragrance-options";
import {
  fragranceImagesForLabel,
  normalizeFragranceOptionImages,
  normalizeProductImagePaths,
} from "@/lib/product-images";
import {
  formatSizeOption,
  normalizeSizeOptionsFromRow,
} from "@/lib/product-size-options";
import { storeShellClass } from "@/lib/store-layout";
import { fetchStorefrontCouponDiscountPercentForProduct } from "@/lib/store-coupons";

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
  const { data: product } = await supabase
    .from("products")
    .select(
      "id,name,description,price_cents,stock_quantity,image_path,image_paths,fragrance_option_images,size_options,size_value,size_unit,has_expiration,expiration_date,colors,fragrance_options,has_vat,vat_percent,brand,category_id,categories(name)",
    )
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) notFound();

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
  const fragranceImgMap = normalizeFragranceOptionImages(
    product.fragrance_option_images,
  );
  const fragranceLabelsRaw = Array.isArray(product.fragrance_options)
    ? product.fragrance_options.filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      )
    : [];
  const fragranceLabels = expandFragranceLabels(fragranceLabelsRaw);
  const fragranceImageUrls: Record<string, string[]> = {};
  for (const label of fragranceLabels) {
    const paths = fragranceImagesForLabel(fragranceImgMap, label);
    const urls = paths
      .map((path) => storagePublicObjectUrl(path))
      .filter((u): u is string => Boolean(u));
    if (urls.length > 0) fragranceImageUrls[label] = urls;
  }
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
    fragranceLabels.length > 0
      ? (fragranceImageUrls[fragranceLabels[0] ?? ""] ?? [])
      : imageUrls;
  const initialHeroSrc = defaultGalleryUrls[0] ?? imageUrls[0] ?? null;
  const initialHeroAlt =
    fragranceLabels.length > 0 && fragranceLabels[0]
      ? `${product.name} — ${fragranceLabels[0]}`
      : product.name;
  const heroPreloadUrl = productDisplayImageUrl(initialHeroSrc, "hero");
  if (heroPreloadUrl) {
    preload(heroPreloadUrl, { as: "image", fetchPriority: "high" });
  }

  return (
    <>
      {heroPreloadUrl ? (
        <link
          rel="preload"
          as="image"
          href={heroPreloadUrl}
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
        imageUrls={imageUrls}
        fragranceImageUrls={fragranceImageUrls}
        sizeLabels={sizeLabels}
        hasExpiration={product.has_expiration}
        expirationDate={product.expiration_date}
        colors={Array.isArray(product.colors) ? product.colors : []}
        fragranceOptions={fragranceLabels}
        hasVat={product.has_vat}
        vatPercent={product.vat_percent}
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
