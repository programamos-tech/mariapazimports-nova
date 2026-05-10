"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProductListingCard } from "@/components/store/ProductListingCard";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";
import { storeBrand } from "@/lib/brand";

type Product = {
  id: string;
  name: string;
  brand?: string | null;
  description: string | null;
  price_cents: number;
  image_path: string | null;
  stock_quantity: number;
  size_value?: number | null;
  size_unit?: string | null;
  fragrance_options?: string[] | null;
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <p className="text-sm text-stone-500">Cargando favoritos…</p>
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Favoritos
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
          Todavía no guardaste productos. Toca el corazón en las tarjetas del
          catálogo y los vas a ver aquí.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex rounded-xl bg-[#6b7f6a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a6d59]"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Favoritos
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
        Productos que marcaste en {storeBrand}. Puedes quitarlos tocando de nuevo
        el corazón.
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-stone-500">Cargando productos…</p>
      ) : products.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-stone-200/90 bg-[#faf8f5]/60 p-8 text-center text-sm text-stone-600">
          No encontramos estos productos o ya no están publicados.{" "}
          <Link
            href="/products"
            className="font-semibold text-[#556654] underline decoration-[#6b7f6a]/35 underline-offset-2 hover:text-[#4a5c49]"
          >
            Ver catálogo
          </Link>
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10 xl:grid-cols-4">
          {products.map((p, index) => (
            <li key={p.id}>
              <RevealOnScroll
                className="h-full"
                delayMs={Math.min(index * 65, 400)}
              >
                <ProductListingCard
                  accentImageBg={index % 4 === 3}
                  cartQuantity={cartQtyByProductId[p.id] ?? 0}
                  couponDiscountPercent={p.coupon_discount_percent ?? 0}
                  product={p}
                  onCartChange={reloadCartQuantities}
                />
              </RevealOnScroll>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
