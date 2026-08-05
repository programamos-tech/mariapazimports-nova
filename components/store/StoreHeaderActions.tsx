"use client";

import Link from "next/link";
import { Bag } from "@phosphor-icons/react/dist/csr/Bag";
import { User } from "@phosphor-icons/react/dist/csr/User";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_WEIGHT,
} from "@/lib/store-header-icons";
import { useStoreAuthModals } from "@/components/store/StoreAuthModals";
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";

const iconBtn =
  "flex items-center justify-center rounded-none p-1.5 text-stone-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2";

export function StoreHeaderActions({
  cartItemCount,
  userIconHref,
  userIconLabel,
  guestOpensAuthDrawer = false,
}: {
  cartItemCount: number;
  userIconHref: string;
  userIconLabel: string;
  guestOpensAuthDrawer?: boolean;
}) {
  const { openCart, prefetchCart } = useStoreCartDrawer();
  const { openLogin } = useStoreAuthModals();

  return (
    <div className="flex shrink-0 items-center gap-0 sm:gap-1 md:gap-4">
      <button
        type="button"
        onClick={() => openCart()}
        onPointerEnter={prefetchCart}
        onFocus={prefetchCart}
        aria-label={
          cartItemCount > 0
            ? `Bolsa de compras, ${cartItemCount} productos. Abrir bolsa`
            : "Bolsa de compras. Abrir bolsa"
        }
        aria-haspopup="dialog"
        className={`${iconBtn} gap-1.5`}
      >
        {cartItemCount > 0 ? (
          <span className="min-w-[1ch] text-center text-[13px] font-medium tabular-nums text-stone-900">
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        ) : null}
        <Bag
          className={STORE_HEADER_ICON_LG}
          weight={STORE_HEADER_ICON_WEIGHT}
          aria-hidden
        />
      </button>
      {guestOpensAuthDrawer ? (
        <button
          type="button"
          onClick={() => openLogin()}
          aria-label={userIconLabel}
          className={iconBtn}
        >
          <User
            className={STORE_HEADER_ICON_LG}
            weight={STORE_HEADER_ICON_WEIGHT}
            aria-hidden
          />
        </button>
      ) : (
        <Link
          href={userIconHref}
          aria-label={userIconLabel}
          className={iconBtn}
        >
          <User
            className={STORE_HEADER_ICON_LG}
            weight={STORE_HEADER_ICON_WEIGHT}
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
