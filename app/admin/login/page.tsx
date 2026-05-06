import Link from "next/link";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/LoginForm";
import { StoreBrandMark } from "@/components/store/StoreBrandMark";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            Administración
          </p>
          <div className="mt-2">
            <StoreBrandMark href="/" />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-zinc-600">
          Ingresá con tu usuario de{" "}
          <span className="font-medium text-zinc-900">Supabase Auth</span>.
          Tiene que existir una fila en{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800 ring-1 ring-zinc-200/80">
            public.profiles
          </code>{" "}
          con rol admin.
        </p>
        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
        <p className="text-center text-sm text-zinc-500">
          <Link
            href="/"
            className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
          >
            Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
