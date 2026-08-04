import {
  storeAnnouncementMessage,
  storeSupportPhone,
  storeWhatsAppUrl,
} from "@/lib/brand";

/** Número de copias del bloque (mismo texto). Debe coincidir con el % en `store-announcement-marquee` (-100%/N). */
const MARQUEE_SEGMENT_COUNT = 12;

const ANNOUNCEMENT_ITEMS = storeAnnouncementMessage
  .split(/\s*·\s*/)
  .map((part) => part.trim())
  .filter(Boolean);

const phoneLinkClass =
  "whitespace-nowrap font-normal text-stone-800 underline decoration-stone-800/35 underline-offset-[3px] hover:text-stone-950";

function Dot() {
  return (
    <span className="select-none text-stone-400" aria-hidden>
      ·
    </span>
  );
}

function AnnouncementSegment({ isDuplicate }: { isDuplicate: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-x-3 whitespace-nowrap py-2.5 text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-stone-800 sm:gap-x-3.5 sm:text-xs sm:tracking-[0.16em] ${
        isDuplicate ? "store-announcement-marquee-segment--dupe" : ""
      }`}
      aria-hidden={isDuplicate ? true : undefined}
    >
      {ANNOUNCEMENT_ITEMS.map((item) => (
        <span key={item} className="contents">
          <span className="font-normal">{item}</span>
          <Dot />
        </span>
      ))}
      <a
        href={storeWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={phoneLinkClass}
      >
        {storeSupportPhone}
      </a>
      <Dot />
    </span>
  );
}

export function StoreAnnouncementBar() {
  return (
    <div
      className="border-b border-stone-200/70 bg-[#f5f5f4] text-stone-700"
      role="region"
      aria-label="Anuncio de la tienda"
    >
      <div className="relative w-full min-w-0 overflow-hidden px-2 sm:px-3">
        <div className="store-announcement-marquee-track gap-x-3 sm:gap-x-3.5">
          {Array.from({ length: MARQUEE_SEGMENT_COUNT }, (_, i) => (
            <AnnouncementSegment key={i} isDuplicate={i > 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
