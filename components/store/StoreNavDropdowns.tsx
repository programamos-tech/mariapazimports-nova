"use client";

import type { SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getCategoryIconComponent } from "@/lib/category-icons";
import type { StoreCategoryMenuItem } from "@/lib/fetch-store-categories";

type MenuId = "categories" | null;

function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ítem activo: línea inferior (patrón típico de tiendas), sin fondo tipo píldora. */
function navLinkClass(active: boolean) {
  return `inline-flex border-b-2 px-1 pb-1 pt-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-[#556654] text-stone-900"
      : "border-transparent text-stone-600 hover:border-stone-300/90 hover:text-stone-900"
  }`;
}

export function StoreNavDropdowns({
  menuCategories,
}: {
  menuCategories: StoreCategoryMenuItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<MenuId>(null);
  const [categoriesPanelTop, setCategoriesPanelTop] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const categoriesTriggerRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();

  const close = useCallback(() => setOpen(null), []);

  const inicioActive = pathname === "/";
  const productosActive = pathname === "/products" || pathname.startsWith("/products/");
  const quienSoyActive = pathname === "/quien-soy";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    if (open !== "categories") return;
    const el = categoriesTriggerRef.current;
    if (!el) return;
    const syncTop = () => {
      const r = el.getBoundingClientRect();
      setCategoriesPanelTop(r.bottom + 8);
    };
    syncTop();
    window.addEventListener("resize", syncTop);
    window.addEventListener("scroll", syncTop, true);
    return () => {
      window.removeEventListener("resize", syncTop);
      window.removeEventListener("scroll", syncTop, true);
    };
  }, [open]);

  return (
    <nav
      ref={wrapRef}
      aria-label="Principal"
      className="relative flex flex-wrap items-center gap-1"
    >
      <Link href="/" className={navLinkClass(inicioActive)}>
        Inicio
      </Link>
      <Link href="/products" className={navLinkClass(productosActive)}>
        Productos
      </Link>

      <div className="relative">
        <button
          ref={categoriesTriggerRef}
          type="button"
          className={`flex items-center gap-0.5 border-b-2 px-1 pb-1 pt-1.5 text-sm font-medium transition-colors ${
            open === "categories"
              ? "border-[#556654] text-stone-900"
              : "border-transparent text-stone-600 hover:border-stone-300/90 hover:text-stone-900"
          }`}
          data-open={open === "categories"}
          aria-expanded={open === "categories"}
          aria-controls={`${baseId}-categories-panel`}
          id={`${baseId}-categories-trigger`}
          onClick={() => setOpen((v) => (v === "categories" ? null : "categories"))}
        >
          Categorías
          <IconChevronDown className="size-4 text-stone-400" />
        </button>
        {open === "categories" ? (
          <div
            id={`${baseId}-categories-panel`}
            role="region"
            aria-labelledby={`${baseId}-categories-trigger`}
            style={{ top: categoriesPanelTop }}
            className="fixed left-1/2 z-50 max-h-[min(85vh,30rem)] w-[min(100vw-2rem,40rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xl shadow-stone-200/80 ring-1 ring-stone-100"
          >
            <h2 className="text-base font-semibold text-stone-900">
              Categorías populares
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Explorá el catálogo de María Paz Importaciones
            </p>
            {menuCategories.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">
                Todavía no hay categorías. Creálas en Administración → Catálogo.
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {menuCategories.map((c) => {
                  const Icon = getCategoryIconComponent(c.iconKey);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/products?category=${c.id}`}
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-xl border border-stone-100 bg-[#faf8f5] p-2.5 transition hover:border-[#c7d4c2] hover:bg-white hover:shadow-sm"
                      >
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${c.tint}`}
                          aria-hidden
                        >
                          <Icon className="size-5 text-zinc-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold leading-tight text-stone-900">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs leading-tight text-stone-500">
                            {c.sub}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href="/products"
              onClick={close}
              className="mt-4 block text-center text-sm font-semibold text-[#6b7f6a] hover:underline"
            >
              Ver todo el catálogo →
            </Link>
          </div>
        ) : null}
      </div>

      <Link href="/quien-soy" className={navLinkClass(quienSoyActive)}>
        Quién Soy
      </Link>
    </nav>
  );
}
