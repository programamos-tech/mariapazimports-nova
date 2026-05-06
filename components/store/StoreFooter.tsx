import type { SVGProps } from "react";
import Link from "next/link";
import { StoreBrandMark } from "@/components/store/StoreBrandMark";
import {
  storeBrand,
  storeSupportEmail,
  storeSupportPhone,
} from "@/lib/brand";

function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M4 6h16v12H4V6Z" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        d="M6.5 4h3l1.5 4-2 1.5c1 3 3.5 5.5 6.5 6.5L15 15l4 1.5v3a1 1 0 0 1-1 1A15 15 0 0 1 6.5 5a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const footerLinkClass =
  "text-sm text-stone-600 transition hover:text-[#3d5240] hover:underline underline-offset-4";

export function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <StoreBrandMark href="/" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-600">
              Tu tienda online con catálogo, carrito y pagos seguros. Personalizá
              esta plantilla con tu marca y empezá a vender.
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Comprar
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className={footerLinkClass}>
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/products" className={footerLinkClass}>
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/cart" className={footerLinkClass}>
                  Carrito
                </Link>
              </li>
              <li>
                <Link href="/checkout" className={footerLinkClass}>
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Información
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/products" className={footerLinkClass}>
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link href="/admin" className={footerLinkClass}>
                  Administración
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Contacto
            </p>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href={`tel:${storeSupportPhone.replace(/\s/g, "")}`}
                  className="flex gap-3 text-sm text-stone-700 transition hover:text-[#3d5240]"
                >
                  <IconPhone className="mt-0.5 size-4 shrink-0 text-[#6b7f6a]" />
                  <span>{storeSupportPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${storeSupportEmail}`}
                  className="flex gap-3 break-all text-sm text-stone-700 transition hover:text-[#3d5240]"
                >
                  <IconMail className="mt-0.5 size-4 shrink-0 text-[#6b7f6a]" />
                  <span>{storeSupportEmail}</span>
                </a>
              </li>
              <li className="text-sm text-stone-600">
                Lun. a vie. · 9:00 – 18:00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-stone-200/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-500 sm:text-sm">
            © {year} {storeBrand}. Todos los derechos reservados.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm">
            <span className="text-stone-400">Privacidad (editar en tu sitio)</span>
            <span className="text-stone-400">Términos (editar en tu sitio)</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
