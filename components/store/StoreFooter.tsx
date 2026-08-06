import Image from "next/image";
import Link from "next/link";
import { StoreLogo } from "@/components/store/StoreLogo";
import { StoreHomeLogoLink } from "@/components/store/StoreHomeLogoLink";
import { StoreWompiPaymentLogos } from "@/components/store/StoreWompiPaymentLogos";
import { storeShellClass } from "@/lib/store-layout";
import {
  bereaSignaturePathSm,
  storeCopyrightHolder,
  storeInstagramUrl,
  storeSupportHours,
  storeWhatsAppUrl,
} from "@/lib/brand";

const footerColumnTitle =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900";

const footerLink =
  "text-sm leading-relaxed text-stone-600 transition hover:text-stone-900";

export function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200/90 bg-white">
      <div className={`${storeShellClass} py-12 sm:py-14 lg:py-16`}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,14rem)_1fr] lg:gap-16 xl:gap-20">
          <div className="max-w-[12rem]">
            <StoreHomeLogoLink className="inline-block outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2">
              <StoreLogo variant="footer" className="object-left" />
            </StoreHomeLogoLink>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8 lg:gap-12">
            <div>
              <p className={footerColumnTitle}>Contacto</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <a
                    href={storeWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerLink}
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <p className="text-sm leading-relaxed text-stone-500">
                    {storeSupportHours}
                  </p>
                </li>
              </ul>
            </div>

            <div>
              <p className={footerColumnTitle}>Tienda</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/products" className={footerLink}>
                    Productos
                  </Link>
                </li>
                <li>
                  <Link href="/marcas" className={footerLink}>
                    Marcas
                  </Link>
                </li>
                <li>
                  <Link href="/quien-soy" className={footerLink}>
                    Quién soy
                  </Link>
                </li>
                <li>
                  <Link href="/favoritos" className={footerLink}>
                    Favoritos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className={footerColumnTitle}>Síguenos</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <a
                    href={storeInstagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerLink}
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200/90">
        <div
          className={`${storeShellClass} flex flex-col gap-4 py-5 pr-[4.75rem] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-3 sm:pr-24 lg:pr-28`}
        >
          <p className="text-[11px] leading-relaxed text-stone-500 sm:text-xs">
            © {year} {storeCopyrightHolder}. Todos los derechos reservados.
          </p>
          <StoreWompiPaymentLogos />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
            <nav
              aria-label="Legal y equipo"
              className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-stone-500 sm:text-xs"
            >
              <Link href="/privacidad" className={footerLink}>
                Privacidad
              </Link>
              <Link href="/terminos" className={footerLink}>
                Términos
              </Link>
              <Link href="/cookies" className={footerLink}>
                Cookies
              </Link>
            </nav>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 sm:text-xs">
              <span className="whitespace-nowrap">Diseñado por</span>
              <Image
                src={bereaSignaturePathSm}
                alt="Berea House — desarrollo de software"
                width={220}
                height={103}
                sizes="72px"
                className="h-3.5 w-auto max-w-[4.25rem] object-contain object-left opacity-80 sm:h-4 sm:max-w-[4.75rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
