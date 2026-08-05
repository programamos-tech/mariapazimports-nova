"use client";

import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import {
  STORE_HEADER_ICON_STROKE,
} from "@/lib/store-header-icons";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  addToCartFromForm,
  setLineQuantity,
} from "@/app/actions/cart";
import { StoreAddToBagButton } from "@/components/store/StoreAddToBagButton";
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";
import { StoreProductCardImage } from "@/components/store/StoreProductCardImage";
import { formatCop } from "@/lib/money";
import {
  storefrontPriceAfterCouponCents,
} from "@/lib/store-coupons";
import {
  getVariantPickerTitle,
  parseProductVariantAxis,
  type StorefrontProductVariantMeta,
} from "@/lib/product-variants";
import {
  productCardDisplayImages,
  productPrimaryPublicImageUrl,
} from "@/lib/product-card-display-images";
import {
  STORE_PRODUCT_CARD_IMAGE_SIZES,
} from "@/lib/store-product-card-image";
import {
  prefetchProductHeroImage,
} from "@/lib/storage-image-url";
import { ProductImportOriginMark } from "@/components/store/ProductImportOriginMark";
import {
  parseProductImportOrigin,
  type ProductImportOrigin,
} from "@/lib/product-import-origin";

/** Precarga ruta RSC + imagen hero al pasar el mouse (entrada rápida al detalle). */
function prefetchProductDetail(
  router: ReturnType<typeof useRouter>,
  productId: string,
  heroImg: string | null,
) {
  void router.prefetch(`/products/${productId}`);
  prefetchProductHeroImage(heroImg);
}

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  image_paths?: unknown;
  stock_quantity: number;
  brand?: string | null;
  /** Si viene, la card muestra la categoría en lugar de la marca. */
  categoryName?: string | null;
  import_origin?: ProductImportOrigin | string | null;
  size_options?: unknown;
  size_value?: number | null;
  size_unit?: string | null;
  fragrance_options?: string[] | null;
  variant_axis?: string | null;
  listingPriceCents?: number;
  listingStockQuantity?: number;
  variantMeta?: StorefrontProductVariantMeta;
};

function productOrigin(product: Product): ProductImportOrigin {
  return parseProductImportOrigin(product.import_origin);
}

function displayPriceCents(product: Product): number {
  return product.listingPriceCents ?? product.price_cents;
}

function displayStockQuantity(product: Product): number {
  return product.listingStockQuantity ?? product.stock_quantity;
}

function productRequiresVariantChoice(product: Product): boolean {
  if (product.variantMeta?.requiresVariantChoice) return true;
  const axis = parseProductVariantAxis(product.variant_axis);
  return axis !== "none" && (product.variantMeta?.variants.length ?? 0) > 1;
}

function variantChoiceCtaLabel(product: Product): string {
  const axis = parseProductVariantAxis(product.variant_axis);
  const title = getVariantPickerTitle(axis);
  if (title === "Presentación") return "Elegir presentación";
  if (title === "Fragancia") return "Elegir fragancia";
  return `Elegir ${title.toLowerCase()}`;
}

/** Precios únicos de presentaciones (ordenados), o un solo precio de listado. */
function listingPriceCentsList(product: Product): number[] {
  const variants = product.variantMeta?.variants ?? [];
  if (productRequiresVariantChoice(product) && variants.length > 1) {
    const unique = [
      ...new Set(
        variants.map((v) => Math.max(0, Math.floor(Number(v.priceCents) || 0))),
      ),
    ].sort((a, b) => a - b);
    if (unique.length > 0) return unique;
  }
  return [displayPriceCents(product)];
}

function formatListingPrices(
  prices: number[],
  couponPct = 0,
): { strikethrough: string | null; main: string } {
  const pct = Math.max(0, Math.min(100, Math.floor(Number(couponPct) || 0)));
  const apply = (cents: number) =>
    pct > 0 ? storefrontPriceAfterCouponCents(cents, pct) : cents;
  const join = (list: number[]) => list.map((c) => formatCop(c)).join(" · ");
  if (pct > 0) {
    return {
      strikethrough: join(prices),
      main: join(prices.map(apply)),
    };
  }
  return { strikethrough: null, main: join(prices) };
}

function ListingPrices({
  product,
  couponDiscountPercent = 0,
  compact = false,
}: {
  product: Product;
  couponDiscountPercent?: number;
  compact?: boolean;
}) {
  const prices = listingPriceCentsList(product);
  const { strikethrough, main } = formatListingPrices(
    prices,
    couponDiscountPercent,
  );
  const mainClass = compact
    ? "text-[11px] font-medium tabular-nums text-stone-900"
    : "text-[13px] font-medium tabular-nums text-stone-900";
  const strikeClass = compact
    ? "text-[10px] tabular-nums text-stone-400 line-through decoration-stone-300"
    : "text-[11px] tabular-nums text-stone-400 line-through decoration-stone-300";

  if (strikethrough) {
    return (
      <>
        <p className={strikeClass}>{strikethrough}</p>
        <p className={mainClass}>{main}</p>
      </>
    );
  }
  return <p className={mainClass}>{main}</p>;
}

function showcaseEyebrowLabel(product: Product): string | null {
  const nameUpper = product.name.trim().toUpperCase();
  const cat = product.categoryName?.trim();
  if (cat) {
    const u = cat.toUpperCase();
    return u === nameUpper ? null : u;
  }
  const b = product.brand?.trim();
  if (b) {
    const u = b.toUpperCase();
    return u === nameUpper ? null : u;
  }
  return null;
}

/** Tarjeta solo lectura: imagen + marca + nombre + precio (sin bordes ni CTAs en superficie). */
function ShowcaseProductCard({
  product,
  couponDiscountPercent = 0,
  compact = false,
  imagePriority = false,
  detailCtaLabel,
}: {
  product: Product;
  couponDiscountPercent?: number;
  /** Variante más compacta para grillas densas. */
  compact?: boolean;
  imagePriority?: boolean;
  /** Si se define, muestra un CTA bajo el precio hacia el detalle. */
  detailCtaLabel?: string;
}) {
  const {
    primary: cardImg,
    primarySrcSet: cardImgSrcSet,
  } = productCardDisplayImages(product.image_path, product.image_paths);
  const heroImg = productPrimaryPublicImageUrl(
    product.image_path,
    product.image_paths,
  );
  const outOfStock = displayStockQuantity(product) <= 0;
  const eyebrow = showcaseEyebrowLabel(product);
  const href = `/products/${product.id}`;
  const router = useRouter();

  return (
    <article className="flex h-full flex-col">
      <Link
        href={href}
        className="group/image flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2"
        onMouseEnter={() => prefetchProductDetail(router, product.id, heroImg)}
        onFocus={() => prefetchProductDetail(router, product.id, heroImg)}
      >
        <StoreProductCardImage
          src={cardImg}
          srcSet={cardImgSrcSet}
          alt={product.name}
          sizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
          priority={imagePriority}
          outOfStock={outOfStock}
          placeholderClassName={
            compact ? "text-2xl text-stone-200" : "text-3xl text-stone-200"
          }
        />
        <div
          className={`flex flex-1 flex-col text-left ${compact ? "space-y-0.5 pt-2" : "space-y-1.5 pt-4"}`}
        >
          {eyebrow ? (
            <p
              className={
                compact
                  ? "text-[9px] font-medium uppercase tracking-[0.12em] text-stone-400"
                  : "text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400"
              }
            >
              {eyebrow}
            </p>
          ) : null}
          <ProductImportOriginMark origin={productOrigin(product)} />
          <p
            className={
              compact
                ? "text-[11px] font-medium uppercase leading-snug tracking-wide text-stone-900 line-clamp-2"
                : "text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-900 line-clamp-3"
            }
          >
            {product.name}
          </p>
          <div className={compact ? "pt-0" : "space-y-0.5 pt-0.5"}>
            <ListingPrices
              product={product}
              couponDiscountPercent={couponDiscountPercent}
              compact={compact}
            />
          </div>
          {outOfStock ? (
            <p
              className={
                compact
                  ? "text-[9px] font-medium uppercase tracking-[0.1em] text-stone-400"
                  : "pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400"
              }
            >
              Agotado
            </p>
          ) : null}
        </div>
      </Link>
      {detailCtaLabel ? (
        <Link
          href={href}
          className="mt-2.5 block shrink-0 border border-stone-900 bg-white py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
        >
          {detailCtaLabel}
        </Link>
      ) : null}
    </article>
  );
}

function CatalogProductCard({
  product,
  cartQuantity = 0,
  onCartChange,
  couponDiscountPercent = 0,
  imagePriority = false,
}: {
  product: Product;
  cartQuantity?: number;
  onCartChange?: () => void;
  couponDiscountPercent?: number;
  imagePriority?: boolean;
}) {
  const {
    primary: cardImg,
    primarySrcSet: cardImgSrcSet,
  } = productCardDisplayImages(product.image_path, product.image_paths);
  const heroImg = productPrimaryPublicImageUrl(
    product.image_path,
    product.image_paths,
  );
  const outOfStock = displayStockQuantity(product) <= 0;
  const router = useRouter();
  const { openCart } = useStoreCartDrawer();
  const [cartPending, startCartTransition] = useTransition();
  const { has, toggle, ready } = useStoreFavorites();
  const favorite = ready && has(product.id);
  const afterCartMutation = () => {
    router.refresh();
    onCartChange?.();
  };

  const inCart = cartQuantity > 0;
  const cardStock = displayStockQuantity(product);
  const maxQty = Math.max(0, Math.floor(cardStock));
  const pct = Math.max(
    0,
    Math.min(100, Math.floor(Number(couponDiscountPercent) || 0)),
  );
  const hasCouponPrice = pct > 0;

  const needsVariantOnPdp = productRequiresVariantChoice(product);
  const variantCta = variantChoiceCtaLabel(product);
  const eyebrow = showcaseEyebrowLabel(product);

  return (
    <article className="flex h-full flex-col">
      <div className="relative shrink-0">
        <StoreProductCardImage
          src={cardImg}
          srcSet={cardImgSrcSet}
          alt={product.name}
          sizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
          priority={imagePriority}
          outOfStock={outOfStock}
        />
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-[1] block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400/70"
          onMouseEnter={() =>
            prefetchProductDetail(router, product.id, heroImg)
          }
          onFocus={() => prefetchProductDetail(router, product.id, heroImg)}
          aria-label={product.name}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
          }}
          className={
            favorite
              ? "absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center text-rose-500 transition hover:opacity-70"
              : "absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center text-stone-700 transition hover:text-stone-900 hover:opacity-70"
          }
          aria-pressed={favorite}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            className="size-4"
            strokeWidth={STORE_HEADER_ICON_STROKE}
            fill={favorite ? "currentColor" : "none"}
          />
        </button>
        {hasCouponPrice ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 border border-stone-900 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-900">
            −{pct}%
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-1.5 pt-4">
        {eyebrow ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
            {eyebrow}
          </p>
        ) : null}
        <ProductImportOriginMark origin={productOrigin(product)} />
        <Link
          href={`/products/${product.id}`}
          className="text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-900 transition hover:text-stone-600"
        >
          <span className="line-clamp-3">{product.name}</span>
        </Link>
        <div className="space-y-0.5 pt-0.5">
          <ListingPrices
            product={product}
            couponDiscountPercent={couponDiscountPercent}
          />
          {hasCouponPrice ? (
            <p className="text-[9px] font-medium uppercase leading-tight tracking-[0.08em] text-stone-500">
              Con cupón en el pago
            </p>
          ) : null}
        </div>

        {outOfStock ? (
          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
            Agotado
          </p>
        ) : needsVariantOnPdp ? (
          <Link
            href={`/products/${product.id}`}
            className="mt-auto block border border-stone-900 bg-white py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
          >
            {variantCta}
          </Link>
        ) : inCart ? (
          <div
            className={`mt-auto flex w-full items-center gap-0.5 border border-stone-900 bg-white p-0.5 transition ${cartPending ? "store-cart-qty-pending border-stone-700" : ""}`}
            role="group"
            aria-busy={cartPending}
            aria-label="Cantidad en la bolsa"
          >
            <button
              type="button"
              disabled={cartPending}
              onClick={() =>
                startCartTransition(() => {
                  void setLineQuantity(product.id, cartQuantity - 1).then(
                    afterCartMutation,
                  );
                })
              }
              className="flex size-9 shrink-0 items-center justify-center text-stone-900 transition active:scale-90 hover:bg-stone-100 disabled:opacity-40"
              aria-label={
                cartQuantity <= 1 ? "Quitar de la bolsa" : "Restar una unidad"
              }
            >
              <Minus className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
            <span className="relative min-w-0 flex-1 text-center text-xs font-semibold tabular-nums text-stone-900">
              {cartPending ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="store-add-to-bag-spinner size-3" />
                  <span className="sr-only">Actualizando</span>
                  <span aria-hidden>{cartQuantity}</span>
                </span>
              ) : (
                cartQuantity
              )}
            </span>
            <button
              type="button"
              disabled={cartPending || cartQuantity >= maxQty}
              onClick={() =>
                startCartTransition(() => {
                  void setLineQuantity(product.id, cartQuantity + 1).then(
                    afterCartMutation,
                  );
                })
              }
              className="flex size-9 shrink-0 items-center justify-center text-stone-900 transition active:scale-90 hover:bg-stone-100 disabled:opacity-40"
              aria-label="Sumar una unidad"
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        ) : (
          <form
            className="mt-auto pt-4"
            action={async (formData) => {
              await addToCartFromForm(formData);
              afterCartMutation();
              openCart();
            }}
          >
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <StoreAddToBagButton />
          </form>
        )}
      </div>
    </article>
  );
}

export function ProductListingCard({
  product,
  cartQuantity = 0,
  onCartChange,
  couponDiscountPercent = 0,
  presentation = "default",
  compact = false,
  imagePriority = false,
  detailCtaLabel,
}: {
  product: Product;
  cartQuantity?: number;
  onCartChange?: () => void;
  couponDiscountPercent?: number;
  presentation?: "default" | "editorial";
  compact?: boolean;
  imagePriority?: boolean;
  detailCtaLabel?: string;
}) {
  if (presentation === "editorial") {
    return (
      <ShowcaseProductCard
        product={product}
        couponDiscountPercent={couponDiscountPercent}
        compact={compact}
        imagePriority={imagePriority}
        detailCtaLabel={detailCtaLabel}
      />
    );
  }

  return (
    <CatalogProductCard
      product={product}
      cartQuantity={cartQuantity}
      onCartChange={onCartChange}
      couponDiscountPercent={couponDiscountPercent}
      imagePriority={imagePriority}
    />
  );
}
