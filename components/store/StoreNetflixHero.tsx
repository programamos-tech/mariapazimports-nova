import Image from "next/image";
import Link from "next/link";
import { MPI_HERO_IMAGES } from "@/lib/mpi-hero-images";

const ROWS: { direction: "left" | "right"; durationSec: number; offset: number }[] =
  [
    { direction: "left", durationSec: 55, offset: 0 },
    { direction: "right", durationSec: 68, offset: 2 },
    { direction: "left", durationSec: 48, offset: 4 },
  ];

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
    <div className="relative aspect-[2/3] w-[8.5rem] shrink-0 overflow-hidden rounded-xl bg-stone-200 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:w-[10.5rem] md:w-[12.5rem] lg:w-[14rem]">
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 640px) 136px, (max-width: 768px) 168px, (max-width: 1024px) 200px, 224px"
        className="object-cover object-center"
      />
    </div>
  );
}

/**
 * Hero en dos planos claros:
 * 1) Collage (solo fotos)
 * 2) Panel blanco opaco (solo texto) — sin superposición.
 */
export function StoreNetflixHero() {
  return (
    <section
      className="relative isolate w-full bg-white"
      aria-label="Presentación María Paz Imports"
    >
      {/* 1. Collage */}
      <div className="relative h-[48svh] overflow-hidden bg-[#e8e6e2] sm:h-[52svh] lg:h-[56svh]">
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5 py-8 sm:gap-3.5 sm:py-10 lg:gap-4"
          aria-hidden
        >
          <div className="flex origin-center scale-[1.12] -rotate-[3.5deg] flex-col gap-2.5 sm:gap-3.5 lg:gap-4">
            {ROWS.map((row, rowIdx) => {
              const imgs = rowImages(row.offset);
              const animClass =
                row.direction === "left"
                  ? "store-mpi-marquee-left"
                  : "store-mpi-marquee-right";
              return (
                <div key={rowIdx} className="overflow-hidden">
                  <div
                    className={`flex w-max gap-2.5 sm:gap-3.5 ${animClass}`}
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
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-white to-transparent sm:h-28"
          aria-hidden
        />
      </div>

      {/* 2. Mensaje — blanco 100%, sin overlap con fotos */}
      <div className="border-t border-stone-100 bg-white px-6 py-12 text-center sm:px-8 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="sr-only">María Paz Imports</h1>

          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
            Tienda online · Personal shopper
          </p>

          <p className="font-store-display mt-5 text-[2rem] font-semibold leading-[1.1] tracking-tight text-stone-900 sm:mt-6 sm:text-5xl lg:text-[3.25rem]">
            Encontramos lo extraordinario para ti
          </p>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-stone-600 sm:mt-6 sm:text-lg">
            Productos con entrega inmediata y encargos.
            <br className="hidden sm:block" />
            Curaduría personalizada para elegir lo mejor para vos.
          </p>

          <Link
            href="/products"
            className="mt-9 inline-flex bg-stone-900 px-12 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-800 sm:mt-10"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
