"use client";

import { syncStoreCustomerFromSession } from "@/app/actions/store-customer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { friendlyStoreAuthError } from "@/components/store/store-auth-shared";

const labelClass = "mb-2 block text-sm font-medium text-stone-800";
const inputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--store-accent)]/20";

export function StoreLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const supabase = createSupabaseBrowserClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signErr) {
      setLoading(false);
      setError(friendlyStoreAuthError(signErr.message));
      return;
    }

    await syncStoreCustomerFromSession();
    setLoading(false);

    const safeNext =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/cuenta";
    router.replace(safeNext);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className={labelClass}>Correo electrónico</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Tu contraseña"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-full bg-[var(--store-accent)] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--store-accent-hover)] disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
