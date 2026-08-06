"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Link al home con overlay de carga para que se note que la tienda está cargando.
 */
export function StoreHomeLogoLink({ children, className }: Props) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  return (
    <>
      <Link
        href="/"
        className={className}
        onClick={() => {
          if (pathname === "/") return;
          setPending(true);
        }}
        aria-busy={pending || undefined}
      >
        {children}
      </Link>
      {pending ? (
        <StoreLoadingScreen label="Cargando la tienda…" overlay />
      ) : null}
    </>
  );
}
