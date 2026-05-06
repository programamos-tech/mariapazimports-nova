import { createCategory } from "@/app/actions/admin/categories";
import type { AdminCategoryManageRow } from "@/lib/supabase/admin-products-list";
import { CategoryDeleteButton } from "@/components/admin/CategoryDeleteButton";

type Props = {
  list: AdminCategoryManageRow[];
  loadError: boolean;
  categoryError?: "name" | "db";
};

export function CategoriesPanel({ list, loadError, categoryError }: Props) {
  const fieldClass =
    "min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-200";

  return (
    <div className="space-y-5 pr-7 sm:pr-8">
      <header className="space-y-1 border-b border-zinc-100 pb-5">
        <h1
          id="categories-modal-title"
          className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
        >
          Categorías
        </h1>
        <p className="text-sm text-zinc-500">
          Creá grupos y asignalos a cada producto desde su ficha.
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Nueva categoría
        </p>
        <form action={createCategory} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="from" value="modal" />
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="sr-only">Nombre</span>
            <input
              name="name"
              type="text"
              autoComplete="off"
              placeholder="Nombre (ej. Audio, Hogar)"
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            className="inline-flex shrink-0 justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Agregar
          </button>
        </form>
      </section>

      {categoryError === "name" ? (
        <p
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
          role="alert"
        >
          Ingresá un nombre.
        </p>
      ) : null}
      {categoryError === "db" ? (
        <p
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
          role="alert"
        >
          No se pudo guardar. Intentá de nuevo.
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-100">
          No se pudieron cargar categorías. Verificá la migración en Supabase.
        </p>
      ) : null}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">Todavía no hay categorías.</p>
          <p className="mt-1 text-xs text-zinc-400">Usá el formulario de arriba para crear la primera.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Listado ({list.length})
          </p>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white ring-1 ring-zinc-100">
            <div className="max-h-[min(40vh,320px)] overflow-y-auto">
              <table className="w-full min-w-0 text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/90">
                    <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Nombre
                    </th>
                    <th className="w-24 px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c, index) => {
                    const zebra = index % 2 === 1 ? "bg-zinc-50/80" : "bg-white";
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-zinc-100/90 ${zebra} transition hover:bg-zinc-100/60`}
                      >
                        <td className="px-3 py-3 font-semibold text-zinc-900">{c.name}</td>
                        <td className="px-3 py-3 text-right">
                          <CategoryDeleteButton
                            categoryId={c.id}
                            categoryName={c.name}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
