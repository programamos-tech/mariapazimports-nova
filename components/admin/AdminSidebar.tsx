"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, type SVGProps } from "react";
import { signOutAdmin } from "@/app/actions/admin/auth";
import { bereaSignaturePath, storeBrand, storeLogoPath } from "@/lib/brand";

function Icon(props: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  const { children, className = "", ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-[18px] shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

const navSections: {
  title: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
}[] = [
  {
    title: "Comercial",
    items: [
      {
        href: "/admin",
        label: "Reportes",
        icon: (
          <Icon>
            <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
          </Icon>
        ),
      },
      {
        href: "/admin/ventas",
        label: "Ventas",
        icon: (
          <Icon>
            <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </Icon>
        ),
      },
      {
        href: "/admin/egresos",
        label: "Egresos",
        icon: (
          <Icon>
            <path d="M4 6h16v12H4z" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
          </Icon>
        ),
      },
      {
        href: "/admin/proveedores",
        label: "Proveedores",
        icon: (
          <Icon>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18h-1M16 18h-1M8 18H7" />
          </Icon>
        ),
      },
      {
        href: "/admin/products",
        label: "Productos",
        icon: (
          <Icon>
            <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
            <path d="M3.3 7 12 12l8.7-5" />
          </Icon>
        ),
      },
      {
        href: "/admin/customers",
        label: "Clientes",
        icon: (
          <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        href: "/admin/usuarios",
        label: "Equipo",
        icon: (
          <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        ),
      },
      {
        href: "/admin/actividades",
        label: "Actividades",
        icon: (
          <Icon>
            <path d="M4 11h16" />
            <path d="M4 7h10" />
            <path d="M4 15h8" />
            <path d="M18 15h2" />
            <path d="M18 11h2" />
            <circle cx="18" cy="7" r="2" />
          </Icon>
        ),
      },
      {
        href: "/admin/banners",
        label: "Banners",
        icon: (
          <Icon>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 15h18" />
            <path d="m9 10 2 2 4-4" />
          </Icon>
        ),
      },
      {
        href: "/admin/coupons",
        label: "Cupones",
        icon: (
          <Icon>
            <path d="M20 12V8H4v4" />
            <path d="M12 8v11" />
            <path d="M8 19h8" />
            <path d="M8 5h8v3H8z" />
          </Icon>
        ),
      },
      {
        href: "/admin/settings",
        label: "Ajustes",
        icon: (
          <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </Icon>
        ),
      },
      {
        href: "/",
        label: "Ver tienda",
        icon: (
          <Icon>
            <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </Icon>
        ),
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/") return false;
  const pathOnly = href.split("?")[0] ?? href;
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

const PRODUCTS_HREF = "/admin/products";
const VENTAS_HREF = "/admin/ventas";
/** Pedidos / facturas abren bajo esta ruta; debe seguir resaltando Ventas en el sidebar. */
const ORDERS_HREF = "/admin/orders";
const CUSTOMERS_HREF = "/admin/customers";
const COUPONS_HREF = "/admin/coupons";
const USUARIOS_HREF = "/admin/usuarios";
const PROVEEDORES_HREF = "/admin/proveedores";

function navItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === USUARIOS_HREF) {
    return pathname === USUARIOS_HREF || pathname.startsWith(`${USUARIOS_HREF}/`);
  }
  if (href === VENTAS_HREF) {
    return (
      pathname === VENTAS_HREF ||
      pathname.startsWith(`${VENTAS_HREF}/`) ||
      pathname === ORDERS_HREF ||
      pathname.startsWith(`${ORDERS_HREF}/`)
    );
  }
  if (href === PRODUCTS_HREF) {
    return pathname === PRODUCTS_HREF || pathname.startsWith(`${PRODUCTS_HREF}/`);
  }
  if (href === CUSTOMERS_HREF) {
    return pathname === CUSTOMERS_HREF || pathname.startsWith(`${CUSTOMERS_HREF}/`);
  }
  if (href === COUPONS_HREF) {
    return pathname === COUPONS_HREF || pathname.startsWith(`${COUPONS_HREF}/`);
  }
  if (href === PROVEEDORES_HREF) {
    return pathname === PROVEEDORES_HREF || pathname.startsWith(`${PROVEEDORES_HREF}/`);
  }
  return isActive(pathname, href);
}

function SidebarLogo() {
  return (
    <Link
      href="/admin"
      className="inline-block rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
    >
      <Image
        src={storeLogoPath}
        alt={storeBrand}
        width={280}
        height={120}
        className="h-auto w-full max-w-[92px] object-contain object-center sm:max-w-[100px]"
        priority
      />
    </Link>
  );
}

function AdminSidebarInner({
  canViewActivities,
  mobileOpen,
  onNavigate,
}: {
  canViewActivities: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  const navSectionsFiltered = canViewActivities
    ? navSections
    : navSections.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.href !== "/admin/actividades"),
      }));

  const linkClass = (href: string, active: boolean) =>
    [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200",
      active
        ? "bg-neutral-950 text-white shadow-[0_8px_22px_-12px_rgba(0,0,0,0.35)]"
        : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
    ].join(" ");

  const drawerTranslate =
    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";

  /** Drawer cerrado en móvil: sin foco ni clics; en lg siempre interactuable. */
  const drawerHiddenMobile =
    !mobileOpen
      ? "max-lg:invisible max-lg:pointer-events-none lg:!visible lg:!pointer-events-auto"
      : "";

  return (
    <aside
      className={`flex shrink-0 flex-col bg-white print:hidden fixed inset-y-0 left-0 z-[50] w-[min(88vw,288px)] max-w-[288px] border-r border-stone-200/90 shadow-[2px_0_32px_-16px_rgba(28,25,23,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:w-64 lg:max-w-none lg:border-b-0 lg:shadow-[1px_0_0_rgba(231,229,228,0.9)] ${drawerTranslate} ${drawerHiddenMobile}`}
    >
      <div className="flex flex-col items-center border-b border-stone-200/90 px-4 py-6 text-center">
        <SidebarLogo />
        <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Backoffice
        </p>
      </div>
      <nav
        id="admin-sidebar-nav"
        className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-3 py-5"
      >
        {navSectionsFiltered.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              {section.title}
            </p>
            <ul className="mt-2.5 space-y-0.5">
              {section.items.map((item) => {
                const active = navItemActive(pathname, item.href);
                return (
                  <li key={`${section.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      className={linkClass(item.href, active)}
                      onClick={() => onNavigate()}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-stone-200/90 p-3">
        <div className="mb-3 flex flex-col items-center gap-2 px-1 text-center">
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-400">
            Experiencia por
          </span>
          <Image
            src={bereaSignaturePath}
            alt="Berea Studio"
            width={400}
            height={100}
            className="mx-auto h-16 w-auto max-w-full object-contain object-center opacity-95 sm:h-[4.5rem] sm:max-w-[min(100%,20rem)]"
          />
        </div>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-red-700"
          >
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}

function AdminSidebarFallback() {
  return (
    <aside className="fixed inset-y-0 left-0 z-[45] hidden w-64 flex-col border-r border-stone-200/90 bg-white print:hidden lg:flex lg:flex-col">
      <div className="flex flex-col items-center border-b border-stone-200/90 px-4 py-6 text-center">
        <SidebarLogo />
        <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Backoffice
        </p>
      </div>
      <div className="flex-1 px-3 py-5" aria-busy aria-label="Cargando menú" />
      <div className="border-t border-stone-200/90 p-3">
        <div className="mb-2 flex flex-col items-center gap-2">
          <div className="h-16 w-full max-w-[20rem] rounded bg-stone-200/70 sm:h-[4.5rem]" aria-hidden />
          <div className="h-10 w-full max-w-[20rem] rounded-lg bg-stone-100" />
        </div>
      </div>
    </aside>
  );
}

export function AdminSidebar({
  canViewActivities = true,
  mobileOpen,
  onNavigate,
}: {
  canViewActivities?: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <Suspense fallback={<AdminSidebarFallback />}>
      <AdminSidebarInner
        canViewActivities={canViewActivities}
        mobileOpen={mobileOpen}
        onNavigate={onNavigate}
      />
    </Suspense>
  );
}
