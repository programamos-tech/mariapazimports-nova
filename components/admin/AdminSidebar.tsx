"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, type SVGProps } from "react";
import { signOutAdmin } from "@/app/actions/admin/auth";

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
const VENTAS_HUB_HREF = "/admin/ventas";
const CUSTOMERS_HREF = "/admin/customers";
const USUARIOS_HREF = "/admin/usuarios";

function navItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === USUARIOS_HREF) {
    return pathname === USUARIOS_HREF || pathname.startsWith(`${USUARIOS_HREF}/`);
  }
  if (href === VENTAS_HUB_HREF) {
    return (
      pathname === VENTAS_HUB_HREF ||
      pathname.startsWith(`${VENTAS_HUB_HREF}/`)
    );
  }
  if (href === PRODUCTS_HREF) {
    return pathname === PRODUCTS_HREF || pathname.startsWith(`${PRODUCTS_HREF}/`);
  }
  if (href === CUSTOMERS_HREF) {
    return pathname === CUSTOMERS_HREF || pathname.startsWith(`${CUSTOMERS_HREF}/`);
  }
  return isActive(pathname, href);
}

function SidebarLogo() {
  return (
    <Link href="/admin" className="inline-block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
      <Image
        src="/logobackoficce.png"
        alt="María Paz Imports"
        width={280}
        height={120}
        className="h-auto w-full max-w-[220px] object-contain"
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
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      active
        ? "bg-zinc-900 text-white shadow-sm"
        : "text-zinc-700 hover:bg-black/[0.04] hover:text-zinc-900",
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
      className={`flex shrink-0 flex-col bg-[var(--admin-sidebar-bg)] print:hidden fixed inset-y-0 left-0 z-[50] w-[min(88vw,288px)] max-w-[288px] border-r border-stone-200/80 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:w-64 lg:max-w-none lg:border-b-0 lg:shadow-none ${drawerTranslate} ${drawerHiddenMobile}`}
    >
      <div className="flex flex-col items-center border-b border-stone-200/80 px-4 py-5 text-center">
        <SidebarLogo />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
          BACKOFFICE
        </p>
      </div>
      <nav
        id="admin-sidebar-nav"
        className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-3 py-5"
      >
        {navSectionsFiltered.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
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
      <div className="border-t border-stone-200/80 p-3">
        <p className="font-berea-nova berea-signature mb-2 px-1 text-[11px] font-semibold">
          By Berea Studio
        </p>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-black/[0.04] hover:text-red-600"
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
    <aside className="fixed inset-y-0 left-0 z-[45] hidden w-64 flex-col border-r border-stone-200/80 bg-[var(--admin-sidebar-bg)] print:hidden lg:flex lg:flex-col">
      <div className="flex flex-col items-center border-b border-stone-200/80 px-4 py-5 text-center">
        <SidebarLogo />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
          BACKOFFICE
        </p>
      </div>
      <div className="flex-1 px-3 py-5" aria-busy aria-label="Cargando menú" />
      <div className="border-t border-stone-200/80 p-3">
        <p className="font-berea-nova berea-signature mb-2 px-1 text-[11px] font-semibold">
          By Berea Studio
        </p>
        <div className="h-10 rounded-xl bg-stone-200/60" />
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
