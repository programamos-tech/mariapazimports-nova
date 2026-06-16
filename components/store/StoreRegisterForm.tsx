"use client";

import { registerStoreCustomer } from "@/app/actions/store-register";
import { syncStoreCustomerFromSession } from "@/app/actions/store-customer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";
import { friendlyStoreAuthError } from "@/components/store/store-auth-shared";
import {
  storeAuthFormErrorClass,
  storeAuthFormHintClass,
  storeAuthFormInputClass,
  storeAuthFormLabelClass,
  storeAuthFormPrimaryBtnClass,
} from "@/components/store/store-auth-form-primitives";
import { normalizeDocumentIdForMatch, emailConflictsWithDocument } from "@/lib/normalize-document-id";

export function StoreRegisterForm({
  onSuccess,
  inputClassName = storeAuthFormInputClass,
  submitButtonClassName = storeAuthFormPrimaryBtnClass,
}: {
  onSuccess?: () => void;
  inputClassName?: string;
  submitButtonClassName?: string;
} = {}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function completeStoreSignIn(email: string, password: string) {
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

    try {
      await syncStoreCustomerFromSession();
    } catch {
      /* el layout /cuenta vuelve a intentar; no bloquear el flujo por fallo puntual */
    }

    setLoading(false);
    if (onSuccess) {
      onSuccess();
      return;
    }
    window.location.assign("/cuenta");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
        "Escribí tu documento solo con números (mínimo 6 dígitos). Así podemos unirte con tus compras anteriores si ya compraste con nosotras.",
      );
      return;
    }

    if (emailConflictsWithDocument(documentNorm, email)) {
      setLoading(false);
      setError(
        "El correo no puede ser tu cédula ni usarla como usuario (ej. 1234567890@gmail.com). Usá un correo distinto al documento.",
      );
      return;
    }

    const registerRes = await registerStoreCustomer({
      name,
      email,
      password,
      documentId: documentRaw,
    });

    if (!registerRes.ok) {
      setLoading(false);
      if (registerRes.error === "duplicate_email") {
        setError("Ese correo ya está registrado. Prueba iniciar sesión.");
        return;
      }
      if (registerRes.error === "duplicate_document") {
        setError(
          "Esta cédula ya está asociada a otra cuenta. Iniciá sesión con ese usuario o escribinos si necesitás ayuda.",
        );
        return;
      }
      if (registerRes.error === "document") {
        setError(
          "Escribí tu documento solo con números (mínimo 6 dígitos). Así podemos unirte con tus compras anteriores si ya compraste con nosotras.",
        );
        return;
      }
      if (registerRes.error === "document_email_conflict") {
        setError(
          "El correo no puede ser tu cédula ni usarla como usuario (ej. 1234567890@gmail.com). Usá un correo distinto al documento.",
        );
        return;
      }
      if (registerRes.error === "name") {
        setError("Ingresa tu nombre.");
        return;
      }
      if (registerRes.error === "password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (registerRes.error === "email") {
        setError("Ingresa un correo electrónico válido.");
        return;
      }
      setError(
        registerRes.message
          ? friendlyStoreAuthError(registerRes.message)
          : "No se pudo crear la cuenta. Intenta de nuevo.",
      );
      return;
    }

    await completeStoreSignIn(email, password);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <p className={storeAuthFormErrorClass}>{error}</p> : null}
      <label className="block">
        <span className={storeAuthFormLabelClass}>Nombre</span>
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
        <span className={storeAuthFormLabelClass}>Cédula o documento</span>
        <input
          name="documentId"
          type="text"
          required
          autoComplete="off"
          inputMode="numeric"
          placeholder="Solo números, ej. 1234567890"
          className={inputClassName}
        />
        <p className={storeAuthFormHintClass}>
          Si ya compraste con nosotras, con este dato te reconocemos y unimos tu historial en esta
          cuenta.
        </p>
      </label>
      <label className="block">
        <span className={storeAuthFormLabelClass}>Correo electrónico</span>
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
        <span className={storeAuthFormLabelClass}>Contraseña</span>
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
        className={`${submitButtonClassName} mt-1`}
      >
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
