import Link from "next/link";
import { storeBrand } from "@/lib/brand";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Ajustes
        </h1>
        <p className="mt-2 text-stone-600">
          Identidad y variables de entorno de la tienda.
        </p>
      </div>
      <div className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-stone-200/80">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Nombre de la tienda
          </p>
          <p className="mt-1 text-stone-900">{storeBrand}</p>
          <p className="mt-2 text-sm text-stone-600">
            Definido por{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs ring-1 ring-zinc-200/80">
              NEXT_PUBLIC_STORE_NAME
            </code>{" "}
            en <code className="text-xs">.env.local</code>.
          </p>
        </div>
        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Pagos
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Wompi: claves y webhook en variables de servidor. Revisá el README
            de la plantilla.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] hover:bg-zinc-50"
        >
          Abrir tienda
        </Link>
      </div>
    </div>
  );
}
