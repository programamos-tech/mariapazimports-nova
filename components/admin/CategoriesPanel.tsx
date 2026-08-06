"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCategory } from "@/app/actions/admin/categories";
import type { AdminCategoryManageRow } from "@/lib/supabase/admin-products-list";
import { CategoryDeleteButton } from "@/components/admin/CategoryDeleteButton";
import { CategoryMoveButtons } from "@/components/admin/CategoryMoveButtons";
import { CategoryIconPicker } from "@/components/admin/CategoryIconPicker";
import {
  getCategoryIconComponent,
  resolveCategoryIconKey,
} from "@/lib/category-icons";
import {
  buildCategoryTree,
  rootCategoryOptions,
} from "@/lib/category-tree";

type Props = {
  list: AdminCategoryManageRow[];
  loadError: boolean;
  categoryError?: "name" | "db" | "parent";
};

const fieldClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm font-medium text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

function CreateSubmitButton({ mode }: { mode: "root" | "sub" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="relative w-full overflow-hidden rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
    >
      <span
        className={`inline-flex items-center justify-center gap-2 transition-opacity ${pending ? "opacity-0" : "opacity-100"}`}
      >
        {mode === "root" ? "Crear categoría" : "Crear subcategoría"}
      </span>
      <span
        className={`pointer-events-none absolute inset-0 inline-flex items-center justify-center gap-2 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!pending}
      >
        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        Guardando…
      </span>
    </button>
  );
}

export function CategoriesPanel({ list, loadError, categoryError }: Props) {
  const roots = rootCategoryOptions(list);
  const tree = buildCategoryTree(list);
  const [mode, setMode] = useState<"root" | "sub">("root");

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <header className="shrink-0 border-b border-zinc-100 px-5 pb-5 pt-6 pr-14 sm:px-8 sm:pt-7">
        <h1
          id="categories-modal-title"
          className="text-2xl font-semibold tracking-tight text-zinc-900"
        >
          Categorías y subcategorías
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500">
          Las <strong className="font-semibold text-zinc-800">categorías</strong>{" "}
          son los grupos grandes del menú. Dentro de cada una podés crear{" "}
          <strong className="font-semibold text-zinc-800">subcategorías</strong>.
          Usá las flechas ↑ ↓ para elegir cuál va primero en el menú Shop.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 font-semibold text-white">
            Categoría
          </span>
          <span className="text-zinc-300" aria-hidden>
            →
          </span>
          <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-800">
            Subcategoría
          </span>
          <span className="text-zinc-300" aria-hidden>
            →
          </span>
          <span className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-500">
            Producto
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,22rem)_1fr] lg:overflow-hidden">
        <section className="border-b border-zinc-100 bg-zinc-50/40 px-5 py-5 sm:px-8 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-900">Agregar</h2>

          <div
            className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-zinc-200/60 p-1"
            role="tablist"
            aria-label="Qué querés crear"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "root"}
              onClick={() => setMode("root")}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
                mode === "root"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Categoría
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sub"}
              onClick={() => setMode("sub")}
              disabled={roots.length === 0}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === "sub"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Subcategoría
            </button>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
            {mode === "root"
              ? "Grupo principal. Ejemplo: Maquillaje, Termos, Cuidado corporal."
              : "Va adentro de una categoría. Ejemplo: dentro de Maquillaje → Labios."}
          </p>

          <form action={createCategory} className="mt-4 space-y-4">
            <input type="hidden" name="from" value="modal" />
            {mode === "root" ? (
              <input type="hidden" name="parent_id" value="" />
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Nombre
              </span>
              <input
                name="name"
                type="text"
                autoComplete="off"
                required
                placeholder={
                  mode === "root"
                    ? "Ej. Cuidado corporal"
                    : "Ej. Cremas faciales"
                }
                className={fieldClass}
              />
            </label>

            {mode === "sub" ? (
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Dentro de
                </span>
                <select
                  name="parent_id"
                  required
                  defaultValue={roots[0]?.id ?? ""}
                  className={fieldClass}
                >
                  {roots.length === 0 ? (
                    <option value="">Primero creá una categoría</option>
                  ) : (
                    roots.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            ) : null}

            <CategoryIconPicker />

            {categoryError === "name" ? (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
                role="alert"
              >
                Escribí un nombre.
              </p>
            ) : null}
            {categoryError === "parent" ? (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
                role="alert"
              >
                Elegí una categoría para la subcategoría.
              </p>
            ) : null}
            {categoryError === "db" ? (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
                role="alert"
              >
                No se pudo guardar. Probá de nuevo.
              </p>
            ) : null}

            <CreateSubmitButton mode={mode} />
          </form>
        </section>

        <section className="flex min-h-0 flex-col px-5 py-5 sm:px-8 lg:overflow-hidden">
          <div className="mb-4 shrink-0">
            <h2 className="text-sm font-semibold text-zinc-900">
              Tu catálogo organizado
            </h2>
            <p className="mt-0.5 text-[13px] text-zinc-500">
              {list.length === 0
                ? "Todavía vacío — creá la primera categoría a la izquierda."
                : `${tree.length} categorías${
                    list.length > tree.length
                      ? ` · ${list.length - tree.length} subcategorías`
                      : ""
                  } · el orden de arriba es el del menú Shop`}
            </p>
          </div>

          {loadError ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-100">
              No se pudieron cargar. Revisá la conexión con Supabase.
            </p>
          ) : null}

          {list.length === 0 && !loadError ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center">
              <p className="text-base font-medium text-zinc-700">
                Empezá con una categoría
              </p>
              <p className="mt-1 max-w-xs text-sm text-zinc-500">
                Tocá «Categoría» a la izquierda, poné un nombre y creala. Luego
                podés agregar subcategorías adentro.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1">
              {tree.map(({ parent, children }, rootIndex) => {
                const ParentIcon = getCategoryIconComponent(
                  resolveCategoryIconKey(parent.icon_key),
                );
                return (
                  <article
                    key={parent.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100"
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                        <ParentIcon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-zinc-900">
                          {parent.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Categoría
                          {children.length > 0
                            ? ` · ${children.length} subcategoría${children.length === 1 ? "" : "s"}`
                            : ""}
                        </p>
                      </div>
                      <CategoryMoveButtons
                        categoryId={parent.id}
                        canMoveUp={rootIndex > 0}
                        canMoveDown={rootIndex < tree.length - 1}
                      />
                      <CategoryDeleteButton
                        categoryId={parent.id}
                        categoryName={parent.name}
                      />
                    </div>

                    {children.length > 0 ? (
                      <ul className="border-t border-zinc-100">
                        {children.map((child, childIndex) => {
                          const ChildIcon = getCategoryIconComponent(
                            resolveCategoryIconKey(child.icon_key),
                          );
                          return (
                            <li
                              key={child.id}
                              className="flex items-center gap-3 border-b border-zinc-50 bg-zinc-50/60 py-3 pl-8 pr-4 last:border-b-0"
                            >
                              <span className="text-zinc-300" aria-hidden>
                                └
                              </span>
                              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 ring-1 ring-zinc-200/80">
                                <ChildIcon className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-zinc-800">
                                  {child.name}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  Subcategoría
                                </p>
                              </div>
                              <CategoryMoveButtons
                                categoryId={child.id}
                                canMoveUp={childIndex > 0}
                                canMoveDown={childIndex < children.length - 1}
                              />
                              <CategoryDeleteButton
                                categoryId={child.id}
                                categoryName={child.name}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400">
                        Sin subcategorías. Tocá «Subcategoría» a la izquierda y
                        elegí «{parent.name}» en Dentro de.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
