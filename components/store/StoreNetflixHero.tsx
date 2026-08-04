import Image from "next/image";
import Link from "next/link";
import { MPI_HERO_IMAGES } from "@/lib/mpi-hero-images";
import { StoreLogo } from "@/components/store/StoreLogo";

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

export function StoreNetflixHero() {
  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-[#eceae6]"
      aria-label="Presentación María Paz Imports"
    >
      {/* Collage animado — filas verticales en marquee horizontal */}
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

      {/* Velos para legibilidad del header y transición al contenido */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(38vh,18rem)] bg-gradient-to-b from-white/90 via-white/45 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(42vh,22rem)] bg-gradient-to-t from-white via-white/80 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(255,255,255,0.35)_100%)]"
        aria-hidden
      />

      {/* Copy + CTA sobre el collage */}
      <div className="relative z-[2] mx-auto flex min-h-[100svh] max-w-xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center sm:pb-20 sm:pt-32">
        <h1 className="sr-only">María Paz Imports</h1>
        <StoreLogo variant="hero" priority className="mx-auto" />

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-900 sm:mt-7 sm:text-xs sm:tracking-[0.18em]">
          Tienda online · Personal shopper
        </p>
        <p className="mt-2 text-[13px] font-medium leading-snug text-stone-800 sm:text-sm">
          Productos entrega inmediata y encargos
        </p>

        <p className="mt-7 max-w-sm text-[13px] font-semibold uppercase leading-snug tracking-[0.1em] text-stone-900 sm:mt-8 sm:text-sm sm:tracking-[0.12em]">
          Encontramos lo extraordinario para ti
        </p>

        <Link
          href="/products"
          className="mt-8 inline-flex border border-stone-900 bg-stone-900 px-10 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-stone-900 sm:mt-9"
        >
          Ver catálogo
        </Link>
      </div>
    </section>
  );
}
