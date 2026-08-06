"use client";

import { useMemo, useState } from "react";
import { buildCategoryTree } from "@/lib/category-tree";

export type ProductCategoryOption = {
  id: string;
  name: string;
  parent_id?: string | null;
};

type Props = {
  categories: ProductCategoryOption[];
  /** Valor guardado en BD (puede ser raíz o subcategoría). */
  initialCategoryId?: string;
  idPrefix?: string;
  labelClass: string;
  inputClass: string;
  /** Notifica el id efectivo (subcategoría si hay, si no la categoría). */
  onEffectiveChange?: (categoryId: string, label: string) => void;
};

function resolveSelection(
  categories: ProductCategoryOption[],
  savedId: string,
): { rootId: string; subId: string } {
  if (!savedId) return { rootId: "", subId: "" };
  const row = categories.find((c) => c.id === savedId);
  if (!row) return { rootId: "", subId: "" };
  if (row.parent_id) {
    return { rootId: row.parent_id, subId: row.id };
  }
  return { rootId: row.id, subId: "" };
}

function labelFor(
  categories: ProductCategoryOption[],
  rootId: string,
  subId: string,
): string {
  if (subId) {
    const sub = categories.find((c) => c.id === subId);
    const root = categories.find((c) => c.id === rootId);
    if (sub && root) return `${root.name} · ${sub.name}`;
    return sub?.name ?? "—";
  }
  if (rootId) {
    return categories.find((c) => c.id === rootId)?.name ?? "—";
  }
  return "—";
}

/**
 * Dos selects: categoría (raíz) y subcategoría (hijos).
 * El `name="category_id"` guarda la subcategoría si hay, si no la categoría.
 */
export function ProductCategoryFields({
  categories,
  initialCategoryId = "",
  idPrefix = "cat",
  labelClass,
  inputClass,
  onEffectiveChange,
}: Props) {
  const initial = useMemo(
    () => resolveSelection(categories, initialCategoryId),
    [categories, initialCategoryId],
  );
  const [rootId, setRootId] = useState(initial.rootId);
  const [subId, setSubId] = useState(initial.subId);

  const tree = useMemo(
    () =>
      buildCategoryTree(
        categories.map((c) => ({
          id: c.id,
          name: c.name,
          parent_id: c.parent_id ?? null,
        })),
      ),
    [categories],
  );

  const roots = tree.map((g) => g.parent);
  const children = tree.find((g) => g.parent.id === rootId)?.children ?? [];
  const effectiveId = subId || rootId;

  const notify = (nextRoot: string, nextSub: string) => {
    const id = nextSub || nextRoot;
    onEffectiveChange?.(id, labelFor(categories, nextRoot, nextSub));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="category_id" value={effectiveId} />
      <div>
        <label htmlFor={`${idPrefix}-root`} className={labelClass}>
          Categoría (opcional)
        </label>
        <select
          id={`${idPrefix}-root`}
          value={rootId}
          onChange={(e) => {
            const next = e.target.value;
            setRootId(next);
            setSubId("");
            notify(next, "");
          }}
          className={inputClass}
        >
          <option value="">Sin categoría</option>
          {roots.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-sub`} className={labelClass}>
          Subcategoría (opcional)
        </label>
        <select
          id={`${idPrefix}-sub`}
          value={subId}
          disabled={!rootId || children.length === 0}
          onChange={(e) => {
            const next = e.target.value;
            setSubId(next);
            notify(rootId, next);
          }}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-zinc-900/50`}
        >
          <option value="">
            {!rootId
              ? "Primero elegí categoría"
              : children.length === 0
                ? "Esta categoría no tiene subcategorías"
                : "Sin subcategoría"}
          </option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {rootId && children.length === 0 ? (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Podés crear subcategorías en Productos → Categorías.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function productCategoryDisplayLabel(
  categories: ProductCategoryOption[],
  categoryId: string,
): string {
  const { rootId, subId } = resolveSelection(categories, categoryId);
  return labelFor(categories, rootId, subId);
}
