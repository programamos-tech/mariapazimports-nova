"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  storeWelcomeDiscountCode,
  storeWelcomeDiscountMessage,
} from "@/lib/brand";

const DISMISS_KEY = "tiendas_welcome_discount_dismissed_v1";

export function StoreWelcomeDiscountBanner() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    setVisible(!dismissed);
    setReady(true);
  }, []);

  const close = () => {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!ready || !visible) return null;

  return (
    <div className="border-b border-[#e6dfd2] bg-[#fff7eb]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <p className="min-w-0 text-sm text-stone-700">
          <span className="font-semibold text-[#3d5240]">{storeWelcomeDiscountMessage}</span>
          <span className="ml-2 inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#556654] ring-1 ring-[#d9d2c7]">
            {storeWelcomeDiscountCode}
          </span>
        </p>
        <button
          type="button"
          onClick={close}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-white/80 hover:text-stone-700"
          aria-label="Cerrar banner de descuento"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
