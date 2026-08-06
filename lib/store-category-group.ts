import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryIdWithDescendants } from "@/lib/category-tree";

const CATEGORY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CategoryRow = { id: string; name: string; parent_id?: string | null };

/** Varias categorías del filtro → todos los `category_id` equivalentes (sinónimos + hijos). */
export function expandManyCategoryIdsFromRows(
  rows: CategoryRow[],
  categoryIds: string[],
): string[] {
  const set = new Set<string>();
  for (const id of categoryIds) {
    const t = id.trim().toLowerCase();
    if (!CATEGORY_UUID_RE.test(t)) continue;
    for (const e of expandCategoryIdsFromRows(rows, t)) set.add(e);
  }
  return [...set];
}

/** Comparación estable para fusionar filas duplicadas en BD / Excel. */
export function normalizeCategoryLabel(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Variantes de nombre que deben compartir listado y menú.
 * Claves en forma ya normalizada (`normalizeCategoryLabel`).
 */
const CATEGORY_SYNONYM_CANONICAL: Record<string, string> = {
  "skin care": "cuidado de la piel",
  "make up": "maquillaje",
};

/** Clave de agrupación para menú, filtros y seed. */
export function categoryGroupKey(name: string): string {
  const n = normalizeCategoryLabel(name);
  return CATEGORY_SYNONYM_CANONICAL[n] ?? n;
}

/**
 * IDs a incluir en `WHERE category_id IN (...)`:
 * sinónimos del mismo nombre + subcategorías si el id es una raíz.
 */
export function expandCategoryIdsFromRows(
  rows: CategoryRow[],
  categoryId: string,
): string[] {
  const needle = categoryId.trim().toLowerCase();
  const target = rows.find((r) => r.id.trim().toLowerCase() === needle);
  if (!target) return [needle];

  const key = categoryGroupKey(target.name);
  const synonymIds = rows
    .filter((r) => categoryGroupKey(r.name) === key)
    .map((r) => r.id.trim().toLowerCase());

  const set = new Set<string>(synonymIds.length ? synonymIds : [needle]);

  for (const id of [...set]) {
    for (const childId of categoryIdWithDescendants(rows, id)) {
      set.add(childId);
    }
  }

  return [...set];
}

/** IDs de categoría equivalentes (misma etiqueta / sinónimo / hijos) para filtros. */
export async function fetchExpandedCategoryIds(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<string[]> {
  const { data: rows } = await supabase
    .from("categories")
    .select("id,name,parent_id");
  return expandCategoryIdsFromRows(rows ?? [], categoryId);
}

/** Elige un id canónico por grupo (menor `sort_order`, desempate por nombre). */
export function pickCanonicalCategoryId(
  group: { id: string; name: string; sort_order: number }[],
): string | null {
  if (!group.length) return null;
  const sorted = [...group].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.name.localeCompare(b.name, "es"),
  );
  return sorted[0]!.id;
}
