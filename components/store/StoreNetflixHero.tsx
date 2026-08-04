import Image from "next/image";
import Link from "next/link";
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
 * Hero editorial: collage full-bleed arriba + franja blanca de mensaje abajo.
 * El texto nunca se monta sobre las fotos → legible y pro.
 */
export function StoreNetflixHero() {
  return (
    <section
      className="relative isolate flex min-h-[100svh] w-full flex-col bg-white"
      aria-label="Presentación María Paz Imports"
    >
      {/* Collage — solo imagen */}
      <div className="relative min-h-[52svh] flex-1 overflow-hidden bg-[#eceae6] sm:min-h-[56svh]">
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 py-10 sm:gap-4 sm:py-14 lg:gap-5"
          aria-hidden
        >
          <div className="flex origin-center scale-[1.1] -rotate-[4deg] flex-col gap-3 sm:gap-4 lg:gap-5">
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

        {/* Velo superior (header) + fundido al panel blanco */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(28vh,12rem)] bg-gradient-to-b from-white via-white/55 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-white via-white/90 to-transparent sm:h-36"
          aria-hidden
        />
      </div>

      {/* Mensaje — superficie blanca sólida */}
      <div className="relative z-[2] -mt-6 bg-white px-6 pb-12 pt-2 text-center sm:-mt-8 sm:pb-14 sm:pt-3">
        <div className="mx-auto max-w-xl">
          <h1 className="sr-only">María Paz Imports</h1>

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500 sm:text-[11px]">
            Tienda online · Personal shopper
          </p>

          <p className="font-store-display mt-4 text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-stone-900 sm:mt-5 sm:text-4xl md:text-[2.65rem]">
            Encontramos lo extraordinario para ti
          </p>

          <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-stone-600 sm:mt-5 sm:text-[15px]">
            Productos con entrega inmediata y encargos. Curaduría personalizada
            y asesoría para elegir lo mejor para vos.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex border border-stone-900 bg-stone-900 px-11 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-stone-900 sm:mt-9"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
