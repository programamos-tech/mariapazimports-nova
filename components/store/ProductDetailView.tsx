"use client";

import Image from "next/image";
import { Heart, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { addToCartFromForm, buyNowFromDetail } from "@/app/actions/cart";
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";
import { formatCop } from "@/lib/money";
import {
  storefrontPriceAfterCouponCents,
} from "@/lib/store-coupons";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";
import { productColorSwatchClass } from "@/lib/product-colors";

type Props = {
  productId: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  imageUrl: string | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  hasExpiration: boolean | null;
  expirationDate: string | null;
  colors: string[];
  hasVat: boolean | null;
  vatPercent: number | null;
  couponDiscountPercent?: number;
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
  imageUrl,
  sizeValue,
  sizeUnit,
  hasExpiration,
  expirationDate,
  colors,
  hasVat,
  vatPercent,
  couponDiscountPercent = 0,
}: Props) {
  const router = useRouter();
  const { openCart } = useStoreCartDrawer();
  const { has, toggle, ready } = useStoreFavorites();
  const favorite = ready && has(productId);
  const [colorIdx, setColorIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);

  const reviews = pseudoReviewCount(productId);
  const outOfStock = stockQuantity <= 0;
  const maxQty = Math.max(0, Math.floor(stockQuantity));
  const safeQty =
    outOfStock || maxQty < 1 ? 1 : Math.min(Math.max(1, qty), maxQty);

  const pct = Math.max(
    0,
    Math.min(100, Math.floor(Number(couponDiscountPercent) || 0)),
  );
  const hasCouponPrice = pct > 0;
  const displayPriceCents = hasCouponPrice
    ? storefrontPriceAfterCouponCents(priceCents, pct)
    : priceCents;

  const sizeLabel =
    sizeValue && sizeValue > 0
      ? `${String(sizeValue).replace(/\.0+$/, "")} ${sizeUnit ?? "unidad"}`
      : null;

  const colorOptions = colors.filter((c) => c.trim().length > 0);
  const selectedColorLabel =
    colorOptions.length > 0 ? colorOptions[colorIdx] ?? colorOptions[0] : null;

  const descriptionText = description?.trim() ?? "";
  const descPreviewLimit = 280;
  const showDescToggle = descriptionText.length > descPreviewLimit;
  const descriptionDisplayed =
    descriptionText &&
    showDescToggle &&
    !descExpanded
      ? `${descriptionText.slice(0, descPreviewLimit).trim()}…`
      : descriptionText;

  const unopt = shouldUnoptimizeStorageImageUrl(imageUrl);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
      {/* Imagen */}
      <div className="relative aspect-square w-full bg-[#f5f5f4]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-8 sm:p-12"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized={unopt}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl text-stone-300">
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
                  {formatCop(priceCents)}
                </span>
                <span>{formatCop(displayPriceCents)}</span>
              </>
            ) : (
              formatCop(priceCents)
            )}
          </p>
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

        {outOfStock ? (
          <p className="mt-10 text-sm font-medium uppercase tracking-wide text-stone-500">
            Agotado
          </p>
        ) : (
          <form className="mt-10 space-y-4">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value={String(safeQty)} />

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
        )}

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
              {sizeLabel ? (
                <li>
                  <span className="text-stone-800">Contenido / tamaño:</span>{" "}
                  {sizeLabel}
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
                  {String(vatPercent ?? 0).replace(/\.0+$/, "")}%
                </li>
              ) : null}
              {!sizeLabel && !hasExpiration && !hasVat ? (
                <li>Información adicional disponible al confirmar tu compra.</li>
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
