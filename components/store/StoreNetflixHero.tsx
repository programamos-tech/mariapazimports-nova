import Image from "next/image";
import Link from "next/link";
import { storeTaglineLines } from "@/lib/brand";
import { MPI_HERO_IMAGES } from "@/lib/mpi-hero-images";

const ROWS: { direction: "left" | "right"; durationSec: number; offset: number }[] =
  [
    { direction: "left", durationSec: 55, offset: 0 },
    { direction: "right", durationSec: 68, offset: 2 },
    { direction: "left", durationSec: 48, offset: 4 },
  ];

/** Duplicamos el set para que el marquee sea continuo sin saltos. */
function rowImages(offset: number) {
  const rotated = [
    ...MPI_HERO_IMAGES.slice(offset),
    ...MPI_HERO_IMAGES.slice(0, offset),
  ];
  return [...rotated, ...rotated, ...rotated];
}

function HeroCard({
  src,
  priority,
}: {
  src: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[2/3] w-[9.5rem] shrink-0 overflow-hidden rounded-xl bg-stone-200 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:w-[11.5rem] md:w-[13rem] lg:w-[14.5rem]">
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 640px) 152px, (max-width: 768px) 184px, (max-width: 1024px) 208px, 232px"
        className="object-cover object-center"
      />
    </div>
  );
}

/**
 * Hero a pantalla completa: collage en movimiento + mensaje editorial
 * sobre lavado blanco / velo local (legible en tablet y móvil).
 */
export function StoreNetflixHero() {
  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-white"
      aria-labelledby="store-hero-intro-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 py-16 sm:gap-4 sm:py-20 lg:gap-5"
        aria-hidden
      >
        <div className="flex origin-center scale-[1.08] -rotate-[4deg] flex-col gap-3 sm:gap-4 lg:gap-5">
          {ROWS.map((row, rowIdx) => {
            const imgs = rowImages(row.offset);
            const animClass =
              row.direction === "left"
                ? "store-mpi-marquee-left"
                : "store-mpi-marquee-right";
            return (
              <div key={rowIdx} className="overflow-hidden">
                <div
                  className={`flex w-max gap-3 sm:gap-4 ${animClass}`}
                  style={{ animationDuration: `${row.durationSec}s` }}
                >
                  {imgs.map((src, i) => (
                    <HeroCard
                      key={`${rowIdx}-${i}`}
                      src={src}
                      priority={rowIdx === 1 && i < 3}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(22vh,10rem)] bg-gradient-to-b from-white/85 via-white/30 to-transparent"
        aria-hidden
      />

      {/* Lavado inferior más alto/opaco en tablet: el collage no pelea con el copy. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(68vh,34rem)] sm:h-[min(62vh,36rem)] md:h-[min(70vh,40rem)]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white from-[18%] via-white/97 via-[48%] to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[6px] [mask-image:linear-gradient(to_top,black_42%,transparent_92%)]" />
      </div>

      <div className="relative z-[2] flex min-h-[100svh] flex-col items-center justify-end px-5 pb-[max(5.5rem,10vh)] pt-[max(6.5rem,18vw)] sm:px-8 sm:pb-[max(6rem,11vh)] md:pb-[max(6.5rem,12vh)]">
        <div className="relative mx-auto flex w-full max-w-sm flex-col items-center text-center sm:max-w-md">
          {/* Velo local detrás del mensaje (sin borde/card): legible sobre fotos oscuras. */}
          <div
            className="pointer-events-none absolute -inset-x-6 -inset-y-5 -z-10 bg-white/88 blur-xl sm:-inset-x-10 sm:-inset-y-7 md:-inset-x-14 md:-inset-y-8 md:bg-white/92"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-x-4 -inset-y-3 -z-10 bg-gradient-to-t from-white via-white/95 to-white/70 sm:-inset-x-8 sm:-inset-y-4"
            aria-hidden
          />

          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-600 sm:text-[11px]">
            Tienda en línea · Personal shopper
          </p>
          <h1
            id="store-hero-intro-heading"
            className="mt-2.5 text-[clamp(1.75rem,5.5vw,2.55rem)] font-semibold leading-[1.1] tracking-tight text-stone-900 [text-shadow:0_1px_0_rgba(255,255,255,0.9)]"
          >
            María Paz Imports
          </h1>
          <p className="mt-3 max-w-[22rem] text-[13px] leading-snug text-stone-700 sm:text-[15px]">
            Productos entrega inmediata y encargos
          </p>
          <p className="mt-4 text-center text-[11px] font-semibold uppercase leading-snug tracking-[0.1em] text-stone-800 sm:text-[12px] sm:tracking-[0.12em]">
            <span className="block whitespace-nowrap">
              {storeTaglineLines[0]}
            </span>
            <span className="block whitespace-nowrap">
              {storeTaglineLines[1]}
            </span>
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex w-full max-w-[15.5rem] items-center justify-center bg-stone-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_28px_-12px_rgba(0,0,0,0.45)] transition hover:bg-stone-800 active:scale-[0.98]"
          >
            Ver tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
