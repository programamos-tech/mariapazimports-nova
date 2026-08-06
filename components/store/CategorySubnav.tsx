import Link from "next/link";

type Subcategory = { id: string; name: string };

/**
 * Enlaces de subcategoría bajo el título del listado (sin imágenes).
 */
export function CategorySubnav({
  parentId,
  parentName,
  activeId,
  subcategories,
}: {
  parentId: string;
  parentName: string;
  activeId: string;
  subcategories: Subcategory[];
}) {
  if (subcategories.length === 0) return null;

  const chipClass = (active: boolean) =>
    `inline-flex items-center whitespace-nowrap border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition ${
      active
        ? "border-stone-900 bg-stone-900 text-white"
        : "border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900"
    }`;

  return (
    <nav
      className="mt-5 flex flex-wrap items-center justify-center gap-2"
      aria-label="Subcategorías"
    >
      <Link
        href={`/products?category=${parentId}`}
        className={chipClass(activeId === parentId)}
      >
        Todo {parentName}
      </Link>
      {subcategories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.id}`}
          className={chipClass(activeId === c.id)}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
