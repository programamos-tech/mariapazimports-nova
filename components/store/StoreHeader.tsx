import Link from "next/link";
import { Search } from "lucide-react";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_STROKE,
} from "@/lib/store-header-icons";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontCartItemCount } from "@/lib/storefront-cart";
import { StoreLogo } from "@/components/store/StoreLogo";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { StoreHeaderActions } from "@/components/store/StoreHeaderActions";
import { StoreNavDropdowns } from "@/components/store/StoreNavDropdowns";
import { StoreSearch } from "@/components/store/StoreSearch";
import { fetchStoreCategoriesWithCounts } from "@/lib/fetch-store-categories";

function accountFirstNameFromUser(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : null;
  const part = full?.trim().split(/\s+/).filter(Boolean)[0];
  if (part) return part.length > 18 ? `${part.slice(0, 18)}…` : part;
  const local = user.email?.split("@")[0];
  if (local) return local.length > 18 ? `${local.slice(0, 18)}…` : local;
  return null;
}

export async function StoreHeader() {
  const supabase = await createSupabaseServerClient();
  const menuCategories = await fetchStoreCategoriesWithCounts(supabase);
  const cartItemCount = await getStorefrontCartItemCount();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userIconHref = user ? "/cuenta" : "/cuenta/entrar";
  const userIconLabel = user ? "Mi cuenta" : "Iniciar sesión";
  const accountFirstName = accountFirstNameFromUser(user);

  return (
    <header className="min-w-0 overflow-x-clip border-b border-stone-200/90 bg-white">
      <StoreAnnouncementBar />

      {/*
        Móvil/tablet: auto | 1fr | auto — el logo solo ocupa el hueco entre menú e iconos (sin solaparse).
        Desktop (lg+): 1fr | auto | 1fr — centrado en viewport con espacio simétrico a los lados.
      */}
      <div className="relative isolate grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1.5 px-3 py-3.5 sm:gap-x-2 sm:px-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-4 lg:px-10 lg:py-4">
        <div className="relative z-10 flex shrink-0 items-center bg-white">
          <StoreNavDropdowns
            menuCategories={menuCategories}
            accountHref={userIconHref}
            accountLabel={userIconLabel}
            guestOpensAuthDrawer={!user}
          />
        </div>

        <div className="flex min-w-0 items-center justify-center overflow-hidden px-1 sm:px-2 lg:max-w-[11.5rem] lg:px-0">
          <Link
            href="/"
            className="block w-full max-w-full leading-none outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2"
          >
            <StoreLogo
              variant="header"
              priority
              className="mx-auto w-full max-w-full lg:max-w-none"
            />
          </Link>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-end gap-0 bg-white sm:gap-0.5 lg:min-w-0 lg:shrink lg:gap-4">
          <Link
            href="/products"
            className="flex shrink-0 items-center justify-center p-1 text-stone-600 transition hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2 lg:hidden"
            aria-label="Buscar productos"
          >
            <Search
              className={STORE_HEADER_ICON_LG}
              strokeWidth={STORE_HEADER_ICON_STROKE}
              aria-hidden
            />
          </Link>
          <StoreSearch variant="minimal" />
          <StoreHeaderActions
            isLoggedIn={!!user}
            cartItemCount={cartItemCount}
            userIconHref={userIconHref}
            userIconLabel={userIconLabel}
            accountFirstName={accountFirstName}
            guestOpensAuthDrawer={!user}
          />
        </div>
      </div>
    </header>
  );
}
