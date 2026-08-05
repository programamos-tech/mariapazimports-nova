"use client";

import { useFormStatus } from "react-dom";

type Variant = "outline" | "solid";
type FormAction = (formData: FormData) => void | Promise<void>;

/**
 * CTA de bolsa con feedback inmediato (press + pending).
 * Debe vivir dentro del `<form>` que dispara el Server Action.
 *
 * Sin `pending` controlado, usa `useFormStatus` del form padre.
 */
export function StoreAddToBagButton({
  label = "Añadir a la bolsa",
  pendingLabel = "Añadiendo…",
  variant = "outline",
  className = "",
  formAction,
  pending: pendingProp,
  disabled = false,
}: {
  label?: string;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  formAction?: FormAction;
  /** Si se pasa, sustituye a `useFormStatus` (útil con varios CTAs en el mismo form). */
  pending?: boolean;
  disabled?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp !== undefined ? pendingProp : formPending;
  const isDisabled = disabled || pending;

  const base =
    variant === "solid"
      ? "w-full bg-stone-900 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white lg:py-2.5"
      : "w-full border border-stone-900 bg-white py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900";

  const idleHover =
    variant === "solid"
      ? "hover:bg-stone-800"
      : "hover:bg-stone-900 hover:text-white";

  const pendingTone =
    variant === "solid"
      ? "bg-stone-800 text-white"
      : "border-stone-900 bg-stone-900 text-white";

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={isDisabled}
      aria-busy={pending}
      className={`store-add-to-bag relative overflow-hidden transition-[transform,background-color,color,border-color,box-shadow] duration-200 ease-out active:scale-[0.97] disabled:cursor-wait ${base} ${pending ? pendingTone : idleHover} ${className}`.trim()}
    >
      <span
        className={`inline-flex items-center justify-center gap-2 transition-opacity duration-150 ${pending ? "opacity-0" : "opacity-100"}`}
      >
        {label}
      </span>
      <span
        className={`pointer-events-none absolute inset-0 inline-flex items-center justify-center gap-2.5 transition-opacity duration-150 ${pending ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!pending}
      >
        <span className="store-add-to-bag-spinner" />
        <span>{pendingLabel}</span>
      </span>
      {pending ? <span className="store-add-to-bag-sheen" aria-hidden /> : null}
    </button>
  );
}

/** Botón secundario (p. ej. Comprar ahora) con pending opcional. */
export function StoreFormPendingButton({
  label,
  pendingLabel,
  className = "",
  formAction,
  pending: pendingProp,
  disabled = false,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  formAction?: FormAction;
  pending?: boolean;
  disabled?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp !== undefined ? pendingProp : formPending;
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={isDisabled}
      aria-busy={pending}
      className={`relative transition-opacity duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 ${className}`.trim()}
    >
      {pending && pendingLabel ? pendingLabel : label}
    </button>
  );
}
