import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart";
import { formatCop } from "@/lib/money";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import { updateLineFromForm } from "@/app/actions/cart";

export const dynamic = "force-dynamic";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;
  const cart = await getCart();
  const supabase = await createSupabaseServerClient();
  const ids = cart.map((l) => l.productId);
  const { data: products } =
    ids.length === 0
      ? { data: [] as { id: string; name: string; price_cents: number; image_path: string | null }[] }
      : await supabase
          .from("products")
          .select("id,name,price_cents,image_path")
          .in("id", ids)
          .eq("is_published", true);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const rows = cart
    .map((line) => {
      const p = byId.get(line.productId);
      if (!p) return null;
      const sub = p.price_cents * line.quantity;
      return { line, p, sub };
    })
    .filter(Boolean) as {
    line: { productId: string; quantity: number };
    p: { id: string; name: string; price_cents: number; image_path: string | null };
    sub: number;
  }[];
  const total = rows.reduce((acc, r) => acc + r.sub, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
        Carrito
      </h1>
      {err === "empty" ? (
        <p className="rounded-xl bg-[#f5edd6] px-3 py-2 text-sm text-amber-950">
          El carrito está vacío.
        </p>
      ) : null}
      {err === "stock" ? (
        <p className="rounded-xl bg-[#f5edd6] px-3 py-2 text-sm text-amber-950">
          No hay stock suficiente para un producto del carrito.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-stone-600">
          No hay ítems.{" "}
          <Link href="/products" className="font-medium text-[#6b7f6a] underline">
            Ver productos
          </Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {rows.map(({ line, p, sub }) => {
              const img = storagePublicObjectUrl(p.image_path);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f4f0ea]">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized={shouldUnoptimizeStorageImageUrl(img)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-stone-900 hover:text-[#556654] hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-stone-500">
                      {formatCop(p.price_cents)} × {line.quantity}
                    </p>
                  </div>
                  <form action={updateLineFromForm} className="flex items-center gap-2">
                    <input type="hidden" name="productId" value={p.id} />
                    <input
                      type="number"
                      name="quantity"
                      min={0}
                      defaultValue={line.quantity}
                      className="w-16 rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm shadow-sm"
                    />
                    <button
                      type="submit"
                      className="text-sm font-medium text-[#6b7f6a] underline"
                    >
                      Actualizar
                    </button>
                  </form>
                  <p className="w-28 text-right font-semibold text-stone-900">{formatCop(sub)}</p>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6">
            <p className="text-lg font-semibold text-stone-900">
              Total: {formatCop(total)}
            </p>
            <Link
              href="/checkout"
              className="rounded-full bg-[#6b7f6a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5c6e5b]"
            >
              Ir a pagar
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
