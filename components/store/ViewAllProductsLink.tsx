"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Prefetch de /products en cuanto aparece el CTA desde destacados. */
export function ViewAllProductsLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/products");
  }, [router]);

  return (
    <Link href="/products" prefetch className={className}>
      {children}
    </Link>
  );
}
