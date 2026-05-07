"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
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
      className={`relative flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-[#f4f0ea] ${
        filled ? "text-rose-500 hover:text-rose-600" : "text-stone-600 hover:text-rose-600"
      }`}
    >
      <Heart
        className="size-5"
        strokeWidth={2}
        fill={filled ? "currentColor" : "none"}
      />
      {ready && count > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
