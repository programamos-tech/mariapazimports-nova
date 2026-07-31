"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Envoltorio del header: en home flota transparente sobre el hero Netflix. */
export function StoreHeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overlay = pathname === "/";

  return (
    <header
      data-home-overlay={overlay ? "true" : undefined}
      className={
        overlay
          ? "group/header absolute inset-x-0 top-0 z-50 min-w-0 overflow-x-clip border-b border-stone-200/90 bg-white"
          : "group/header relative z-40 min-w-0 overflow-x-clip border-b border-stone-200/90 bg-white"
      }
    >
      {children}
    </header>
  );
}
