import type { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  storeBrand,
  storeCopyrightHolder,
  storeInstagramUrl,
  storeShortDescription,
  storeSupportEmail,
  storeSupportHours,
  storeSupportPhone,
  storeTagline,
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

function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" strokeLinecap="round" />
    </svg>
  );
}

const footerLinkClass =
  "text-sm text-stone-600 transition hover:text-[#3d5240] hover:underline underline-offset-4";

const telHref = `tel:${storeSupportPhone.replace(/[^\d+]/g, "")}`;

export function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200/80 bg-[var(--store-chrome-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="group inline-block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#6b7f6a] focus-visible:ring-offset-2"
            >
              <Image
                src="/logobackoficce.png"
                alt={storeBrand}
                width={560}
                height={239}
                className="h-16 w-auto max-w-[min(100%,22rem)] object-contain object-left transition-opacity group-hover:opacity-90 sm:h-20 sm:max-w-[min(100%,28rem)] lg:h-24 lg:max-w-[min(100%,34rem)]"
              />
            </Link>
            <p className="mt-2 text-xs font-medium text-stone-600">{storeTagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-600">
              {storeShortDescription}
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
                <Link href="/checkout" className={footerLinkClass}>
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
                <Link href="/quien-soy" className={footerLinkClass}>
                  Quién Soy
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
                  href={telHref}
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
              <li>
                <a
                  href={storeInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 text-sm text-stone-700 transition hover:text-[#3d5240]"
                >
                  <IconInstagram className="mt-0.5 size-4 shrink-0 text-[#6b7f6a]" />
                  <span>Instagram</span>
                </a>
              </li>
              <li className="flex gap-3 text-sm text-stone-600">
                <IconClock className="mt-0.5 size-4 shrink-0 text-[#6b7f6a]" />
                <span>{storeSupportHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-stone-200/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-stone-500 sm:text-sm">
              © {year} {storeCopyrightHolder}. Todos los derechos reservados.
            </p>
            <p className="font-berea-nova text-[11px] font-semibold text-stone-700 sm:text-xs">
              berea studio
            </p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm">
            <Link href="#" className={`${footerLinkClass} text-stone-500`}>
              Privacidad
            </Link>
            <Link href="#" className={`${footerLinkClass} text-stone-500`}>
              Términos
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
