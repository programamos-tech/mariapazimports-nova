import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontCartItemCount } from "@/lib/storefront-cart";
import { StoreLogo } from "@/components/store/StoreLogo";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { StoreHeaderActions } from "@/components/store/StoreHeaderActions";
import { StoreHeaderShell } from "@/components/store/StoreHeaderShell";
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
  const [menuCategories, cartItemCount, authResult] = await Promise.all([
    fetchStoreCategoriesWithCounts(supabase),
    getStorefrontCartItemCount(),
    supabase.auth.getUser(),
  ]);

  const user = authResult.data.user;
  const userIconHref = user ? "/cuenta" : "/cuenta/entrar";
  const userIconLabel = user ? "Mi cuenta" : "Iniciar sesión";
  const accountFirstName = accountFirstNameFromUser(user);

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

        <div className="relative z-10 flex shrink-0 items-center justify-end gap-0 bg-white sm:gap-0.5 lg:min-w-0 lg:shrink lg:gap-4 group-data-[home-overlay=true]/header:bg-transparent">
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
    </StoreHeaderShell>
  );
}
