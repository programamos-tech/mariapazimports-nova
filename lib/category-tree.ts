/** Utilidades de árbol de categorías (raíz → subcategorías). */

export type CategoryTreeNode = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order?: number;
  icon_key?: string | null;
};

export type CategoryTreeGroup<T extends CategoryTreeNode = CategoryTreeNode> = {
  parent: T;
  children: T[];
};

function bySortThenName<T extends { name: string; sort_order?: number }>(
  a: T,
  b: T,
) {
  return (
    (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
    a.name.localeCompare(b.name, "es")
  );
}

/** Agrupa filas planas en raíces + hijos (máx. 2 niveles). */
export function buildCategoryTree<T extends CategoryTreeNode>(
  rows: T[],
): CategoryTreeGroup<T>[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const roots = rows.filter((r) => !r.parent_id).slice().sort(bySortThenName);

  const byParent = new Map<string, T[]>();
  const orphans: T[] = [];

  for (const r of rows) {
    if (!r.parent_id) continue;
    const parent = byId.get(r.parent_id);
    if (!parent || parent.parent_id) {
      orphans.push(r);
      continue;
    }
    const arr = byParent.get(r.parent_id) ?? [];
    arr.push(r);
    byParent.set(r.parent_id, arr);
  }

  for (const kids of byParent.values()) kids.sort(bySortThenName);

  const groups: CategoryTreeGroup<T>[] = roots.map((parent) => ({
    parent,
    children: byParent.get(parent.id) ?? [],
  }));

  for (const orphan of orphans.sort(bySortThenName)) {
    groups.push({ parent: orphan, children: [] });
  }

  return groups;
}

/** Solo categorías raíz (pueden ser padres de subcategorías). */
export function rootCategoryOptions<T extends CategoryTreeNode>(rows: T[]): T[] {
  return rows.filter((r) => !r.parent_id).slice().sort(bySortThenName);
}

/** IDs de la categoría y todas sus subcategorías (para filtros de listado). */
export function categoryIdWithDescendants(
  rows: { id: string; parent_id?: string | null }[],
  categoryId: string,
): string[] {
  const needle = categoryId.trim().toLowerCase();
  const ids = new Set<string>([needle]);
  for (const r of rows) {
    if ((r.parent_id ?? "").trim().toLowerCase() === needle) {
      ids.add(r.id.trim().toLowerCase());
    }
  }
  return [...ids];
}
