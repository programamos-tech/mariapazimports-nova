"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  closeHref: string;
  children: React.ReactNode;
};

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-modal-title"
    >
      <Link
        href={closeHref}
        className="absolute inset-0 z-0"
        aria-label="Cerrar categorías"
        scroll={false}
      />
      <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xl shadow-zinc-950/10 ring-1 ring-zinc-950/5">
        <Link
          href={closeHref}
          scroll={false}
          className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Cerrar"
        >
          <span className="sr-only">Cerrar</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
          {children}
        </div>
      </div>
    </div>
  );
}
