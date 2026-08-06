"use client";

import { useFormStatus } from "react-dom";
import { deleteCategory } from "@/app/actions/admin/categories";

function DeleteSubmit({ categoryName }: { categoryName: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50 active:scale-95 disabled:cursor-wait disabled:opacity-60"
      onClick={(e) => {
        if (pending) {
          e.preventDefault();
          return;
        }
        if (
          !confirm(
            `¿Eliminar «${categoryName}»? Los productos de esta categoría quedarán sin categoría.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      {pending ? (
        <>
          <span className="size-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
          Eliminando…
        </>
      ) : (
        "Eliminar"
      )}
    </button>
  );
}

export function CategoryDeleteButton({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  return (
    <form action={deleteCategory.bind(null, categoryId)} className="inline">
      <DeleteSubmit categoryName={categoryName} />
    </form>
  );
}
