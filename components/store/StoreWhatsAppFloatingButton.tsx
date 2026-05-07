"use client";

import { MessageCircle } from "lucide-react";
import {
  storeSupportPhone,
  storeWhatsAppPrefilledText,
  storeWhatsAppUrl,
} from "@/lib/brand";

export function StoreWhatsAppFloatingButton() {
  const href =
    storeWhatsAppUrl === "#"
      ? "#"
      : `${storeWhatsAppUrl}?text=${encodeURIComponent(storeWhatsAppPrefilledText)}`;

  if (href === "#") return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_-8px_rgba(0,0,0,0.35)] transition hover:brightness-95 sm:bottom-6 sm:right-6"
      aria-label={`Escribir por WhatsApp a ${storeSupportPhone}`}
    >
      <MessageCircle className="size-4" />
      WhatsApp
    </a>
  );
}
