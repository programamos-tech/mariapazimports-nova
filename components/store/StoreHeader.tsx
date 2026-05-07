import type { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontCartItemCount } from "@/lib/storefront-cart";
import { storeBrand } from "@/lib/brand";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { StoreFavoritesNavLink } from "@/components/store/StoreFavoritesNavLink";
import { StoreNavDropdowns } from "@/components/store/StoreNavDropdowns";
import { StoreSearch } from "@/components/store/StoreSearch";
import { fetchStoreCategoriesWithCounts } from "@/lib/fetch-store-categories";

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export async function StoreHeader() {
  const supabase = await createSupabaseServerClient();
  const menuCategories = await fetchStoreCategoriesWithCounts(supabase);
  const cartItemCount = await getStorefrontCartItemCount();

  return (
    <header className="border-b border-stone-200/80">
      <StoreAnnouncementBar />

      {/* Fila principal del navbar: mismo fondo que el footer y la pantalla de carga */}
      <div className="bg-[var(--store-chrome-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex min-w-0 flex-wrap items-center gap-4 lg:shrink-0 lg:gap-8">
              <Link
                href="/"
                className="group shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#6b7f6a] focus-visible:ring-offset-2"
              >
                <Image
                  src="/logobackoficce.png"
                  alt={storeBrand}
                  width={400}
                  height={171}
                  className="h-12 w-auto max-w-[220px] object-contain object-left transition-opacity group-hover:opacity-90 sm:h-14 sm:max-w-[280px] lg:h-16 lg:max-w-[340px]"
                  priority
                />
              </Link>
              <StoreNavDropdowns menuCategories={menuCategories} />
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <StoreSearch />
              <div className="flex shrink-0 flex-wrap items-center gap-0.5 sm:gap-1">
                <Link
                  href="/admin"
                  aria-label="Cuenta"
                  className="flex size-10 items-center justify-center rounded-lg text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900"
                >
                  <IconUser className="size-5" />
                </Link>
                <StoreFavoritesNavLink />
                <Link
                  href="/checkout"
                  aria-label={
                    cartItemCount > 0
                      ? `Carrito, ${cartItemCount} productos. Ir a finalizar compra`
                      : "Carrito. Ir a finalizar compra"
                  }
                  className="relative flex size-10 items-center justify-center rounded-lg text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900"
                >
                  <IconCart className="size-5" />
                  {cartItemCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3d5240] px-1 text-[10px] font-bold leading-none text-white">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
