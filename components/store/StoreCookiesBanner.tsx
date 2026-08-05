"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bereaSignaturePath, storeBrand } from "@/lib/brand";
import { storeShellClass } from "@/lib/store-layout";

const CONSENT_KEY = "tiendas_cookie_consent_v1";

type Consent = "accepted" | "rejected";

const btnPrimary =
  "border border-stone-900 bg-stone-900 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-stone-800";

const btnSecondary =
  "border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-800 transition hover:border-stone-900 hover:bg-stone-50";

const legalLink =
  "font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 hover:decoration-stone-500";

export function StoreCookiesBanner() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY) as Consent | null;
    setVisible(saved !== "accepted" && saved !== "rejected");
    setReady(true);
  }, []);

  const save = (value: Consent) => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  if (!ready || !visible) return null;

  return (
    <aside
      className="store-cookies-banner-panel fixed inset-x-0 bottom-0 z-[70] border-t border-stone-200/90 bg-white shadow-[0_-8px_32px_-12px_rgba(41,37,36,0.12)]"
      role="dialog"
      aria-labelledby="store-cookies-title"
      aria-describedby="store-cookies-desc"
    >
      <div className={`${storeShellClass} py-4 sm:py-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <p
              id="store-cookies-title"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900"
            >
              Cookies y datos personales
            </p>
            <p
              id="store-cookies-desc"
              className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600"
            >
              En {storeBrand} usamos cookies y almacenamiento local para tu bolsa,
              sesión y preferencias. Podés aceptar todas o continuar solo con las
              esenciales.
            </p>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
              <Link href="/cookies" className={legalLink}>
                Política de cookies
              </Link>
              <span className="text-stone-300" aria-hidden>
                ·
              </span>
              <Link href="/privacidad" className={legalLink}>
                Privacidad
              </Link>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:shrink-0">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => save("accepted")} className={btnPrimary}>
                Aceptar
              </button>
              <button
                type="button"
                onClick={() => save("rejected")}
                className={btnSecondary}
              >
                Solo esenciales
              </button>
            </div>
            <div className="flex items-center gap-2.5 border-stone-200 sm:border-l sm:pl-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                Sitio por
              </span>
              <Image
                src={bereaSignaturePath}
                alt="Berea House"
                width={680}
                height={319}
                className="h-7 w-auto max-w-[5.5rem] object-contain object-left opacity-80 sm:h-8 sm:max-w-[6.5rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
