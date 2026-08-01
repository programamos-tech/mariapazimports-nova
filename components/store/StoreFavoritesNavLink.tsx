"use client";

import Link from "next/link";
import { Heart } from "@phosphor-icons/react/dist/csr/Heart";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_WEIGHT,
} from "@/lib/store-header-icons";
import { useStoreFavorites } from "@/components/store/StoreFavoritesProvider";

export function StoreFavoritesNavLink() {
  const { count, ready } = useStoreFavorites();
  const filled = ready && count > 0;

  return (
    <Link
      href="/favoritos"
      aria-label={
        count > 0 ? `Favoritos, ${count} producto${count === 1 ? "" : "s"}` : "Favoritos"
      }
      className="flex items-center justify-center rounded-none p-1.5 text-stone-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2"
    >
      <Heart
        className={STORE_HEADER_ICON_LG}
        weight={filled ? "fill" : STORE_HEADER_ICON_WEIGHT}
        aria-hidden
      />
      {ready && count > 0 ? (
        <span className="sr-only">{count} guardados</span>
      ) : null}
    </Link>
  );
}
