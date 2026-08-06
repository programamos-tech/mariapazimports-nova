"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDoubleRight } from "@phosphor-icons/react/dist/csr/CaretDoubleRight";
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { User } from "@phosphor-icons/react/dist/csr/User";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_WEIGHT,
} from "@/lib/store-header-icons";
import type { StoreCategoryMenuItem } from "@/lib/fetch-store-categories";
import { useStoreAuthModals } from "@/components/store/StoreAuthModals";

const linkRowClass =
  "flex min-w-0 flex-1 items-center justify-between gap-3 py-4 text-left transition hover:bg-stone-50";

const linkLabelClass =
  "text-[13px] font-semibold uppercase tracking-[0.06em] text-stone-900";

function readActiveCategoryId(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      new URLSearchParams(window.location.search).get("category")?.trim() ?? ""
    );
  } catch {
    return "";
  }
}

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
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [flyoutId, setFlyoutId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const baseId = useId();

  const categoriesWithProducts = menuCategories.filter((c) => c.productCount > 0);
  const flyoutCategory =
    flyoutId != null
      ? (categoriesWithProducts.find((c) => c.id === flyoutId) ?? null)
      : null;
  const flyoutOpen = Boolean(open && flyoutCategory);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  /** Cerrar solo si cambió la ruta (no al abrir el menú). */
  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;
    setOpen(false);
    setFlyoutId(null);
    document.body.style.overflow = "";
  }, [pathname]);

  /** Al abrir el menú, abrí el panel de la categoría activa si tiene subcategorías. */
  useEffect(() => {
    if (!open) return;
    const activeId = readActiveCategoryId();
    setActiveCategoryId(activeId);
    if (!activeId) return;
    const parent = menuCategories.find(
      (c) =>
        c.productCount > 0 &&
        (c.id === activeId || c.children.some((ch) => ch.id === activeId)),
    );
    if (parent && parent.children.length > 0) {
      setFlyoutId(parent.id);
    }
  }, [open, menuCategories]);

  const close = useCallback(() => {
    setFlyoutId(null);
    setOpen(false);
    document.body.style.overflow = "";
  }, []);

  const openFlyout = useCallback((id: string) => {
    setFlyoutId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (flyoutId) {
        setFlyoutId(null);
        return;
      }
      close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, flyoutId]);

  const shopBtnClass =
    "group inline-flex items-center gap-2 rounded-none py-1 text-[13px] font-medium tracking-wide text-stone-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2";

  const drawerWidth =
    "w-[min(20rem,calc(100svw-2.5rem))] sm:w-[min(22rem,calc(100svw-3rem))]";
  const flyoutWidth =
    "w-[min(18rem,calc(100svw-5rem))] sm:w-[min(20rem,calc(100svw-4rem))]";

  function renderSubcategoryList(category: StoreCategoryMenuItem) {
    return (
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <li>
          <Link
            href={`/products?category=${category.id}`}
            onClick={close}
            className="flex items-center justify-between gap-3 px-2 py-3.5 text-left transition hover:bg-stone-50"
          >
            <span
              className={`text-[12px] font-semibold uppercase tracking-[0.05em] ${
                activeCategoryId === category.id
                  ? "text-stone-900 underline decoration-stone-400 underline-offset-4"
                  : "text-stone-800"
              }`}
            >
              Todo {category.name}
            </span>
            <CaretRight
              className="size-3.5 shrink-0 text-stone-300"
              weight={STORE_HEADER_ICON_WEIGHT}
              aria-hidden
            />
          </Link>
        </li>
        {category.children.map((child) => {
          const childActive = activeCategoryId === child.id;
          return (
            <li key={child.id}>
              <Link
                href={`/products?category=${child.id}`}
                onClick={close}
                className="flex items-center justify-between gap-3 px-2 py-3.5 text-left transition hover:bg-stone-50"
              >
                <span
                  className={`text-[12px] font-medium uppercase tracking-[0.05em] ${
                    childActive
                      ? "text-stone-900 underline decoration-stone-400 underline-offset-4"
                      : "text-stone-600"
                  }`}
                >
                  {child.name}
                </span>
                <CaretRight
                  className="size-3.5 shrink-0 text-stone-300"
                  weight={STORE_HEADER_ICON_WEIGHT}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  /** Solo montamos el portal si el menú está abierto: nada de panel blanco residual. */
  const drawerLayer =
    portalTarget &&
    open &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[75] bg-black/40"
          aria-hidden
          onClick={close}
        />

        <div
          id={`${baseId}-shop-drawer`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-shop-drawer-title`}
          className={`relative fixed inset-y-0 left-0 z-[80] flex h-full ${drawerWidth} flex-col bg-white shadow-[4px_0_24px_-4px_rgba(0,0,0,0.15)]`}
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

          {/* Móvil: subcategorías reemplazan el listado */}
          <div
            className={`absolute inset-0 z-10 flex flex-col bg-white transition-transform duration-300 ease-out md:hidden ${
              flyoutOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
            }`}
            aria-hidden={!flyoutOpen}
          >
            {flyoutCategory ? (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-stone-200 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setFlyoutId(null)}
                    className="inline-flex items-center gap-1.5 px-1 py-2 text-[12px] font-medium uppercase tracking-[0.06em] text-stone-600 transition hover:text-stone-900"
                  >
                    <CaretLeft
                      className="size-4"
                      weight={STORE_HEADER_ICON_WEIGHT}
                      aria-hidden
                    />
                    Volver
                  </button>
                </div>
                <div className="shrink-0 px-4 pb-3 pt-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                    Subcategorías
                  </p>
                  <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-stone-900">
                    {flyoutCategory.name}
                  </p>
                </div>
                {renderSubcategoryList(flyoutCategory)}
              </>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
            <ul className="border-t border-stone-200">
              <li className="border-b border-stone-200">
                <Link
                  href="/products"
                  onClick={close}
                  className={linkRowClass}
                >
                  <span
                    className={`${linkLabelClass} ${
                      !activeCategoryId
                        ? "underline decoration-stone-400 underline-offset-4"
                        : ""
                    }`}
                  >
                    Todos los productos
                  </span>
                  <CaretRight
                    className="size-4 shrink-0 text-stone-400"
                    weight={STORE_HEADER_ICON_WEIGHT}
                    aria-hidden
                  />
                </Link>
              </li>

              {categoriesWithProducts.length === 0 ? (
                <li className="border-b border-stone-100 px-0 py-4">
                  <p className="text-[12px] leading-relaxed text-stone-500">
                    Todavía no hay categorías. En «Todos los productos» ves el
                    catálogo completo; después podés organizarlos por categoría
                    desde el admin.
                  </p>
                </li>
              ) : (
                categoriesWithProducts.map((c) => {
                  const hasSubs = c.children.length > 0;
                  const isFlyoutOpen = flyoutId === c.id;
                  const parentHref = `/products?category=${c.id}`;
                  const parentActive =
                    activeCategoryId === c.id ||
                    c.children.some((ch) => ch.id === activeCategoryId);

                  return (
                    <li key={c.id} className="border-b border-stone-200">
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => openFlyout(c.id)}
                          className={`flex w-full min-w-0 items-center justify-between gap-3 py-4 text-left transition ${
                            isFlyoutOpen ? "bg-stone-50" : "hover:bg-stone-50"
                          }`}
                          aria-expanded={isFlyoutOpen}
                          aria-controls={
                            isFlyoutOpen ? `${baseId}-flyout` : undefined
                          }
                          aria-label={`${c.name}, tiene ${c.children.length} subcategorías`}
                        >
                          <span
                            className={`${linkLabelClass} ${
                              parentActive
                                ? "underline decoration-stone-400 underline-offset-4"
                                : ""
                            }`}
                          >
                            {c.name}
                          </span>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 ${
                              isFlyoutOpen ? "text-stone-900" : "text-stone-400"
                            }`}
                            title="Tiene subcategorías"
                          >
                            <span className="text-[10px] font-medium tabular-nums tracking-[0.08em]">
                              {c.children.length}
                            </span>
                            <CaretDoubleRight
                              className={`size-4 transition-transform duration-200 ${
                                isFlyoutOpen ? "translate-x-0.5" : ""
                              }`}
                              weight={STORE_HEADER_ICON_WEIGHT}
                              aria-hidden
                            />
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={parentHref}
                          onClick={close}
                          className={linkRowClass}
                        >
                          <span
                            className={`${linkLabelClass} ${
                              activeCategoryId === c.id
                                ? "underline decoration-stone-400 underline-offset-4"
                                : ""
                            }`}
                          >
                            {c.name}
                          </span>
                          <CaretRight
                            className="size-4 shrink-0 text-stone-400"
                            weight={STORE_HEADER_ICON_WEIGHT}
                            aria-hidden
                          />
                        </Link>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
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

          {/* Desktop: panel de subcategorías anclado al drawer (solo si hay hijas) */}
          {flyoutOpen && flyoutCategory ? (
            <div
              id={`${baseId}-flyout`}
              role="region"
              aria-label={`Subcategorías de ${flyoutCategory.name}`}
              className={`absolute left-full top-0 z-10 hidden h-full ${flyoutWidth} flex-col border-l border-stone-200 bg-white shadow-[8px_0_28px_-8px_rgba(0,0,0,0.18)] md:flex`}
            >
              <div className="shrink-0 border-b border-stone-200 px-4 py-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                  Subcategorías
                </p>
                <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-stone-900">
                  {flyoutCategory.name}
                </p>
              </div>
              {renderSubcategoryList(flyoutCategory)}
            </div>
          ) : null}
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
