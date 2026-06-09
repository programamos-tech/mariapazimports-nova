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
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";
import { StoreProductCardImage } from "@/components/store/StoreProductCardImage";
import { storeBrand } from "@/lib/brand";
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

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  image_paths?: unknown;
  stock_quantity: number;
  brand?: string | null;
  size_options?: unknown;
  size_value?: number | null;
  size_unit?: string | null;
  fragrance_options?: string[] | null;
  variant_axis?: string | null;
  listingPriceCents?: number;
  listingStockQuantity?: number;
  variantMeta?: StorefrontProductVariantMeta;
};

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

function productShowsFromPrice(product: Product): boolean {
  return productRequiresVariantChoice(product);
}

function showcaseBrandLabel(product: Product): string {
  const b = product.brand?.trim();
  if (b) return b.toUpperCase();
  const beforeSep = product.name.split(/[•·|–—]/)[0]?.trim();
  if (beforeSep && beforeSep.length <= 32) return beforeSep.toUpperCase();
  return storeBrand.split(/\s+/)[0]?.toUpperCase() ?? "MARCA";
}

/** Tarjeta solo lectura: imagen + marca + nombre + precio (sin bordes ni CTAs en superficie). */
function ShowcaseProductCard({
  product,
  couponDiscountPercent = 0,
  compact = false,
  imagePriority = false,
}: {
  product: Product;
  couponDiscountPercent?: number;
  /** Variante más compacta para grillas densas. */
  compact?: boolean;
  imagePriority?: boolean;
}) {
  const {
    primary: cardImg,
    primarySrcSet: cardImgSrcSet,
    hover: cardHoverImg,
    hoverSrcSet: cardHoverImgSrcSet,
  } = productCardDisplayImages(product.image_path, product.image_paths);
  const heroImg = productPrimaryPublicImageUrl(
    product.image_path,
    product.image_paths,
  );
  const outOfStock = displayStockQuantity(product) <= 0;
  const cardPrice = displayPriceCents(product);
  const pct = Math.max(
    0,
    Math.min(100, Math.floor(Number(couponDiscountPercent) || 0)),
  );
  const hasCouponPrice = pct > 0;
  const priceAfterCoupon = hasCouponPrice
    ? storefrontPriceAfterCouponCents(cardPrice, pct)
    : cardPrice;
  const fromPrice = productShowsFromPrice(product);

  return (
    <article className="h-full">
      <Link
        href={`/products/${product.id}`}
        className="group/image block outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2"
        onMouseEnter={() => prefetchProductHeroImage(heroImg)}
        onFocus={() => prefetchProductHeroImage(heroImg)}
      >
        <StoreProductCardImage
          src={cardImg}
          srcSet={cardImgSrcSet}
          hoverSrc={cardHoverImg}
          hoverSrcSet={cardHoverImgSrcSet}
          alt={product.name}
          sizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
          priority={imagePriority}
          outOfStock={outOfStock}
          placeholderClassName={
            compact ? "text-2xl text-stone-200" : "text-3xl text-stone-200"
          }
        />
        <div className={`text-left ${compact ? "space-y-0.5 pt-2" : "space-y-1.5 pt-4"}`}>
          <p
            className={
              compact
                ? "text-[9px] font-medium uppercase tracking-[0.12em] text-stone-400"
                : "text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400"
            }
          >
            {showcaseBrandLabel(product)}
          </p>
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
            {hasCouponPrice ? (
              <>
                <p
                  className={
                    compact
                      ? "text-[10px] tabular-nums text-stone-400 line-through decoration-stone-300"
                      : "text-[11px] tabular-nums text-stone-400 line-through decoration-stone-300"
                  }
                >
                  {fromPrice ? "Desde " : ""}
                  {formatCop(cardPrice)}
                </p>
                <p
                  className={
                    compact
                      ? "text-[11px] font-medium tabular-nums text-stone-900"
                      : "text-[13px] font-medium tabular-nums text-stone-900"
                  }
                >
                  {fromPrice ? "Desde " : ""}
                  {formatCop(priceAfterCoupon)}
                </p>
              </>
            ) : (
              <p
                className={
                  compact
                    ? "text-[11px] font-medium tabular-nums text-stone-900"
                    : "text-[13px] font-medium tabular-nums text-stone-900"
                }
              >
                {fromPrice ? "Desde " : ""}
                {formatCop(cardPrice)}
              </p>
            )}
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
    hover: cardHoverImg,
    hoverSrcSet: cardHoverImgSrcSet,
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
  const cardPrice = displayPriceCents(product);
  const cardStock = displayStockQuantity(product);
  const maxQty = Math.max(0, Math.floor(cardStock));
  const pct = Math.max(
    0,
    Math.min(100, Math.floor(Number(couponDiscountPercent) || 0)),
  );
  const hasCouponPrice = pct > 0;
  const priceAfterCoupon = hasCouponPrice
    ? storefrontPriceAfterCouponCents(cardPrice, pct)
    : cardPrice;
  const fromPrice = productShowsFromPrice(product);

  const needsVariantOnPdp = productRequiresVariantChoice(product);
  const variantCta = variantChoiceCtaLabel(product);

  return (
    <article className="flex h-full flex-col">
      <div className="relative shrink-0">
        <StoreProductCardImage
          src={cardImg}
          srcSet={cardImgSrcSet}
          hoverSrc={cardHoverImg}
          hoverSrcSet={cardHoverImgSrcSet}
          alt={product.name}
          sizes={STORE_PRODUCT_CARD_IMAGE_SIZES}
          priority={imagePriority}
          outOfStock={outOfStock}
        />
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-[1] block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400/70"
          onMouseEnter={() => prefetchProductHeroImage(heroImg)}
          onFocus={() => prefetchProductHeroImage(heroImg)}
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
              ? "absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-none ring-1 ring-stone-200/80 transition hover:bg-white"
              : "absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/95 text-stone-600 shadow-none ring-1 ring-stone-200/80 transition hover:bg-white hover:text-stone-900"
          }
          aria-pressed={favorite}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            className="size-3.5"
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
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
          {showcaseBrandLabel(product)}
        </p>
        <Link
          href={`/products/${product.id}`}
          className="text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-900 transition hover:text-stone-600"
        >
          <span className="line-clamp-3">{product.name}</span>
        </Link>
        <div className="space-y-0.5 pt-0.5">
          {hasCouponPrice ? (
            <>
              <p className="text-[11px] tabular-nums text-stone-400 line-through decoration-stone-300">
                {fromPrice ? "Desde " : ""}
                {formatCop(cardPrice)}
              </p>
              <p className="text-[13px] font-medium tabular-nums text-stone-900">
                {fromPrice ? "Desde " : ""}
                {formatCop(priceAfterCoupon)}
              </p>
              <p className="text-[9px] font-medium uppercase leading-tight tracking-[0.08em] text-stone-500">
                Con cupón en el pago
              </p>
            </>
          ) : (
            <p className="text-[13px] font-medium tabular-nums text-stone-900">
              {fromPrice ? "Desde " : ""}
              {formatCop(cardPrice)}
            </p>
          )}
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
            className="mt-auto flex w-full items-center gap-0.5 border border-stone-900 bg-white p-0.5"
            role="group"
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
              className="flex size-9 shrink-0 items-center justify-center text-stone-900 transition hover:bg-stone-100 disabled:opacity-40"
              aria-label={
                cartQuantity <= 1 ? "Quitar de la bolsa" : "Restar una unidad"
              }
            >
              <Minus className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
            <span className="min-w-0 flex-1 text-center text-xs font-semibold tabular-nums text-stone-900">
              {cartQuantity}
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
              className="flex size-9 shrink-0 items-center justify-center text-stone-900 transition hover:bg-stone-100 disabled:opacity-40"
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
            <button
              type="submit"
              className="w-full border border-stone-900 bg-white py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              Añadir a la bolsa
            </button>
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
}: {
  product: Product;
  cartQuantity?: number;
  onCartChange?: () => void;
  couponDiscountPercent?: number;
  presentation?: "default" | "editorial";
  compact?: boolean;
  imagePriority?: boolean;
}) {
  if (presentation === "editorial") {
    return (
      <ShowcaseProductCard
        product={product}
        couponDiscountPercent={couponDiscountPercent}
        compact={compact}
        imagePriority={imagePriority}
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
