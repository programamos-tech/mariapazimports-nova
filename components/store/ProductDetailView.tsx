"use client";

import Image from "next/image";
import { Heart, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addToCartFromForm, buyNowFromDetail } from "@/app/actions/cart";
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";
import { formatCop } from "@/lib/money";
import {
  unitPriceGrossCents,
  unitPriceNetCents,
} from "@/lib/product-vat-price";
import {
  storefrontPriceAfterCouponCents,
} from "@/lib/store-coupons";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import {
  productDisplayImageUrl,
  shouldUseUnoptimizedImage,
} from "@/lib/storage-image-url";
import { productColorSwatchClass } from "@/lib/product-colors";
import { ProductVariantPicker } from "@/components/store/ProductVariantPicker";
import { ProductDetailHeroImage } from "@/components/store/ProductDetailHeroImage";
import type { ProductVariantAxis } from "@/lib/product-variants";
import {
  getVariantPickerTitle,
  hasStorefrontVariants,
} from "@/lib/product-variants";

export type ProductDetailVariant = {
  id: string;
  label: string;
  priceCents: number;
  stockQuantity: number;
  imageUrls: string[];
};

type Props = {
  productId: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  variantAxis: ProductVariantAxis;
  variants: ProductDetailVariant[];
  /** Galería del catálogo (primera = portada en listados). */
  imageUrls: string[];
  /** Presentaciones informativas (texto en detalles). */
  sizeLabels: string[];
  hasExpiration: boolean | null;
  expirationDate: string | null;
  colors: string[];
  hasVat: boolean | null;
  vatPercent: number | null;
  couponDiscountPercent?: number;
  children?: ReactNode;
};

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-stone-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:opacity-90"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          {title}
        </span>
        <span className="text-lg font-light leading-none text-stone-400 tabular-nums">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="pb-5 text-sm leading-relaxed text-stone-600">{children}</div>
      ) : null}
    </div>
  );
}

export function ProductDetailView({
  productId,
  name,
  description,
  priceCents,
  stockQuantity,
  variantAxis,
  variants,
  imageUrls,
  sizeLabels,
  hasExpiration,
  expirationDate,
  colors,
  hasVat,
  vatPercent,
  couponDiscountPercent = 0,
  children: ssrHero,
}: Props) {
  const router = useRouter();
  const { openCart } = useStoreCartDrawer();
  const { has, toggle, ready } = useStoreFavorites();
  const favorite = ready && has(productId);
  const [colorIdx, setColorIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);

  const selectedVariant = variants[variantIdx] ?? variants[0] ?? null;
  const effectivePriceCents = selectedVariant?.priceCents ?? priceCents;
  const effectiveStock = selectedVariant?.stockQuantity ?? stockQuantity;

  const reviews = pseudoReviewCount(productId);
  const outOfStock = effectiveStock <= 0;
  const maxQty = Math.max(0, Math.floor(effectiveStock));
  const safeQty =
    outOfStock || maxQty < 1 ? 1 : Math.min(Math.max(1, qty), maxQty);

  const pct = Math.max(
    0,
    Math.min(100, Math.floor(Number(couponDiscountPercent) || 0)),
  );
  const hasCouponPrice = pct > 0;
  const displayPriceCents = hasCouponPrice
    ? storefrontPriceAfterCouponCents(effectivePriceCents, pct)
    : effectivePriceCents;

  const sizeLabel =
    sizeLabels.length > 0 ? sizeLabels.join(" · ") : null;

  const netCents = unitPriceNetCents(effectivePriceCents);
  const grossCents = unitPriceGrossCents(effectivePriceCents, hasVat, vatPercent);
  const vatPctLabel = String(vatPercent ?? 0).replace(/\.0+$/, "");

  const colorOptions = colors.filter((c) => c.trim().length > 0);
  const variantLabels = variants.map((v) => v.label).filter(Boolean);
  const selectedColorLabel =
    colorOptions.length > 0 ? colorOptions[colorIdx] ?? colorOptions[0] : null;

  const showVariantPicker = hasStorefrontVariants(variantAxis, variants);
  const variantPickerTitle = getVariantPickerTitle(variantAxis);

  const activeGalleryUrls = useMemo(() => {
    if (selectedVariant?.imageUrls.length) return selectedVariant.imageUrls;
    return imageUrls;
  }, [selectedVariant, imageUrls]);

  const heroImageUrl = activeGalleryUrls[galleryIdx] ?? activeGalleryUrls[0] ?? null;
  const heroDisplayUrl = productDisplayImageUrl(heroImageUrl, "hero");
  const useClientHero = variantIdx !== 0 || galleryIdx !== 0;
  const showSsrHero = Boolean(ssrHero) && !useClientHero;

  useEffect(() => {
    const nextUrl = activeGalleryUrls[galleryIdx + 1];
    if (!nextUrl) return;
    const optimized = productDisplayImageUrl(nextUrl, "hero");
    if (!optimized) return;
    const img = new window.Image();
    img.src = optimized;
  }, [activeGalleryUrls, galleryIdx]);

  const onVariantChange = (idx: number) => {
    setVariantIdx(idx);
    setGalleryIdx(0);
    setQty(1);
  };

  const selectedVariantLabel = selectedVariant?.label ?? null;
  const selectedVariantId = selectedVariant?.id ?? "";

  const descriptionText = description?.trim() ?? "";
  const descPreviewLimit = 280;
  const showDescToggle = descriptionText.length > descPreviewLimit;
  const descriptionDisplayed =
    descriptionText &&
    showDescToggle &&
    !descExpanded
      ? `${descriptionText.slice(0, descPreviewLimit).trim()}…`
      : descriptionText;

  const galleryCount = activeGalleryUrls.length;
  const canGalleryNav = galleryCount > 1;

  const stepGallery = useCallback(
    (delta: -1 | 1) => {
      setGalleryIdx((i) => {
        const next = i + delta;
        if (next < 0) return galleryCount - 1;
        if (next >= galleryCount) return 0;
        return next;
      });
    },
    [galleryCount],
  );

  useEffect(() => {
    if (!canGalleryNav) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepGallery(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepGallery(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canGalleryNav, stepGallery]);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
      {/* Imagen */}
      <div className="space-y-3">
        <div className="relative w-full overflow-hidden bg-white">
          {showSsrHero ? (
            ssrHero
          ) : heroDisplayUrl ? (
            <ProductDetailHeroImage
              src={heroDisplayUrl}
              alt={
                selectedVariantLabel
                  ? `${name} — ${selectedVariantLabel}`
                  : name
              }
              priority={variantIdx === 0 && galleryIdx === 0}
              fetchPriority={
                variantIdx === 0 && galleryIdx === 0 ? "high" : "auto"
              }
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#f5f5f4] text-6xl text-stone-300">
              ◆
            </div>
          )}
          <button
          type="button"
          onClick={() => toggle(productId)}
          className={
            favorite
              ? "absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm ring-1 ring-stone-200/80 transition hover:bg-white"
              : "absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm ring-1 ring-stone-200/80 transition hover:bg-white hover:text-stone-900"
          }
          aria-pressed={favorite}
          aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart
            className="size-[18px]"
            strokeWidth={1.35}
            fill={favorite ? "currentColor" : "none"}
          />
        </button>
          {canGalleryNav ? (
            <>
              <button
                type="button"
                onClick={() => stepGallery(-1)}
                className="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-stone-700 shadow-md ring-1 ring-stone-200/80 transition hover:bg-white sm:left-4"
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => stepGallery(1)}
                className="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-stone-700 shadow-md ring-1 ring-stone-200/80 transition hover:bg-white sm:right-4"
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            </>
          ) : null}
        </div>

        {activeGalleryUrls.length > 1 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3.75rem,1fr))] gap-2 sm:gap-2.5">
            {activeGalleryUrls.map((url, i) => {
              const thumbUrl = productDisplayImageUrl(url, "thumb") ?? url;
              return (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setGalleryIdx(i)}
                onMouseEnter={() => {
                  const next = productDisplayImageUrl(url, "hero");
                  if (next) {
                    const img = new window.Image();
                    img.src = next;
                  }
                }}
                className={
                  galleryIdx === i
                    ? "relative aspect-square w-full overflow-hidden bg-white ring-2 ring-stone-900 ring-offset-2"
                    : "relative aspect-square w-full overflow-hidden bg-white ring-1 ring-stone-200 transition hover:ring-stone-400"
                }
                aria-label={`Ver imagen ${i + 1} de ${selectedVariantLabel ?? name}`}
                aria-current={galleryIdx === i ? "true" : undefined}
              >
                <Image
                  src={thumbUrl}
                  alt=""
                  fill
                  loading="lazy"
                  className="object-contain object-center"
                  sizes="80px"
                  unoptimized={shouldUseUnoptimizedImage(thumbUrl)}
                />
              </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Datos */}
      <div className="flex min-w-0 flex-col lg:max-w-xl lg:pt-2">
        <h1 className="text-xl font-semibold uppercase leading-snug tracking-[0.06em] text-stone-900 sm:text-2xl">
          {name}
        </h1>

        <div className="mt-4">
          {hasCouponPrice ? (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              −{pct}% con cupón al pagar
            </p>
          ) : null}
          <p className="text-lg font-normal tabular-nums text-stone-900 sm:text-xl">
            {hasCouponPrice ? (
              <>
                <span className="mr-2 text-base text-stone-400 line-through decoration-stone-300">
                  {formatCop(effectivePriceCents)}
                </span>
                <span>{formatCop(displayPriceCents)}</span>
              </>
            ) : (
              formatCop(effectivePriceCents)
            )}
          </p>
          {hasVat ? (
            <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
              <span className="text-stone-500">Sin IVA:</span>{" "}
              {formatCop(netCents)}
              <span className="mx-2 text-stone-300" aria-hidden>
                ·
              </span>
              <span className="text-stone-500">Con IVA ({vatPctLabel}%):</span>{" "}
              {formatCop(grossCents)}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="flex text-stone-900" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className="size-[15px] fill-current"
                strokeWidth={0}
              />
            ))}
          </span>
          <span className="text-sm tabular-nums text-stone-500">({reviews})</span>
        </div>

        {showVariantPicker ? (
          <ProductVariantPicker
            title={variantPickerTitle}
            labels={variantLabels}
            selectedIndex={variantIdx}
            onSelect={onVariantChange}
          />
        ) : null}

        {outOfStock ? (
          <p className="mt-6 border-t border-stone-200/80 pt-6 text-sm font-medium uppercase tracking-wide text-stone-500">
            Agotado
          </p>
        ) : null}

        {colorOptions.length > 0 ? (
          <div className="mt-8">
            <div className="flex flex-wrap gap-2.5">
              {colorOptions.map((color, i) => (
                <button
                  key={`${color}-${i}`}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={`flex size-10 items-center justify-center rounded-full border-2 transition ${
                    colorIdx === i
                      ? "border-stone-900 ring-2 ring-stone-900 ring-offset-2"
                      : "border-stone-200 hover:border-stone-400"
                  }`}
                  aria-pressed={colorIdx === i}
                  aria-label={`Color ${color}`}
                >
                  <span
                    className={`size-6 rounded-full ${productColorSwatchClass(color)}`}
                  />
                </button>
              ))}
            </div>
            {selectedColorLabel ? (
              <p className="mt-3 text-[13px] text-stone-600">
                <span className="text-stone-500">Color:</span>{" "}
                {selectedColorLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {!outOfStock ? (
          <form className="mt-10 space-y-4">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value={String(safeQty)} />
            <input
              type="hidden"
              name="variantId"
              value={selectedVariantId}
            />

            <div className="flex max-w-xs items-center justify-between gap-4 border-b border-stone-200 pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                Cantidad
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-lg text-stone-500 transition hover:text-stone-900"
                  onClick={() =>
                    setQty((q) => Math.max(1, Math.min(q, maxQty) - 1))
                  }
                  aria-label="Menos"
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums text-stone-900">
                  {safeQty}
                </span>
                <button
                  type="button"
                  className="text-lg text-stone-500 transition hover:text-stone-900"
                  onClick={() =>
                    setQty((q) => Math.min(maxQty, Math.max(1, q) + 1))
                  }
                  aria-label="Más"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="submit"
              formAction={async (formData) => {
                await addToCartFromForm(formData);
                router.refresh();
                openCart();
              }}
              className="w-full bg-stone-900 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800"
            >
              Añadir a la bolsa
            </button>

            <button
              type="submit"
              formAction={buyNowFromDetail}
              className="w-full bg-transparent py-2 text-center text-sm text-stone-600 underline decoration-stone-300 underline-offset-[6px] transition hover:text-stone-900"
            >
              Comprar ahora
            </button>
          </form>
        ) : null}

        <div className="mt-12">
          <AccordionSection title="Descripción" defaultOpen>
            {descriptionText ? (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap">{descriptionDisplayed}</p>
                {showDescToggle ? (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="text-sm font-medium text-stone-900 underline decoration-stone-400 underline-offset-4"
                  >
                    {descExpanded ? "Ver menos" : "Leer más"}
                  </button>
                ) : null}
              </div>
            ) : (
              <p>
                Aún no hay descripción. Puedes sumar detalles desde el panel de
                administración.
              </p>
            )}
          </AccordionSection>

          <AccordionSection title="Detalles">
            <ul className="list-inside list-disc space-y-2 text-stone-600">
              {outOfStock ? (
                <li>
                  <span className="text-stone-800">Estado:</span> Agotado
                </li>
              ) : null}
              {sizeLabel ? (
                <li>
                  <span className="text-stone-800">Contenido / tamaño:</span>{" "}
                  {sizeLabel}
                </li>
              ) : null}
              {colorOptions.length > 0 ? (
                <li>
                  <span className="text-stone-800">Colores:</span>{" "}
                  {colorOptions.join(", ")}
                </li>
              ) : null}
              {hasExpiration ? (
                <li>
                  <span className="text-stone-800">Vencimiento:</span>{" "}
                  {expirationDate ?? "—"}
                </li>
              ) : null}
              {hasVat ? (
                <li>
                  <span className="text-stone-800">IVA:</span>{" "}
                  {vatPctLabel}% (precio de lista sin IVA; el total con IVA está arriba)
                </li>
              ) : null}
              {variantLabels.length > 0 ? (
                <li>
                  <span className="text-stone-800">{variantPickerTitle}s:</span>{" "}
                  {variantLabels.join(", ")}
                </li>
              ) : null}
            </ul>
          </AccordionSection>

          <AccordionSection title="Envíos y devoluciones">
            <p>
              Envíos a todo el país según disponibilidad. Cambios y devoluciones
              según políticas del comercio; consultá por WhatsApp antes de
              comprar si tienes dudas sobre talla o compatibilidad.
            </p>
          </AccordionSection>
        </div>

        <p className="mt-10 text-[13px] text-stone-500">
          <Link href="/products" className="text-stone-800 underline decoration-stone-300 underline-offset-4 hover:text-stone-950">
            Ver más
          </Link>
          <span className="mx-2 text-stone-300" aria-hidden>
            |
          </span>
          <Link href="/products" className="text-stone-800 underline decoration-stone-300 underline-offset-4 hover:text-stone-950">
            Productos
          </Link>
        </p>
      </div>
    </div>
  );
}
