import type { SVGProps } from "react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { storeBrand, storeSupportPhone } from "@/lib/brand";
import { StoreNavDropdowns } from "@/components/store/StoreNavDropdowns";
import { StoreSearch } from "@/components/store/StoreSearch";

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export async function StoreHeader() {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  const productCount = count ?? 0;

  return (
    <header className="border-b border-stone-200/80 bg-white">
      {/* Top utility bar */}
      <div className="bg-[#e8e6e1] text-stone-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:text-sm">
          <span className="font-medium text-stone-700">{storeSupportPhone}</span>
          <p className="order-3 w-full text-center sm:order-none sm:w-auto">
            <span className="text-stone-700">Hasta 50% en seleccionados</span>{" "}
            <Link href="/products" className="font-semibold text-[#6b7f6a] underline decoration-[#6b7f6a]/40 underline-offset-2 hover:text-[#556654]">
              Comprar ahora
            </Link>
          </p>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white/70 px-2 py-0.5 text-stone-600">ES</span>
            <span className="rounded-md bg-white/70 px-2 py-0.5 text-stone-600">CO</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-4 lg:gap-8">
            <Link
              href="/"
              className="shrink-0 text-lg font-semibold tracking-tight text-stone-900 sm:text-xl"
            >
              {storeBrand}
            </Link>
            <StoreNavDropdowns productCount={productCount} />
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3 lg:max-w-xl">
            <StoreSearch />
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900"
            >
              <IconUser className="size-5" />
              <span className="hidden sm:inline">Cuenta</span>
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-stone-600 hover:bg-[#f4f0ea] hover:text-stone-900"
            >
              <IconCart className="size-5" />
              <span className="hidden sm:inline">Carrito</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
