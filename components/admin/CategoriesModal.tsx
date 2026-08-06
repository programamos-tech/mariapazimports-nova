"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  closeHref: string;
  children: React.ReactNode;
};

/**
 * Overlay centrado en el área de trabajo (a la derecha del sidebar en desktop).
 */
export function CategoriesModal({ closeHref, children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [closeHref, router]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:left-64"
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-modal-title"
    >
      <Link
        href={closeHref}
        className="absolute inset-0 z-0 bg-zinc-950/50 backdrop-blur-[2px] transition-opacity"
        aria-label="Cerrar categorías"
        scroll={false}
      />
      <div
        className="categories-modal-panel relative z-10 flex h-[min(92vh,880px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl ring-1 ring-zinc-950/10"
      >
        <Link
          href={closeHref}
          scroll={false}
          className="absolute right-3 top-3 z-20 inline-flex size-10 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95"
          aria-label="Cerrar"
        >
          <span className="sr-only">Cerrar</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Link>
        <div className="store-cart-drawer-body-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
