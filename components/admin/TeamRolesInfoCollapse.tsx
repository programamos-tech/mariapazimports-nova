"use client";

import { useState } from "react";

export function TeamRolesInfoCollapse({ storeLabel }: { storeLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 md:px-6"
        aria-expanded={open}
      >
        <span>Quién puede hacer qué en {storeLabel}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-5 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-2 text-sm leading-relaxed text-zinc-600 md:px-6">
          <p>
            Los <strong className="text-zinc-800">dueños</strong> tienen acceso completo. Los{" "}
            <strong className="text-zinc-800">cajeros</strong> registran ventas y caja con permisos
            acotados. El rol <strong className="text-zinc-800">apoyo</strong> sirve para quien
            refuerza inventario u operación sin ser el titular; partís del paquete sugerido y afinás
            permisos en cada ficha.
          </p>
          <p className="mt-3">
            Los permisos se guardan por colaborador; podés ajustarlos y usar{" "}
            <strong className="text-zinc-800">Restaurar por rol</strong> para volver al paquete
            sugerido del rol elegido.
          </p>
        </div>
      ) : null}
    </div>
  );
}
