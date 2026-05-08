import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/store/ProductDetailView";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import { fetchStorefrontCouponDiscountPercentForProduct } from "@/lib/store-coupons";

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
  const couponDiscountPercent =
    await fetchStorefrontCouponDiscountPercentForProduct(supabase, product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 lg:py-14">
      <nav aria-label="Migas de pan" className="mb-8 text-[11px] uppercase tracking-[0.12em] text-stone-400">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="transition hover:text-stone-700">
              Inicio
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li>
            <Link href="/products" className="transition hover:text-stone-700">
              Productos
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li
            className="max-w-[min(100%,28rem)] truncate text-stone-600"
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
        couponDiscountPercent={couponDiscountPercent}
      />
    </div>
  );
}
