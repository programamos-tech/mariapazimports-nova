"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { StoreRegisterForm } from "@/components/store/StoreRegisterForm";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Tras registro con sesión inmediata (sin confirmar email). */
  onRegistered: () => void;
};

export function StoreRegisterModal({ open, onClose, onRegistered }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("input")?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          aria-label="Cerrar"
        >
          <span aria-hidden className="text-xl leading-none">
            ×
          </span>
        </button>

        <h1
          id={titleId}
          className="pr-10 text-2xl font-semibold tracking-tight text-stone-900"
        >
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Regístrate con tu correo para guardar direcciones y seguir tus pedidos.
        </p>

        <div className="mt-8">
          <StoreRegisterForm onSuccess={onRegistered} />
        </div>

        <p className="mt-8 text-center text-sm text-stone-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/cuenta/entrar"
            onClick={onClose}
            className="font-medium text-[var(--store-accent)] underline decoration-stone-300 underline-offset-4 hover:text-[var(--store-accent-hover)]"
          >
            Iniciar sesión
          </Link>
        </p>
        <p className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 underline decoration-stone-200 underline-offset-4 transition hover:text-stone-800"
          >
            ← Volver a la tienda
          </button>
        </p>
      </div>
    </div>
  );
}
