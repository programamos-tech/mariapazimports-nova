"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCartFromForm } from "@/app/actions/cart";
import { formatCop } from "@/lib/money";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  stock_quantity: number;
};

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      className="size-4"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function ProductListingCard({ product }: { product: Product }) {
  const [favorite, setFavorite] = useState(false);
  const img = storagePublicObjectUrl(product.image_path);
  const reviews = pseudoReviewCount(product.id);
  const outOfStock = product.stock_quantity <= 0;
  const blurb =
    product.description?.trim() ||
    "Selección curada · calidad para tu día a día.";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/55">
      <div className="relative aspect-square w-full shrink-0 bg-stone-100">
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6b7f6a]"
        >
          {img ? (
            <Image
              src={img}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={shouldUnoptimizeStorageImageUrl(img)}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-4xl text-stone-300">
              ◆
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setFavorite((v) => !v)}
          className={`absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-stone-200/80 backdrop-blur-sm transition hover:bg-white ${favorite ? "text-rose-500" : "text-stone-400"}`}
          aria-pressed={favorite}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <IconHeart filled={favorite} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-2 text-sm font-bold leading-snug text-stone-900 hover:text-[#556654] sm:text-base"
          >
            {product.name}
          </Link>
          <span className="shrink-0 text-sm font-bold text-stone-900 sm:text-base">
            {formatCop(product.price_cents)}
          </span>
        </div>

        <p className="line-clamp-1 text-xs text-stone-500">{blurb}</p>

        <p className="mt-1 flex items-center gap-1.5">
          <span className="text-[11px] leading-none tracking-tight text-[#6b7f6a]" aria-hidden>
            ★★★★★
          </span>
          <span className="text-[11px] text-stone-400">({reviews})</span>
        </p>

        {outOfStock ? (
          <p className="mt-4 text-center text-xs font-medium text-red-600">
            Sin stock
          </p>
        ) : (
          <form action={addToCartFromForm} className="mt-auto pt-4">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button
              type="submit"
              className="w-full rounded-full border-2 border-stone-900 bg-white py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-stone-50"
            >
              Agregar al carrito
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
