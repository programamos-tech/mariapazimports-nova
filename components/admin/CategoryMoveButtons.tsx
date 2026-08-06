"use client";

import { useFormStatus } from "react-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { moveCategory } from "@/app/actions/admin/categories";

function MoveButton({
  direction,
  disabled,
  label,
}: {
  direction: "up" | "down";
  disabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="submit"
      name="direction"
      value={direction}
      disabled={disabled || pending}
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {pending ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      ) : (
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}

/**
 * Subir / bajar categoría entre hermanas (define el orden del menú Shop).
 */
export function CategoryMoveButtons({
  categoryId,
  canMoveUp,
  canMoveDown,
}: {
  categoryId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      <form action={moveCategory} className="inline">
        <input type="hidden" name="category_id" value={categoryId} />
        <MoveButton
          direction="up"
          disabled={!canMoveUp}
          label="Subir en el menú"
        />
      </form>
      <form action={moveCategory} className="inline">
        <input type="hidden" name="category_id" value={categoryId} />
        <MoveButton
          direction="down"
          disabled={!canMoveDown}
          label="Bajar en el menú"
        />
      </form>
    </div>
  );
}
