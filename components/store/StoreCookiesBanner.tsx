"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "tiendas_cookie_consent_v1";

type Consent = "accepted" | "rejected";

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
      className="fixed inset-x-3 bottom-3 z-[70] rounded-xl border border-stone-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-md"
      role="dialog"
      aria-label="Preferencias de cookies"
    >
      <p className="text-sm font-semibold text-stone-900">Cookies en la tienda</p>
      <p className="mt-1 text-xs leading-relaxed text-stone-600">
        Usamos cookies para guardar tu bolsa de compras y preferencias de navegación.
        Podés aceptar o continuar solo con las esenciales.{" "}
        <Link
          href="/cookies"
          className="font-medium text-stone-800 underline underline-offset-2 hover:no-underline"
        >
          Más sobre cookies
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => save("accepted")}
          className="rounded-full bg-[#6b7f6a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5c6e5b]"
        >
          Aceptar
        </button>
        <button
          type="button"
          onClick={() => save("rejected")}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          Solo esenciales
        </button>
      </div>
    </aside>
  );
}
