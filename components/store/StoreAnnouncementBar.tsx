import {
  storeAnnouncementMessage,
  storeSupportPhone,
  storeWhatsAppUrl,
} from "@/lib/brand";

/** Repeticiones por mitad; dos mitades iguales → animación -50% sin solución de continuidad. */
const CHUNKS_PER_HALF = 16;

const chunkGapClass =
  "inline-flex shrink-0 items-center gap-2 px-3 text-xs sm:gap-3 sm:px-5 sm:text-sm";

const phoneLinkClass =
  "whitespace-nowrap font-medium text-stone-700 underline decoration-stone-400/60 underline-offset-2 hover:text-[#556654]";

function AnnouncementChunk({ suppressFocus }: { suppressFocus: boolean }) {
  const msg = storeAnnouncementMessage;
  const roving = suppressFocus ? ({ tabIndex: -1 } as const) : {};

  return (
    <span className={chunkGapClass}>
      <a
        href={storeWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={phoneLinkClass}
        {...roving}
      >
        {storeSupportPhone}
      </a>
      <span className="text-stone-400" aria-hidden>
        ·
      </span>
      <span className="whitespace-nowrap text-stone-700">{msg}</span>
    </span>
  );
}

function MarqueeHalf({
  suffix,
  suppressFocus,
  ariaHidden,
}: {
  suffix: string;
  suppressFocus: boolean;
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="flex w-max shrink-0 items-center py-2"
      aria-hidden={ariaHidden}
    >
      {Array.from({ length: CHUNKS_PER_HALF }, (_, i) => (
        <AnnouncementChunk key={`${suffix}-${i}`} suppressFocus={suppressFocus} />
      ))}
    </div>
  );
}

export function StoreAnnouncementBar() {
  return (
    <div
      className="overflow-hidden bg-[#e8e6e1] text-stone-600"
      role="region"
      aria-label="Promociones y contacto"
    >
      <div className="flex w-full">
        <div className="flex w-max animate-store-announcement-marquee">
          <MarqueeHalf suffix="a" suppressFocus={false} />
          <MarqueeHalf suffix="b" suppressFocus ariaHidden />
        </div>
      </div>
    </div>
  );
}
