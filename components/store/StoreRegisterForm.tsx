"use client";

import { syncStoreCustomerFromSession } from "@/app/actions/store-customer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { friendlyStoreAuthError } from "@/components/store/store-auth-shared";
import { normalizeDocumentIdForMatch } from "@/lib/normalize-document-id";

const labelClass = "mb-2 block text-sm font-medium text-stone-800";
const defaultInputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--store-accent)]/20";
const defaultSubmitClass =
  "mt-2 w-full rounded-full bg-[var(--store-accent)] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--store-accent-hover)] disabled:opacity-60";

export function StoreRegisterForm({
  onSuccess,
  inputClassName = defaultInputClass,
  submitButtonClassName = defaultSubmitClass,
}: {
  onSuccess?: () => void;
  inputClassName?: string;
  submitButtonClassName?: string;
} = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value
      .trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
      .trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const documentRaw = (
      form.elements.namedItem("documentId") as HTMLInputElement
    ).value.trim();

    if (!name) {
      setLoading(false);
      setError("Ingresa tu nombre.");
      return;
    }

    const documentNorm = normalizeDocumentIdForMatch(documentRaw);
    if (!documentNorm) {
      setLoading(false);
      setError(
        "Ingresa tu cédula o documento (solo números, mínimo 6 dígitos). Así vinculamos tu historial si ya compraste en la tienda.",
      );
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, document_id: documentNorm },
      },
    });

    if (signErr) {
      setLoading(false);
      setError(friendlyStoreAuthError(signErr.message));
      return;
    }

    if (data.session) {
      await syncStoreCustomerFromSession();
      setLoading(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace("/cuenta");
        router.refresh();
      }
      return;
    }

    setLoading(false);
    setInfo(
      "Te enviamos un correo para confirmar la cuenta. Cuando lo confirmes, puedes iniciar sesión.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800">
          {info}
        </p>
      ) : null}
      <label className="block">
        <span className={labelClass}>Nombre</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Cómo te llamamos"
          className={inputClassName}
        />
      </label>
      <label className="block">
        <span className={labelClass}>
          Cédula de ciudadanía o documento{" "}
          <span className="font-normal text-stone-500">(obligatorio)</span>
        </span>
        <input
          name="documentId"
          type="text"
          required
          autoComplete="off"
          inputMode="numeric"
          placeholder="Sin puntos ni guiones, ej. 1234567890"
          className={inputClassName}
        />
        <p className="mt-1.5 text-xs text-stone-500">
          Lo usamos para identificarte si ya existís como cliente manual o por
          ventas en tienda: vas a ver el mismo historial de pedidos en tu cuenta.
        </p>
      </label>
      <label className="block">
        <span className={labelClass}>Correo electrónico</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className={inputClassName}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className={inputClassName}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className={submitButtonClassName}
      >
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
