"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  addToCartFromForm,
  setLineQuantity,
} from "@/app/actions/cart";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";
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

function RatingStars() {
  return (
    <span className="flex items-center gap-0.5 text-stone-300" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="size-3 shrink-0 fill-current"
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

export function ProductListingCard({
  product,
  cartQuantity = 0,
  onCartChange,
}: {
  product: Product;
  /** Unidades en el carrito (tienda efectiva). */
  cartQuantity?: number;
  /** Solo cliente: p. ej. favoritos, para refrescar cantidades sin RSC. */
  onCartChange?: () => void;
}) {
  const router = useRouter();
  const [cartPending, startCartTransition] = useTransition();
  const { has, toggle, ready } = useStoreFavorites();
  const favorite = ready && has(product.id);
  const img = storagePublicObjectUrl(product.image_path);
  const reviews = pseudoReviewCount(product.id);
  const outOfStock = product.stock_quantity <= 0;
  const blurb =
    product.description?.trim() ||
    "Selección curada · calidad para tu día a día.";

  const afterCartMutation = () => {
    router.refresh();
    onCartChange?.();
  };

  const inCart = cartQuantity > 0;
  const maxQty = Math.max(0, Math.floor(product.stock_quantity));

  return (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-stone-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-square w-full shrink-0 bg-[#faf8f5]">
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6b7f6a]/80"
        >
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition duration-300 group-hover/card:scale-[1.02]"
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
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
          }}
          className={
            favorite
              ? "absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-white text-rose-500 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-rose-200/60 transition hover:bg-white hover:text-rose-600"
              : "absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-white text-stone-500 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/90 transition hover:bg-white hover:text-stone-700"
          }
          aria-pressed={favorite}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            className="size-4"
            strokeWidth={2}
            fill={favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-4 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${product.id}`}
            className="min-w-0 flex-1 text-sm font-semibold leading-snug tracking-tight text-stone-900 transition group-hover/card:text-[#556654] sm:text-[15px]"
          >
            <span className="line-clamp-2">{product.name}</span>
          </Link>
          <span className="shrink-0 pt-0.5 text-sm font-medium tabular-nums text-[#4a5c49] sm:text-[15px]">
            {formatCop(product.price_cents)}
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-stone-500 sm:text-[13px]">
          {blurb}
        </p>

        <p className="flex items-center gap-2">
          <RatingStars />
          <span className="text-[11px] tabular-nums text-stone-400 sm:text-xs">
            ({reviews})
          </span>
        </p>

        {outOfStock ? (
          <p className="mt-2 text-center text-xs font-medium text-red-600/90">
            Sin stock
          </p>
        ) : inCart ? (
          <div
            className="mt-auto flex w-full items-center gap-0.5 rounded-full border-2 border-[#6b7f6a] bg-white p-0.5 shadow-sm"
            role="group"
            aria-label="Cantidad en el carrito"
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
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#556654] transition hover:bg-[#fffbf6] disabled:opacity-40"
              aria-label={
                cartQuantity <= 1
                  ? "Quitar del carrito"
                  : "Restar una unidad"
              }
            >
              <Minus className="size-4" strokeWidth={2} aria-hidden />
            </button>
            <span className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums text-[#3d5240]">
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
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#556654] transition hover:bg-[#fffbf6] disabled:opacity-40"
              aria-label="Sumar una unidad"
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : (
          <form
            className="mt-auto pt-2"
            action={async (formData) => {
              await addToCartFromForm(formData);
              afterCartMutation();
            }}
          >
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button
              type="submit"
              className="w-full rounded-full border-2 border-[#6b7f6a] bg-white py-2.5 text-sm font-semibold text-[#556654] shadow-sm transition hover:bg-[#fffbf6] hover:border-[#5a6e59]"
            >
              Agregar al carrito
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
