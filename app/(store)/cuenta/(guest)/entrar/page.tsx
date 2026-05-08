import Link from "next/link";
import { Suspense } from "react";
import { StoreLoginForm } from "@/components/store/StoreLoginForm";

export const metadata = {
  title: "Iniciar sesión · Mi cuenta",
};

export default function CuentaEntrarPage() {
  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
        Iniciar sesión
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Entra con tu correo para ver tus pedidos y direcciones guardadas.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <StoreLoginForm />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-stone-600">
        ¿No tienes cuenta?{" "}
        <Link
          href="/cuenta/registro"
          className="font-medium text-[var(--store-accent)] underline decoration-stone-300 underline-offset-4 hover:text-[var(--store-accent-hover)]"
        >
          Regístrate
        </Link>
      </p>
      <p className="mt-4 text-center text-sm">
        <Link
          href="/"
          className="text-stone-500 underline decoration-stone-200 underline-offset-4 hover:text-stone-800"
        >
          ← Volver a la tienda
        </Link>
      </p>
    </div>
  );
}
