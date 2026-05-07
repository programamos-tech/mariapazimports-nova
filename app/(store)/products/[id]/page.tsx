import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/store/ProductDetailView";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("id,name,description,price_cents,stock_quantity,image_path,size_value,size_unit,has_expiration,expiration_date,colors,has_vat,vat_percent")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) notFound();

  const img = storagePublicObjectUrl(product.image_path);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-stone-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="hover:text-[#556654] hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li>
            <Link
              href="/products"
              className="hover:text-[#556654] hover:underline"
            >
              Productos
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li
            className="max-w-[min(100%,28rem)] truncate font-medium text-stone-700"
            title={product.name}
          >
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductDetailView
        productId={product.id}
        name={product.name}
        description={product.description}
        priceCents={product.price_cents}
        stockQuantity={product.stock_quantity}
        imageUrl={img}
        sizeValue={product.size_value}
        sizeUnit={product.size_unit}
        hasExpiration={product.has_expiration}
        expirationDate={product.expiration_date}
        colors={Array.isArray(product.colors) ? product.colors : []}
        hasVat={product.has_vat}
        vatPercent={product.vat_percent}
      />

      <section className="mt-16 border-t border-stone-200 pt-10">
        <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
          {product.name} — Especificaciones completas
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-600 sm:text-base">
          {product.description ? (
            <div className="whitespace-pre-wrap">{product.description}</div>
          ) : (
            <p>
              Todavía no hay descripción extendida. Desde el panel podés
              agregar detalles técnicos, materiales, compatibilidad y garantía
              para que aparezcan aquí.
            </p>
          )}
          <div className="rounded-xl bg-[#faf9f7] p-4 ring-1 ring-stone-100">
            <p className="font-medium text-stone-800">Información general</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-stone-600">
              <li>Garantía según política del comercio</li>
              <li>Embalaje y envío al confirmar el pedido</li>
              <li>Pagos procesados de forma segura</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
