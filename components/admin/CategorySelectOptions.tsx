import { buildCategoryTree } from "@/lib/category-tree";

type CategoryOption = {
  id: string;
  name: string;
  parent_id?: string | null;
};

/** `<option>` / `<optgroup>` anidados para selects de categoría en admin. */
export function CategorySelectOptions({
  categories,
  emptyLabel = "Seleccionar categoría",
}: {
  categories: CategoryOption[];
  emptyLabel?: string;
}) {
  const tree = buildCategoryTree(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      parent_id: c.parent_id ?? null,
    })),
  );

  return (
    <>
      <option value="">{emptyLabel}</option>
      {tree.map(({ parent, children }) =>
        children.length === 0 ? (
          <option key={parent.id} value={parent.id}>
            {parent.name}
          </option>
        ) : (
          <optgroup key={parent.id} label={parent.name}>
            <option value={parent.id}>{parent.name} (todas)</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        ),
      )}
    </>
  );
}
