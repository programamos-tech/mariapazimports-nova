import { createSupabaseServerClient } from "@/lib/supabase/server";
import nextDynamic from "next/dynamic";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const SupplierNewInvoiceIsland = nextDynamic(
  () =>
    import("@/components/admin/SupplierNewInvoiceClientIsland").then((m) => ({
      default: m.SupplierNewInvoiceIsland,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-zinc-200/90 bg-white p-8 text-center text-sm text-zinc-500">
        Cargando formulario…
      </div>
    ),
  },
);

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminProveedorNuevaFacturaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const supabase = await createSupabaseServerClient();
  const { data: s } = await supabase.from("suppliers").select("id,name").eq("id", id).maybeSingle();
  if (!s) notFound();
  const issueDateDefault = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      {error ? (
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error === "validation"
            ? "Revisá fecha y al menos un producto con cantidad y precio unitario válidos."
            : error === "db"
              ? "No se pudo guardar la factura o sus líneas. Revisá permisos y que exista la migración supplier_invoice_lines."
              : "No se pudo completar la operación."}
        </p>
      ) : null}

      <SupplierNewInvoiceIsland
        issueDateDefault={issueDateDefault}
        suppliers={[]}
        fixedSupplierId={id}
        fixedSupplierName={s.name}
      />
    </div>
  );
}
