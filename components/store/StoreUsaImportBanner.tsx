import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import { RevealOnScroll } from "@/components/store/RevealOnScroll";
import { storeShellClass } from "@/lib/store-layout";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const USA_FLAG_IMAGE = "/mpi/usa-flag.jpg";

/** Franja de origen: María Paz importa desde USA. */
export function StoreUsaImportBanner() {
  return (
    <section
      className="relative isolate overflow-hidden bg-black"
      aria-labelledby="usa-import-heading"
    >
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={USA_FLAG_IMAGE}
          alt=""
          fill
          sizes="100vw"
          className="store-usa-flag-drift object-cover object-[center_40%]"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
      </div>

      <div
        className={`${storeShellClass} relative flex min-h-[16rem] items-center py-14 sm:min-h-[20rem] sm:py-20 lg:min-h-[22rem] lg:py-24`}
      >
        <RevealOnScroll className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
            María Paz Imports
          </p>
          <h2
            id="usa-import-heading"
            className={`${display.className} mt-3 text-[2.15rem] font-medium leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]`}
          >
            Importamos desde{" "}
            <span className="italic font-normal">Estados Unidos</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80 sm:mt-5 sm:text-base">
            María Paz selecciona e importa productos 100% originales desde USA
            para Colombia — con precios justos y la confianza de saber de dónde
            vienen.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
