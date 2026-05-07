import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/LoginForm";
import { productSectionTitle } from "@/components/admin/product-form-primitives";
export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[var(--admin-sidebar-bg)] text-zinc-900 antialiased">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex flex-col items-center justify-center border-b border-stone-200/80 px-6 py-10 sm:py-12 lg:w-1/2 lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
          <Link
            href="/"
            className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <Image
              src="/logobackoficce.png"
              alt="Backoffice"
              width={280}
              height={120}
              className="h-auto w-full max-w-[220px] object-contain transition duration-300 group-hover:opacity-90 sm:max-w-[260px] lg:max-w-[280px]"
              priority
            />
          </Link>
          <p className={`${productSectionTitle} mt-6`}>Backoffice</p>
          <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-zinc-600">
            Gestioná inventario, ventas y clientes desde un solo lugar.
          </p>
          <div className="mt-8 flex gap-1.5" aria-hidden>
            <span className="size-1.5 rounded-full bg-zinc-400/40" />
            <span className="size-1.5 rounded-full bg-zinc-500/55" />
            <span className="size-1.5 rounded-full bg-zinc-400/40" />
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:py-16">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Iniciar sesión
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Entrá con tu cuenta para continuar al panel.
              </p>

              <div className="mt-8">
                <Suspense fallback={null}>
                  <AdminLoginForm />
                </Suspense>
              </div>

              <p className="mt-8 text-center text-sm text-zinc-600">
                <Link
                  href="/"
                  className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-900"
                >
                  ← Volver a la tienda
                </Link>
              </p>
            </div>

            <p className="mt-5 text-center text-xs font-medium text-zinc-500">
              Solo personal autorizado
              <span className="text-zinc-400" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="text-zinc-500/90">
                Powered by{" "}
                <span className="font-semibold text-zinc-600">programamos</span>
              </span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
