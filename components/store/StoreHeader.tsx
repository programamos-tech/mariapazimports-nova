import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontCartItemCount } from "@/lib/storefront-cart";
import { StoreLogo } from "@/components/store/StoreLogo";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { StoreHeaderActions } from "@/components/store/StoreHeaderActions";
import { StoreHeaderShell } from "@/components/store/StoreHeaderShell";
import { StoreNavDropdowns } from "@/components/store/StoreNavDropdowns";
import { StoreSearch } from "@/components/store/StoreSearch";
import { fetchStoreCategoriesWithCounts } from "@/lib/fetch-store-categories";

export async function StoreHeader() {
  const supabase = await createSupabaseServerClient();
  const [menuCategories, cartItemCount, authResult] = await Promise.all([
    fetchStoreCategoriesWithCounts(supabase),
    getStorefrontCartItemCount(),
    supabase.auth.getUser(),
  ]);

  const user = authResult.data.user;
  const userIconHref = user ? "/cuenta" : "/cuenta/entrar";
  const userIconLabel = user ? "Mi cuenta" : "Iniciar sesión";

  return (
    <StoreHeaderShell>
      <StoreAnnouncementBar />

      {/*
        Móvil/tablet: auto | 1fr | auto — el logo solo ocupa el hueco entre menú e iconos (sin solaparse).
        Desktop (lg+): 1fr | auto | 1fr — centrado en viewport con espacio simétrico a los lados.
      */}
      <div className="relative isolate grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1.5 px-3 py-3.5 sm:gap-x-2 sm:px-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-4 lg:px-10 lg:py-4">
        <div className="relative z-10 flex shrink-0 items-center bg-white group-data-[home-overlay=true]/header:bg-transparent">
          <StoreNavDropdowns
            menuCategories={menuCategories}
            accountHref={userIconHref}
            accountLabel={userIconLabel}
            guestOpensAuthDrawer={!user}
          />
        </div>

        <div className="flex min-w-0 items-center justify-center overflow-hidden px-1 sm:px-2">
          <Link
            href="/"
            className="inline-flex max-w-full shrink items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2"
          >
            <StoreLogo variant="header" priority />
          </Link>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-end gap-0 bg-white sm:gap-0.5 lg:min-w-0 lg:shrink lg:gap-4 group-data-[home-overlay=true]/header:bg-transparent">
          <StoreSearch variant="minimal" />
          <StoreHeaderActions
            cartItemCount={cartItemCount}
            userIconHref={userIconHref}
            userIconLabel={userIconLabel}
            guestOpensAuthDrawer={!user}
          />
        </div>
      </div>
    </StoreHeaderShell>
  );
}
