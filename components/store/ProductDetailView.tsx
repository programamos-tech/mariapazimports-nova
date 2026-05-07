"use client";

import type { SVGProps } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCartFromForm, buyNowFromDetail } from "@/app/actions/cart";
import { formatCop } from "@/lib/money";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

const COLOR_OPTIONS = [
  { id: "pink", className: "bg-rose-300 ring-rose-400" },
  { id: "black", className: "bg-stone-900 ring-stone-600" },
  { id: "green", className: "bg-emerald-600 ring-emerald-700" },
  { id: "silver", className: "bg-stone-300 ring-stone-400" },
  { id: "blue", className: "bg-sky-600 ring-sky-700" },
] as const;

function IconTruck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M14 18V6H4v12h2M14 18h4l3-5V9h-5M14 18h-4M6 18v-3M18 18v-3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function IconBox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" strokeLinejoin="round" />
      <path d="M3.3 8L12 13l8.7-5M12 22V13" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  productId: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  imageUrl: string | null;
};

export function ProductDetailView({
  productId,
  name,
  description,
  priceCents,
  stockQuantity,
  imageUrl,
}: Props) {
  const router = useRouter();
  const [thumbIdx, setThumbIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const reviews = pseudoReviewCount(productId);
  const outOfStock = stockQuantity <= 0;
  const maxQty = stockQuantity;

  const safeQty =
    outOfStock || maxQty < 1
      ? 1
      : Math.min(Math.max(1, qty), maxQty);

  const installment = Math.max(1, Math.ceil(priceCents / 6));
  const blurb =
    description?.trim() ||
    "Producto seleccionado para calidad y diseño. Consultá políticas de cambio antes de comprar.";

  const thumbs = [0, 1, 2, 3] as const;
  const showImage = imageUrl;
  const unopt = shouldUnoptimizeStorageImageUrl(imageUrl);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
      {/* Galería */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f0eeeb] ring-1 ring-stone-200/80">
          {showImage ? (
            <Image
              src={imageUrl!}
              alt={name}
              fill
              className="object-contain p-6 sm:p-10"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              unoptimized={unopt}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl text-stone-300">
              ◆
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {thumbs.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setThumbIdx(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-[#f5f3f0] ring-2 transition ${
                thumbIdx === i
                  ? "ring-[#3d5240]"
                  : "ring-transparent hover:ring-stone-300"
              }`}
            >
              {showImage ? (
                <Image
                  src={imageUrl!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized={unopt}
                />
              ) : (
                <span className="flex h-full items-center justify-center text-stone-400">
                  {i + 1}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Info y compra */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl">
          {name}
        </h1>
        <p className="text-sm leading-relaxed text-stone-500 sm:text-base">{blurb}</p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm tracking-tight text-[#6b7f6a]" aria-hidden>
            ★★★★★
          </span>
          <span className="text-sm text-stone-400">({reviews})</span>
        </div>

        <div>
          <p className="text-2xl font-bold text-stone-900 sm:text-3xl">
            {formatCop(priceCents)}
            <span className="text-lg font-semibold text-stone-600">
              {" "}
              o {formatCop(installment)}/mes
            </span>
          </p>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Pagos sugeridos a 6 meses (referencia visual; financiación real según
            Wompi / tu negocio).
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-800">Elegí un color</p>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorIdx(i)}
                title={c.id}
                className={`size-9 rounded-full ring-2 ring-offset-2 ring-offset-white transition ${c.className} ${
                  colorIdx === i ? "ring-[#c2410c] ring-offset-2" : "ring-transparent"
                }`}
                aria-pressed={colorIdx === i}
              />
            ))}
          </div>
        </div>

        {outOfStock ? (
          <p className="font-medium text-red-600">Sin stock por ahora.</p>
        ) : (
          <form className="space-y-5">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value={safeQty} />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-stone-200 bg-[#f7f6f4] p-1 shadow-sm">
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-white"
                  onClick={() =>
                    setQty((q) =>
                      Math.max(1, Math.min(q, maxQty) - 1),
                    )
                  }
                  aria-label="Menos"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold text-stone-900">
                  {safeQty}
                </span>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-white"
                  onClick={() =>
                    setQty((q) =>
                      Math.min(maxQty, Math.max(1, q) + 1),
                    )
                  }
                  aria-label="Más"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-stone-600">
                ¡Solo quedan{" "}
                <span className="font-semibold text-amber-600">
                  {stockQuantity} {stockQuantity === 1 ? "unidad" : "unidades"}
                </span>
                ! No te lo pierdas.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                formAction={buyNowFromDetail}
                className="flex-1 rounded-full bg-[#3d5240] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#556654]"
              >
                Comprar ahora
              </button>
              <button
                type="submit"
                formAction={async (formData) => {
                  await addToCartFromForm(formData);
                  router.refresh();
                }}
                className="flex-1 rounded-full border-2 border-[#3d5240] bg-white px-6 py-3.5 text-center text-sm font-semibold text-[#3d5240] shadow-sm transition hover:bg-[#f4f7f3]"
              >
                Agregar al carrito
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3 rounded-2xl border border-stone-200 bg-[#faf9f7] p-4 sm:p-5">
          <div className="flex gap-3 border-b border-stone-200/80 pb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <IconTruck className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">Envío gratis</p>
              <p className="mt-0.5 text-sm text-stone-500">
                Ingresá tu código postal para disponibilidad (texto de ejemplo en
                la plantilla).
              </p>
              <button
                type="button"
                className="mt-1 text-sm font-medium text-[#6b7f6a] hover:underline"
              >
                Ver cobertura
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <IconBox className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">Devoluciones</p>
              <p className="mt-0.5 text-sm text-stone-500">
                Cambios según política del vendedor.{" "}
                <button
                  type="button"
                  className="font-medium text-[#6b7f6a] hover:underline"
                >
                  Detalles
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
