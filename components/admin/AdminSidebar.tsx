"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type SVGProps } from "react";
import { signOutAdmin } from "@/app/actions/admin/auth";
import { StoreBrandMark } from "@/components/store/StoreBrandMark";

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
        href: "/admin/products",
        label: "Productos",
        icon: (
          <Icon>
            <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
            <path d="M3.3 7 12 12l8.7-5" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: "Operación",
    items: [
      {
        href: "/admin/orders",
        label: "Pedidos",
        icon: (
          <Icon>
            <path d="M9 5H5v14h14v-4" />
            <path d="M9 5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v3H9V5Z" />
            <path d="m15 12 2 2 4-4" />
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
        label: "Usuarios y roles",
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
const USUARIOS_HREF = "/admin/usuarios";

function navItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === USUARIOS_HREF) {
    return pathname === USUARIOS_HREF || pathname.startsWith(`${USUARIOS_HREF}/`);
  }
  if (href === VENTAS_HUB_HREF) {
    return pathname === VENTAS_HUB_HREF;
  }
  if (href === PRODUCTS_HREF) {
    return pathname === PRODUCTS_HREF || pathname.startsWith(`${PRODUCTS_HREF}/`);
  }
  return isActive(pathname, href);
}

function AdminSidebarInner({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  const linkClass = (href: string, active: boolean) =>
    [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      active
        ? "bg-zinc-800 text-white shadow-sm"
        : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
    ].join(" ");

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-zinc-800/90 bg-zinc-950 md:w-64 md:border-b-0 md:border-r md:border-zinc-800/90">
      <div className="border-b border-zinc-800/80 px-4 py-5">
        <StoreBrandMark href="/admin" variant="admin-sidebar" />
        <p
          className="mt-4 truncate text-xs text-zinc-500"
          title={userEmail || undefined}
        >
          {userEmail || "Sesión admin"}
        </p>
      </div>
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
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
      <div className="border-t border-zinc-800/80 p-3">
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-red-400"
          >
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}

function AdminSidebarFallback({ userEmail }: { userEmail: string }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-zinc-800/90 bg-zinc-950 md:w-64 md:border-b-0 md:border-r md:border-zinc-800/90">
      <div className="border-b border-zinc-800/80 px-4 py-5">
        <StoreBrandMark href="/admin" variant="admin-sidebar" />
        <p
          className="mt-4 truncate text-xs text-zinc-500"
          title={userEmail || undefined}
        >
          {userEmail || "Sesión admin"}
        </p>
      </div>
      <div className="flex-1 px-3 py-5" aria-busy aria-label="Cargando menú" />
      <div className="border-t border-zinc-800/80 p-3">
        <div className="h-10 rounded-xl bg-zinc-900/50" />
      </div>
    </aside>
  );
}

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  return (
    <Suspense fallback={<AdminSidebarFallback userEmail={userEmail} />}>
      <AdminSidebarInner userEmail={userEmail} />
    </Suspense>
  );
}
