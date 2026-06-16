"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import {
  storeBtnPrimaryClass,
  storeEmptyStateClass,
  storeEmptyStateTextClass,
} from "@/components/store/store-ui-primitives";
import { storeBrand } from "@/lib/brand";
import { storeShellClass } from "@/lib/store-layout";
import { storeProductCardImagePriority } from "@/lib/store-product-card-image";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";

const shellClass = `${storeShellClass} py-10 sm:py-12`;

function FavoritosPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 max-w-2xl sm:mb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-xl font-semibold uppercase tracking-[0.08em] text-stone-900 sm:text-2xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{description}</p>
    </header>
  );
}

import type { StorefrontProductVariantMeta } from "@/lib/product-variants";

type Product = {
  id: string;
  name: string;
  brand?: string | null;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  image_paths?: unknown;
  stock_quantity: number;
  size_value?: number | null;
  size_unit?: string | null;
  fragrance_options?: string[] | null;
  variant_axis?: string | null;
  listingPriceCents?: number;
  listingStockQuantity?: number;
  variantMeta?: StorefrontProductVariantMeta;
  coupon_discount_percent?: number;
};

export function FavoritosView() {
  const { ids, ready } = useStoreFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartQtyByProductId, setCartQtyByProductId] = useState<
    Record<string, number>
  >({});

  const reloadCartQuantities = useCallback(() => {
    void fetch("/api/store/cart")
      .then((r) => r.json())
      .then(
        (body: {
          lines?: { productId: string; quantity: number }[];
        }) => {
          const next: Record<string, number> = {};
          for (const l of body.lines ?? []) {
            next[l.productId] = (next[l.productId] ?? 0) + l.quantity;
          }
          setCartQtyByProductId(next);
        },
      )
      .catch(() => setCartQtyByProductId({}));
  }, []);

  useEffect(() => {
    reloadCartQuantities();
  }, [reloadCartQuantities, ready, ids]);

  useEffect(() => {
    if (!ready) return;
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    const q = encodeURIComponent(ids.join(","));
    let cancelled = false;
    setLoading(true);
    fetch(`/api/products/favorites?ids=${q}`)
      .then((r) => r.json())
      .then((body: { products?: Product[] }) => {
        if (!cancelled) setProducts(body.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, ids]);

  if (!ready) {
    return (
      <div className={shellClass}>
        <FavoritosPageHeader
          eyebrow="Todos los productos"
          title="Favoritos"
          description="Estamos cargando tu lista guardada en este dispositivo."
        />
        <div className="rounded-xl border border-stone-200/90 bg-white px-4 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-sm text-stone-500">Cargando favoritos…</p>
        </div>
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className={shellClass}>
        <FavoritosPageHeader
          eyebrow="Todos los productos"
          title="Favoritos"
          description="Guarda piezas mientras navegas todos los productos; quedan en esta lista en tu navegador."
        />
        <div className="mx-auto max-w-lg">
          <div className="flex flex-col items-center rounded-xl border border-stone-200/90 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-14">
            <div
              className="flex size-14 items-center justify-center rounded-full border border-stone-200/90 bg-[var(--store-chrome-bg)]"
              aria-hidden
            >
              <Heart className="size-7 text-stone-800" strokeWidth={1.25} />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-stone-600">
              Todavía no tienes productos guardados. Toca el corazón en las tarjetas de todos los
              productos y los verás aquí.
            </p>
            <Link href="/products" className={`${storeBtnPrimaryClass} mt-8 w-full max-w-xs sm:w-auto`}>
              Ir a todos los productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <FavoritosPageHeader
        eyebrow="Todos los productos"
        title="Favoritos"
        description={`Piezas que marcaste en ${storeBrand}. Puedes quitarlas tocando de nuevo el corazón en la tarjeta.`}
      />

      {loading ? (
        <div className="rounded-xl border border-stone-200/90 bg-white px-4 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-sm text-stone-500">Cargando productos…</p>
        </div>
      ) : products.length === 0 ? (
        <div className={storeEmptyStateClass}>
          <p className={storeEmptyStateTextClass}>
            No encontramos estos productos o ya no están publicados.
          </p>
          <Link href="/products" className={`${storeBtnPrimaryClass} mt-6`}>
            Ver todos los productos
          </Link>
        </div>
      ) : (
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10 xl:grid-cols-4">
          {products.map((p, index) => (
            <li key={p.id} className="h-full">
              <ProductListingCard
                imagePriority={storeProductCardImagePriority(index)}
                cartQuantity={cartQtyByProductId[p.id] ?? 0}
                couponDiscountPercent={p.coupon_discount_percent ?? 0}
                product={p}
                onCartChange={reloadCartQuantities}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
