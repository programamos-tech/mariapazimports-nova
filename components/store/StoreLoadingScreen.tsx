import Image from "next/image";
import { storeBrand } from "@/lib/brand";

type Props = {
  /** z-index por encima del resto (splash de entrada usa uno más alto que `loading.tsx`) */
  overlayZClass?: string;
};

/**
 * Marca visual de carga: mismo fondo que navbar (fila principal) + footer (`--store-chrome-bg`).
 */
export function StoreLoadingScreen({
  overlayZClass = "z-[200]",
}: Props) {
  return (
    <div
      className={`store-loading-screen fixed inset-0 ${overlayZClass} flex flex-col items-center justify-center px-6`}
      style={{ backgroundColor: "var(--store-chrome-bg)" }}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="store-loading-glow pointer-events-none absolute left-1/2 top-[42%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6b7f6a]/20 blur-3xl sm:h-72 sm:w-72"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="store-loading-logo">
          <Image
            src="/logobackoficce.png"
            alt=""
            width={400}
            height={171}
            className="h-24 w-auto max-w-[min(88vw,300px)] object-contain drop-shadow-[0_8px_24px_rgba(41,37,36,0.08)] sm:h-28 sm:max-w-[min(88vw,340px)]"
            priority
          />
        </div>

        <div className="mt-8 flex items-center gap-2" aria-hidden>
          <span className="store-loading-dot block size-2 rounded-full bg-[#6b7f6a]" />
          <span className="store-loading-dot block size-2 rounded-full bg-[#6b7f6a]" />
          <span className="store-loading-dot block size-2 rounded-full bg-[#6b7f6a]" />
        </div>
      </div>

      <span className="sr-only">Cargando {storeBrand}</span>
    </div>
  );
}
