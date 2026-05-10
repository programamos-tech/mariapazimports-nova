import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminProductDetailToolbar } from "@/components/admin/AdminProductDetailToolbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop, formatQuantityInputGrouping } from "@/lib/money";
import {
  formatSizeOption,
  normalizeSizeOptionsFromRow,
} from "@/lib/product-size-options";
import {
  unitPriceGrossCents,
  unitPriceNetCents,
} from "@/lib/product-vat-price";
import { shouldUnoptimizeStorageImageUrl, storagePublicObjectUrl } from "@/lib/storage-public-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function shortSku(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function fmtUnits(n: number) {
  return `${n <= 0 ? "0" : formatQuantityInputGrouping(n)} unidades`;
}

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  if (!product) notFound();

  const raw = product as Record<string, unknown> & {
    id: string;
    name: string;
    description: string;
    reference?: string;
    brand?: string;
    price_cents: number;
    cost_cents?: number;
    stock_warehouse?: number;
    stock_local?: number;
    stock_quantity: number;
    image_path: string | null;
    category_id?: string | null;
    size_options?: unknown;
    size_value?: number | null;
    size_unit?: string | null;
    has_expiration?: boolean | null;
    expiration_date?: string | null;
    colors?: string[] | null;
    fragrance_options?: string[] | null;
    has_vat?: boolean | null;
    vat_percent?: number | null;
  };

  let categoryName = "Sin categoría";
  if (raw.category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name")
      .eq("id", raw.category_id)
      .maybeSingle();
    if (cat?.name) categoryName = cat.name;
  }
  const brand = (raw.brand && String(raw.brand).trim()) || "—";
  const reference =
    (raw.reference && String(raw.reference).trim()) || shortSku(raw.id);
  const cost = Number(raw.cost_cents ?? 0);
  const price = Number(raw.price_cents ?? 0);
  const priceNet = unitPriceNetCents(price);
  const priceGross = unitPriceGrossCents(
    price,
    raw.has_vat,
    raw.vat_percent,
  );
  const stockW = Number(raw.stock_warehouse ?? 0);
  const stockL = Number(raw.stock_local ?? 0);
  const stockTotal = Number(raw.stock_quantity ?? stockW + stockL);
  const sizeOptions = normalizeSizeOptionsFromRow({
    size_options: raw.size_options,
    size_value: raw.size_value,
    size_unit: raw.size_unit,
  });
  const sizeLabel =
    sizeOptions.length > 0
      ? sizeOptions.map(formatSizeOption).join(", ")
      : "—";
  const expirationLabel = raw.has_expiration
    ? raw.expiration_date || "Requiere fecha de lote"
    : "No aplica";
  const colorsLabel = Array.isArray(raw.colors) && raw.colors.length > 0
    ? raw.colors.join(", ")
    : "—";
  const fragranceLabel =
    Array.isArray(raw.fragrance_options) && raw.fragrance_options.length > 0
      ? raw.fragrance_options.join(", ")
      : "—";
  const vatLabel = raw.has_vat
    ? `${String(raw.vat_percent ?? 0).replace(/\.0+$/, "")}%`
    : "No aplica";

  const { data: pendingOrders } = await supabase.from("orders").select("id").eq("status", "pending");
  const pendingIds = (pendingOrders ?? []).map((o) => o.id).filter(Boolean);
  let reservedQty = 0;
  if (pendingIds.length > 0) {
    const { data: lines } = await supabase
      .from("order_items")
      .select("quantity")
      .eq("product_id", id)
      .in("order_id", pendingIds);
    reservedQty = (lines ?? []).reduce((s, r) => s + Number(r.quantity ?? 0), 0);
  }

  const plataStock = cost * stockTotal;
  const margenBruto = Math.max(0, price - cost) * stockTotal;
  const margenPct =
    price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  const img = storagePublicObjectUrl(raw.image_path);
  const desc = (raw.description && String(raw.description).trim()) || "Sin descripción cargada.";

  const labelClass =
    "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500">
              <Link href="/admin/products" className="hover:text-zinc-800">
                Inventario
              </Link>
              <span className="mx-1.5 text-zinc-300">/</span>
              <span className="text-zinc-700">{raw.name}</span>
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              {raw.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              <span className="font-mono text-zinc-700">{reference}</span>
              <span className="mx-1.5 text-zinc-300">·</span>
              {categoryName}
              <span className="mx-1.5 text-zinc-300">·</span>
              {brand}
            </p>
          </div>
          <AdminProductDetailToolbar productId={id} productName={raw.name} />
        </div>

        <div className="mt-8 flex flex-wrap items-start gap-6 border-t border-zinc-200/70 pt-8">
          {img ? (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 sm:size-28">
              <Image
                src={img}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
                unoptimized={shouldUnoptimizeStorageImageUrl(img)}
              />
            </div>
          ) : null}
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
            <div>
              <p className={labelClass}>Precio de venta</p>
              <div className="mt-1 space-y-1">
                <p className="text-xl font-medium tabular-nums text-zinc-900 sm:text-2xl">
                  {formatCop(priceNet)}
                  <span className="ml-2 text-base font-normal text-zinc-500">
                    sin IVA
                  </span>
                </p>
                {raw.has_vat ? (
                  <>
                    <p className="text-lg font-semibold tabular-nums text-zinc-900">
                      {formatCop(priceGross)}
                      <span className="ml-2 text-sm font-normal text-zinc-500">
                        con IVA ({vatLabel})
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Sin IVA aplicado al precio de lista (precio final igual al base).
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className={labelClass}>Stock total</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-zinc-900">{fmtUnits(stockTotal)}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Local + bodega</p>
            </div>
            <div>
              <p className={labelClass}>Stock local</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-zinc-900">{fmtUnits(stockL)}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Punto de venta / mostrador</p>
            </div>
            <div>
              <p className={labelClass}>Stock bodega</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-zinc-900">{fmtUnits(stockW)}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Almacén de la sucursal</p>
            </div>
            <div>
              <p className={labelClass}>Stock reservado</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-zinc-700">{fmtUnits(reservedQty)}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                En ventas no pagadas (pendientes)
              </p>
            </div>
            <div>
              <p className={labelClass}>Costo</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-zinc-900">{formatCop(cost)}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8">
        <h2 className={labelClass}>Valor e ingresos estimados</h2>
        <p className="mt-1 text-sm text-zinc-500">Con el stock actual en esta sucursal.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-5">
            <p className={labelClass}>Plata en stock</p>
            <p className="mt-2 text-xl font-medium tabular-nums text-zinc-900">{formatCop(plataStock)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Inversión en {fmtUnits(stockTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-5">
            <p className={labelClass}>Margen bruto estimado</p>
            <p className="mt-2 text-xl font-medium tabular-nums text-zinc-900">{formatCop(margenBruto)}</p>
            <p className="mt-1 text-xs text-zinc-600">
              Si vendés las {stockTotal <= 0 ? "0" : formatQuantityInputGrouping(stockTotal)} unidades
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-5">
            <p className={labelClass}>Margen de ganancia</p>
            <p className="mt-2 text-xl font-medium tabular-nums text-zinc-900">{margenPct}%</p>
            <p className="mt-1 text-xs text-zinc-500">Por unidad vendida</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8">
          <h2 className={labelClass}>Identificación</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Código</dt>
              <dd className="mt-0.5 font-mono text-zinc-900">{reference}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Categoría</dt>
              <dd className="mt-0.5 text-zinc-900">{categoryName}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Marca</dt>
              <dd className="mt-0.5 text-zinc-900">{brand}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Ubicación</dt>
              <dd className="mt-0.5 text-zinc-700">Sin ubicación específica</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Tamaño / contenido</dt>
              <dd className="mt-0.5 text-zinc-900">{sizeLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Vencimiento</dt>
              <dd className="mt-0.5 text-zinc-900">{expirationLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Colores</dt>
              <dd className="mt-0.5 text-zinc-900">{colorsLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Fragancias / tonos</dt>
              <dd className="mt-0.5 text-zinc-900">{fragranceLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">IVA</dt>
              <dd className="mt-0.5 text-zinc-900">{vatLabel}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8">
          <h2 className={labelClass}>Descripción</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700">{desc}</p>
        </section>
      </div>
    </div>
  );
}
