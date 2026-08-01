"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { User } from "@phosphor-icons/react/dist/csr/User";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_WEIGHT,
} from "@/lib/store-header-icons";
import type { StoreCategoryMenuItem } from "@/lib/fetch-store-categories";
import { useStoreAuthModals } from "@/components/store/StoreAuthModals";

const linkRowClass =
  "flex items-center justify-between gap-4 border-b border-stone-200 py-4 text-left transition hover:bg-stone-50";

const linkLabelClass =
  "text-[13px] font-semibold uppercase tracking-[0.06em] text-stone-900";

export function StoreNavDropdowns({
  menuCategories,
  accountHref,
  accountLabel,
  guestOpensAuthDrawer = false,
}: {
  menuCategories: StoreCategoryMenuItem[];
  accountHref: string;
  accountLabel: string;
  /** Si es true, “Mi cuenta” / login abre el panel lateral en lugar de navegar. */
  guestOpensAuthDrawer?: boolean;
}) {
  const { openLogin } = useStoreAuthModals();
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const baseId = useId();

  const categoriesWithProducts = menuCategories.filter((c) => c.productCount > 0);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const shopBtnClass =
    "group inline-flex items-center gap-2 rounded-none py-1 text-[13px] font-medium tracking-wide text-stone-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2";

  const drawerLayer =
    portalTarget &&
    createPortal(
      <>
        <div
          className={`fixed inset-0 z-[75] bg-black/40 transition-opacity duration-300 ease-out ${
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!open}
          onClick={close}
        />

        <div
          id={`${baseId}-shop-drawer`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-shop-drawer-title`}
          className={`fixed inset-y-0 left-0 z-[80] flex w-[min(22rem,calc(100svw-2rem))] flex-col bg-white shadow-[4px_0_24px_-4px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out sm:w-[min(24rem,calc(100svw-3rem))] ${
            open ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex shrink-0 justify-end px-4 pb-2 pt-4">
            <button
              type="button"
              onClick={close}
              className="inline-flex size-10 items-center justify-center border border-stone-900 text-stone-900 transition hover:bg-stone-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50"
              aria-label="Cerrar menú"
            >
              <X className="size-5" weight={STORE_HEADER_ICON_WEIGHT} aria-hidden />
            </button>
          </div>

          <h2 id={`${baseId}-shop-drawer-title`} className="sr-only">
            Menú de la tienda
          </h2>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
            {categoriesWithProducts.length === 0 ? (
              <p className="py-6 text-sm text-stone-500">
                Todavía no hay categorías con productos.
              </p>
            ) : (
              <ul className="border-t border-stone-200">
                {categoriesWithProducts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/products?category=${c.id}`}
                      onClick={close}
                      className={linkRowClass}
                    >
                      <span className={linkLabelClass}>{c.name}</span>
                      <CaretRight
                        className="size-4 shrink-0 text-stone-400"
                        weight={STORE_HEADER_ICON_WEIGHT}
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link href="/products" onClick={close} className={linkRowClass}>
              <span className={linkLabelClass}>Todos los productos</span>
              <CaretRight
                className="size-4 shrink-0 text-stone-400"
                weight={STORE_HEADER_ICON_WEIGHT}
                aria-hidden
              />
            </Link>
          </div>

          <div className="shrink-0 border-t border-stone-200 px-4 py-4">
            {guestOpensAuthDrawer ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  openLogin();
                }}
                className="flex w-full items-center gap-3 py-2 text-left transition hover:opacity-70"
              >
                <User
                  className="size-5 shrink-0 text-stone-900"
                  weight={STORE_HEADER_ICON_WEIGHT}
                  aria-hidden
                />
                <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone-900">
                  {accountLabel}
                </span>
              </button>
            ) : (
              <Link
                href={accountHref}
                onClick={close}
                className="flex items-center gap-3 py-2 text-left transition hover:opacity-70"
              >
                <User
                  className="size-5 shrink-0 text-stone-900"
                  weight={STORE_HEADER_ICON_WEIGHT}
                  aria-hidden
                />
                <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone-900">
                  {accountLabel}
                </span>
              </Link>
            )}
          </div>
        </div>
      </>,
      portalTarget,
    );

  return (
    <nav aria-label="Principal" className="relative flex items-center">
      <button
        type="button"
        className={shopBtnClass}
        aria-expanded={open}
        aria-controls={`${baseId}-shop-drawer`}
        id={`${baseId}-shop-trigger`}
        onClick={() => setOpen((v) => !v)}
      >
        <List
          className={STORE_HEADER_ICON_LG}
          weight={STORE_HEADER_ICON_WEIGHT}
          aria-hidden
        />
        <span className="text-[13px]">Shop</span>
      </button>

      {drawerLayer}
    </nav>
  );
}
