"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "tiendas_account_bday_banner_dismissed";

function readDismissedFromStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Franja superior estilo boutique (sin persistencia de fecha en servidor aún). */
export function StoreAccountBirthdayBanner() {
  const [localDismissed, setLocalDismissed] = useState(false);
  const storedDismissed = useSyncExternalStore(
    () => () => {},
    readDismissedFromStorage,
    () => false,
  );

  if (storedDismissed || localDismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setLocalDismissed(true);
  }

  return (
    <div className="relative border-b border-stone-200/80 bg-[#f4f4f3]">
      <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-6 px-4 py-6 sm:flex-row sm:items-center sm:gap-10 sm:px-6 lg:px-8">
        <div className="relative mx-auto h-20 w-28 shrink-0 sm:mx-0 sm:h-24 sm:w-32">
          <Image
            src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-900">
            Agrega tu cumpleaños
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Cuéntanos tu fecha y te saludamos cada año con algo especial.
          </p>
          <p className="mt-3 text-xs text-stone-500">
            Pronto podrás guardarlo en tu perfil; por ahora escríbenos por
            WhatsApp si quieres dejarlo registrado.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end">
          <button
            type="button"
            disabled
            className="border border-stone-300 bg-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400"
          >
            Actualizar
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 flex size-8 items-center justify-center text-stone-500 transition hover:text-stone-900 sm:right-4 sm:top-4"
          aria-label="Cerrar"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
