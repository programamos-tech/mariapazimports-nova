import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { startCheckout } from "@/app/actions/checkout";
import { getCart } from "@/lib/cart";
import { formatCop } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const message = typeof sp.message === "string" ? sp.message : undefined;

  const cart = await getCart();
  if (!cart.length) {
    redirect("/cart?error=empty");
  }

  const supabase = await createSupabaseServerClient();
  const ids = cart.map((l) => l.productId);
  const { data: products } = await supabase
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

  if (!rows.length) {
    redirect("/cart?error=empty");
  }

  const total = rows.reduce((acc, r) => acc + r.sub, 0);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#fffbf6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-stone-500">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="hover:text-[#3d5240] hover:underline">
                Inicio
              </Link>
            </li>
            <li aria-hidden className="text-stone-300">
              /
            </li>
            <li className="font-medium text-stone-700">Checkout</li>
          </ol>
        </nav>

        <h1 className="mb-8 text-2xl font-bold text-stone-900 sm:text-3xl">
          Finalizar compra
        </h1>

        {error ? (
          <div
            className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-100"
            role="alert"
          >
            {error === "missing_name" && "Ingresá nombre y apellido."}
            {error === "invalid_email" && "Email inválido."}
            {error === "missing_shipping" &&
              "Completá dirección, ciudad y teléfono de contacto."}
            {error === "products" && "No se pudieron cargar los productos del pedido."}
            {error === "order" && "No se pudo crear el pedido."}
            {error === "items" && "No se pudieron guardar los ítems del pedido."}
            {error === "wompi" &&
              (message
                ? `Wompi: ${decodeURIComponent(message)}`
                : "Error al crear el enlace de pago en Wompi.")}
            {![
              "missing_name",
              "invalid_email",
              "missing_shipping",
              "products",
              "order",
              "items",
              "wompi",
            ].includes(error) && "Ocurrió un error."}
          </div>
        ) : null}

        <form action={startCheckout}>
          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-stone-900">
                  Revisá tu pedido
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Productos que vas a pagar
                </p>
                <ul className="mt-5 divide-y divide-stone-100">
                  {rows.map(({ line, p, sub }) => {
                    const img = storagePublicObjectUrl(p.image_path);
                    const qtyLabel = String(line.quantity).padStart(2, "0");
                    return (
                      <li
                        key={p.id}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f0eeeb] ring-1 ring-stone-100">
                          {img ? (
                            <Image
                              src={img}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="96px"
                              unoptimized={shouldUnoptimizeStorageImageUrl(img)}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-stone-300">
                              ◆
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-stone-900">{p.name}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            Cantidad: {qtyLabel}
                          </p>
                          <p className="mt-2 text-base font-bold text-stone-900">
                            {formatCop(sub)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700 shadow-sm">
                <input
                  type="checkbox"
                  name="returningCustomer"
                  className="size-4 rounded border-stone-300 text-[#3d5240] focus:ring-[#3d5240]"
                />
                ¿Ya compraste antes?
              </label>

              <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Datos de envío
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Donde coordinamos la entrega
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm hover:bg-stone-100"
                  >
                    Guardar datos
                  </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Nombre
                    </span>
                    <input
                      name="firstName"
                      required
                      autoComplete="given-name"
                      placeholder="Escribí aquí…"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Apellido
                    </span>
                    <input
                      name="lastName"
                      required
                      autoComplete="family-name"
                      placeholder="Escribí aquí…"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Dirección
                    </span>
                    <input
                      name="address"
                      required
                      autoComplete="street-address"
                      placeholder="Calle, número, apto…"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Ciudad
                    </span>
                    <input
                      name="city"
                      required
                      autoComplete="address-level2"
                      placeholder="Escribí aquí…"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Código postal
                    </span>
                    <input
                      name="zipCode"
                      autoComplete="postal-code"
                      placeholder="Opcional"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Teléfono / WhatsApp
                    </span>
                    <input
                      name="mobile"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="Escribí aquí…"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-semibold text-stone-800">
                      Email
                    </span>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#6b7f6a]"
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="space-y-6 lg:col-span-1">
              <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-stone-900">
                  Resumen del pedido
                </h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <dt>Subtotal ({rows.length} {rows.length === 1 ? "ítem" : "ítems"})</dt>
                    <dd className="font-medium text-stone-900">{formatCop(total)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-stone-100 pt-3 text-base font-bold text-stone-900">
                    <dt>Total</dt>
                    <dd>{formatCop(total)}</dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-stone-800">
                    Cupón
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled
                      placeholder="Código de cupón"
                      className="min-w-0 flex-1 rounded-lg border-0 bg-stone-100 px-3 py-3 text-stone-400"
                    />
                    <button
                      type="button"
                      disabled
                      className="shrink-0 rounded-lg bg-[#3d5240] px-4 py-3 text-sm font-semibold text-white opacity-50"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-stone-900">
                  Método de pago
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  El cobro se completa de forma segura en Wompi
                </p>

                <fieldset className="mt-4 space-y-3">
                  <legend className="sr-only">Elegí método de pago</legend>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-[#f4f7f3] p-3 ring-2 ring-[#3d5240]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wompi"
                      defaultChecked
                      className="size-4 border-stone-300 text-[#3d5240] focus:ring-[#3d5240]"
                    />
                    <span className="text-sm font-medium text-stone-900">
                      Pago en línea (Wompi)
                    </span>
                  </label>
                  <label className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3 opacity-60">
                    <input
                      type="radio"
                      disabled
                      className="size-4 border-stone-300"
                    />
                    <span className="text-sm text-stone-600">
                      Contra entrega <span className="text-stone-400">(próximamente)</span>
                    </span>
                  </label>
                </fieldset>

                <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="font-medium text-stone-600">Aceptamos en Wompi:</span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-stone-600">
                    VISA
                  </span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-stone-600">
                    MC
                  </span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-stone-600">
                    PSE
                  </span>
                </p>

                <div className="mt-4 rounded-xl bg-[#faf9f7] p-4 ring-1 ring-stone-100">
                  <p className="text-sm text-stone-600">
                    Al continuar, se abre el checkout de Wompi. Ahí ingresás los datos
                    de tu tarjeta u otro medio; esta tienda no guarda números de tarjeta.
                  </p>
                </div>
              </section>

              <button
                type="submit"
                className="w-full rounded-full bg-[#3d5240] py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#556654]"
              >
                Continuar al pago seguro
              </button>
              <Link
                href="/cart"
                className="block w-full rounded-full border-2 border-stone-200 bg-white py-3.5 text-center text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                Volver al carrito
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
