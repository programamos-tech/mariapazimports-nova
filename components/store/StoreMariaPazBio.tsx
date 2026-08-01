"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Cormorant_Garamond } from "next/font/google";
import { MPI_BIO_VIDEOS } from "@/lib/mpi-bio-videos";
import { storeShellClass } from "@/lib/store-layout";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const BIO_PARAGRAPHS = [
  "Soy Ingeniera Civil de profesión y fundadora de María Paz Imports.",
  "Siempre me han apasionado las ventas, descubrir las mejores ofertas y encontrar productos que realmente valen la pena. Esa pasión me llevó a crear esta tienda con un propósito muy claro: acercar a Colombia productos 100 % originales de Estados Unidos con precios justos y una experiencia de compra en la que puedas confiar.",
  "En María Paz Imports cada producto es seleccionado cuidadosamente y cada cliente es atendido con dedicación, porque creo que los pequeños detalles hacen la diferencia.",
  "Gracias por estar aquí y por confiar en mi tienda. Será un gusto acompañarte en cada compra.",
] as const;

/** Crossfade entre dos instancias del mismo clip para un loop sin salto. */
function SeamlessLoopVideo({ src, active }: { src: string; active: boolean }) {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const frontIsARef = useRef(true);
  const swapping = useRef(false);
  const [frontIsA, setFrontIsA] = useState(true);

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    for (const el of [a, b]) {
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.loop = false;
    }

    if (!active) {
      a.pause();
      b.pause();
      return;
    }

    swapping.current = false;
    frontIsARef.current = true;
    setFrontIsA(true);
    try {
      a.currentTime = 0;
    } catch {
      /* ignore */
    }
    void a.play().catch(() => {});

    const FADE_BEFORE_END = 0.32;

    const onTimeUpdate = (ev: Event) => {
      const front = ev.currentTarget as HTMLVideoElement;
      const isA = front === a;
      if (frontIsARef.current !== isA) return;
      if (!Number.isFinite(front.duration) || front.duration <= 0) return;
      if (swapping.current) return;
      if (front.currentTime < front.duration - FADE_BEFORE_END) return;

      const back = isA ? b : a;
      swapping.current = true;
      try {
        back.currentTime = 0;
      } catch {
        /* ignore */
      }
      void back.play().catch(() => {});
      frontIsARef.current = !isA;
      setFrontIsA(!isA);

      window.setTimeout(() => {
        front.pause();
        swapping.current = false;
      }, 340);
    };

    const onEnded = (ev: Event) => {
      const ended = ev.currentTarget as HTMLVideoElement;
      const other = ended === a ? b : a;
      if (!active) return;
      if (other.paused || other.ended) {
        try {
          other.currentTime = 0;
        } catch {
          /* ignore */
        }
        void other.play().catch(() => {});
        const nextFrontIsA = ended === b;
        frontIsARef.current = nextFrontIsA;
        setFrontIsA(nextFrontIsA);
        swapping.current = false;
      }
    };

    a.addEventListener("timeupdate", onTimeUpdate);
    b.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("ended", onEnded);
    b.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("timeupdate", onTimeUpdate);
      b.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("ended", onEnded);
      b.removeEventListener("ended", onEnded);
      a.pause();
      b.pause();
    };
  }, [src, active]);

  const layer =
    "absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out";

  return (
    <>
      <video
        ref={aRef}
        src={src}
        className={`${layer} ${frontIsA ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <video
        ref={bRef}
        src={src}
        className={`${layer} ${frontIsA ? "opacity-0" : "opacity-100"}`}
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
    </>
  );
}

function RevealLine({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const onIntersect = useEffectEvent((entry: IntersectionObserverEntry) => {
    if (entry.isIntersecting) setVisible(true);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) onIntersect(entry);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`store-bio-reveal ${visible ? "store-bio-reveal-in" : ""} ${className}`.trim()}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function VideoFrame({
  src,
  active,
  className = "",
}: {
  src: string;
  active: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/16] overflow-hidden bg-stone-300 ${className}`.trim()}
    >
      <SeamlessLoopVideo src={src} active={active} />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/20 via-transparent to-white/5"
        aria-hidden
      />
    </div>
  );
}

/** Bio cinematográfica: filmstrip vertical en loop + carta de María Paz. */
export function StoreMariaPazBio() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  const onSection = useEffectEvent((entry: IntersectionObserverEntry) => {
    setActive(entry.isIntersecting);
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) onSection(entry);
      },
      { rootMargin: "120px 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden border-y border-stone-200/80 bg-[#f6f4f1]"
      aria-labelledby="mpi-bio-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 store-bio-grain opacity-[0.35]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent"
        aria-hidden
      />

      {/* Filmstrip a ancho completo, 4 clips pegados y más grandes */}
      <div className="relative mt-14 w-full sm:mt-16 lg:mt-20">
        <div className="hidden md:grid md:grid-cols-4">
          {MPI_BIO_VIDEOS.map((src, i) => (
            <RevealLine key={src} delayMs={70 + i * 80}>
              <VideoFrame src={src} active={active} />
            </RevealLine>
          ))}
        </div>

        <div className="grid grid-cols-2 md:hidden">
          {MPI_BIO_VIDEOS.map((src, i) => (
            <RevealLine key={src} delayMs={50 + i * 60}>
              <VideoFrame src={src} active={active} />
            </RevealLine>
          ))}
        </div>
      </div>

      <div className={`${storeShellClass} relative pb-14 pt-12 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20`}>
        <div className="mx-auto max-w-2xl text-center">
          <RevealLine delayMs={60}>
            <h2
              id="mpi-bio-heading"
              className={`${display.className} text-[2.15rem] font-medium leading-[1.12] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.35rem]`}
            >
              Hola, soy{" "}
              <span className="italic font-normal text-stone-800">
                María Paz Estrada
              </span>
              .
            </h2>
          </RevealLine>

          <div className="mt-8 space-y-5 text-left sm:mt-10 sm:space-y-6 sm:text-center">
            {BIO_PARAGRAPHS.map((p, i) => (
              <RevealLine key={p.slice(0, 24)} delayMs={100 + i * 70}>
                <p
                  className={
                    i === 0
                      ? `${display.className} text-xl leading-snug text-stone-800 sm:text-2xl`
                      : "text-[15px] leading-relaxed text-stone-600 sm:text-base sm:leading-relaxed"
                  }
                >
                  {p}
                </p>
              </RevealLine>
            ))}
          </div>

          <RevealLine
            delayMs={420}
            className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:mt-12"
          >
            <Link
              href="/quien-soy"
              className="inline-flex border border-stone-900 bg-stone-900 px-8 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-stone-900"
            >
              Conocerme más
            </Link>
            <Link
              href="/products"
              className="inline-flex border border-stone-900 bg-transparent px-8 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              Ver la tienda
            </Link>
          </RevealLine>
        </div>
      </div>
    </section>
  );
}
