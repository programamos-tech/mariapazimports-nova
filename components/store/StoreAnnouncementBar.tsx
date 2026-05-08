import Link from "next/link";
import {
  storeAnnouncementMessage,
  storeSupportPhone,
  storeWhatsAppUrl,
} from "@/lib/brand";

const phoneLinkClass =
  "whitespace-nowrap font-normal text-stone-800 underline decoration-stone-800/35 underline-offset-[3px] hover:text-stone-950";

export function StoreAnnouncementBar() {
  return (
    <div
      className="border-b border-stone-200/70 bg-[#f5f5f4] text-stone-700"
      role="region"
      aria-label="Promociones y contacto"
    >
      <p className="mx-auto max-w-5xl px-4 py-2.5 text-center text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-stone-800 sm:text-xs sm:tracking-[0.16em]">
        <Link href="/cuenta/registro" className={phoneLinkClass}>
          Regístrate
        </Link>
        <span className="text-stone-400" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <span className="font-normal">{storeAnnouncementMessage}</span>
        <span className="text-stone-400" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <a
          href={storeWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={phoneLinkClass}
        >
          {storeSupportPhone}
        </a>
      </p>
    </div>
  );
}
