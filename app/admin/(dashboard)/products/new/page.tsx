import { NewProductForm, NewProductHeader } from "@/components/admin/NewProductForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const cats = categories ?? [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <NewProductHeader />

      {error ? (
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error === "reference"
            ? "La referencia es obligatoria. Completá el código del producto."
            : error === "name"
              ? "El nombre es obligatorio."
              : error === "rls"
                ? "No tenés permiso para crear productos. Tu usuario de Supabase tiene que tener una fila en la tabla public.profiles con rol admin (misma id que auth.users)."
                : "No se pudo guardar en la base de datos. Si el proyecto aún no tiene las columnas referencia / marca / costo, aplicá en Supabase la migración 20260510120000_product_reference_brand_cost.sql (el sistema intenta guardar igual sin ellas; si sigue fallando, revisá los logs del servidor)."}
        </p>
      ) : null}

      <NewProductForm categories={cats} />
    </div>
  );
}
