import Image from "next/image";
import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import { MPI_HERO_IMAGES } from "@/lib/mpi-hero-images";

const heroSignature = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
 * sobre un difuminado inferior (sin cuadro).
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

      {/* Velo superior suave (logo / header) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(22vh,10rem)] bg-gradient-to-b from-white/80 via-white/25 to-transparent"
        aria-hidden
      />

      {/* Difuminado inferior blanco: se une con la sección siguiente */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(58vh,28rem)] sm:h-[min(52vh,30rem)]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 via-35% to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_35%,transparent_85%)]" />
      </div>

      <div className="relative z-[2] flex min-h-[100svh] flex-col items-center justify-end px-5 pb-[max(5.5rem,10vh)] pt-[max(6.5rem,18vw)] sm:px-8 sm:pb-[max(6rem,11vh)]">
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center sm:max-w-lg">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 sm:text-[11px] sm:tracking-[0.24em]">
            Tienda en línea · Personal shopper
          </p>
          <h1
            id="store-hero-intro-heading"
            className="mt-3 text-[clamp(1.85rem,7vw,2.65rem)] font-semibold leading-[1.1] tracking-tight text-stone-900"
          >
            María Paz Imports
          </h1>
          <p className="mx-auto mt-3 max-w-[22rem] text-[13px] leading-relaxed text-stone-600 sm:mt-4 sm:text-[14px]">
            Productos con entrega inmediata y por encargo.
          </p>
          <p
            className={`${heroSignature.className} mt-3 text-[clamp(1.55rem,5.5vw,2.15rem)] leading-tight text-stone-800 sm:mt-4`}
          >
            Encontramos lo extraordinario para ti
          </p>

          <Link
            href="/products"
            className="mt-6 inline-flex w-full max-w-[16rem] items-center justify-center bg-stone-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-800 active:scale-[0.98] sm:mt-7 sm:max-w-[17rem]"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
