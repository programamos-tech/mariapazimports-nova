"use client";

import { useState } from "react";
import {
  createCategory,
  updateCategoryListingHero,
} from "@/app/actions/admin/categories";
import type { AdminCategoryManageRow } from "@/lib/supabase/admin-products-list";
import { CategoryDeleteButton } from "@/components/admin/CategoryDeleteButton";
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

export function CategoriesPanel({ list, loadError, categoryError }: Props) {
  const roots = rootCategoryOptions(list);
  const tree = buildCategoryTree(list);
  const [mode, setMode] = useState<"root" | "sub">("root");
  const [heroOpenId, setHeroOpenId] = useState<string | null>(null);

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <header className="shrink-0 border-b border-zinc-100 px-5 pb-5 pt-6 pr-14 sm:px-8 sm:pt-7">
        <h1
          id="categories-modal-title"
          className="text-2xl font-semibold tracking-tight text-zinc-900"
        >
          Organizar el catálogo
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500">
          Primero creá las <strong className="font-semibold text-zinc-700">categorías</strong>{" "}
          grandes (ej. Cuidado corporal). Después, dentro de cada una, agregá{" "}
          <strong className="font-semibold text-zinc-700">subcategorías</strong>{" "}
          (ej. Cremas, Jabones). En la ficha del producto elegís dónde va.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { n: "1", t: "Categoría", d: "Grupo principal de la tienda" },
            { n: "2", t: "Subcategoría", d: "Detalle dentro del grupo" },
            { n: "3", t: "Producto", d: "Se asigna en su ficha" },
          ].map((s) => (
            <li
              key={s.n}
              className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {s.t}
                </span>
                <span className="text-xs text-zinc-500">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,22rem)_1fr] lg:overflow-hidden">
        {/* Crear */}
        <section className="border-b border-zinc-100 bg-zinc-50/40 px-5 py-5 sm:px-8 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-900">Agregar nueva</h2>

          <div
            className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-zinc-200/60 p-1"
            role="tablist"
            aria-label="Tipo a crear"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "root"}
              onClick={() => setMode("root")}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
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
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
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
              ? "Va al menú principal de la tienda (Shop). Ejemplo: Maquillaje, Termos, Zapatos."
              : "Queda dentro de una categoría. Ejemplo: dentro de Maquillaje → Labios, Ojos."}
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
                  Dentro de esta categoría
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
                Elegí una categoría válida para la subcategoría.
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

            <button
              type="submit"
              className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              {mode === "root" ? "Crear categoría" : "Crear subcategoría"}
            </button>
          </form>
        </section>

        {/* Árbol */}
        <section className="flex min-h-0 flex-col px-5 py-5 sm:px-8 lg:overflow-hidden">
          <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Cómo quedó armado
              </h2>
              <p className="mt-0.5 text-[13px] text-zinc-500">
                {list.length === 0
                  ? "Todavía vacío — creá la primera a la izquierda."
                  : `${tree.length} categorías · ${list.length} en total`}
              </p>
            </div>
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
                Usá la pestaña «Categoría» a la izquierda. Después podés colgarle
                subcategorías.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1">
              {tree.map(({ parent, children }) => {
                const ParentIcon = getCategoryIconComponent(
                  resolveCategoryIconKey(parent.icon_key),
                );
                const heroOpen = heroOpenId === parent.id;
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
                          Categoría ·{" "}
                          {children.length === 0
                            ? "sin subcategorías aún"
                            : `${children.length} subcategoría${children.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setHeroOpenId(heroOpen ? null : parent.id)
                          }
                          className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
                        >
                          {heroOpen ? "Cerrar imagen" : "Imagen listado"}
                        </button>
                        <CategoryDeleteButton
                          categoryId={parent.id}
                          categoryName={parent.name}
                        />
                      </div>
                    </div>

                    {heroOpen ? (
                      <form
                        action={updateCategoryListingHero}
                        className="space-y-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3"
                      >
                        <input
                          type="hidden"
                          name="category_id"
                          value={parent.id}
                        />
                        <p className="text-xs text-zinc-500">
                          Imagen ancha al filtrar esta categoría en la tienda
                          (opcional).
                        </p>
                        <input
                          name="listing_hero_image_path"
                          defaultValue={parent.listing_hero_image_path ?? ""}
                          placeholder="Ej. bolsos.jpg o ruta en Storage"
                          autoComplete="off"
                          className={fieldClass}
                        />
                        <input
                          name="listing_hero_alt_text"
                          defaultValue={parent.listing_hero_alt_text ?? ""}
                          placeholder="Texto alternativo"
                          autoComplete="off"
                          className={fieldClass}
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                        >
                          Guardar imagen
                        </button>
                      </form>
                    ) : null}

                    {children.length > 0 ? (
                      <ul className="border-t border-zinc-100">
                        {children.map((child) => {
                          const ChildIcon = getCategoryIconComponent(
                            resolveCategoryIconKey(child.icon_key),
                          );
                          const childHeroOpen = heroOpenId === child.id;
                          return (
                            <li
                              key={child.id}
                              className="border-b border-zinc-50 last:border-b-0"
                            >
                              <div className="flex items-center gap-3 bg-zinc-50/50 py-3 pl-8 pr-4">
                                <span
                                  className="text-zinc-300"
                                  aria-hidden
                                >
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
                                    Subcategoría de {parent.name}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setHeroOpenId(
                                        childHeroOpen ? null : child.id,
                                      )
                                    }
                                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-500 transition hover:bg-zinc-50"
                                  >
                                    Imagen
                                  </button>
                                  <CategoryDeleteButton
                                    categoryId={child.id}
                                    categoryName={child.name}
                                  />
                                </div>
                              </div>
                              {childHeroOpen ? (
                                <form
                                  action={updateCategoryListingHero}
                                  className="space-y-2 border-t border-zinc-100 bg-white px-4 py-3 pl-8"
                                >
                                  <input
                                    type="hidden"
                                    name="category_id"
                                    value={child.id}
                                  />
                                  <input
                                    name="listing_hero_image_path"
                                    defaultValue={
                                      child.listing_hero_image_path ?? ""
                                    }
                                    placeholder="Ruta de imagen (opcional)"
                                    autoComplete="off"
                                    className={fieldClass}
                                  />
                                  <input
                                    name="listing_hero_alt_text"
                                    defaultValue={
                                      child.listing_hero_alt_text ?? ""
                                    }
                                    placeholder="Texto alternativo"
                                    autoComplete="off"
                                    className={fieldClass}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                                  >
                                    Guardar imagen
                                  </button>
                                </form>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400">
                        Tip: elegí «Subcategoría» a la izquierda y colgala de «
                        {parent.name}».
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
