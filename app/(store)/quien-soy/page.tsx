import Link from "next/link";
import { storeBrand } from "@/lib/brand";
import { storeShellClass } from "@/lib/store-layout";

export const metadata = {
  title: `Quién Soy | ${storeBrand}`,
};

export default function QuienSoyPage() {
  return (
    <div className={`${storeShellClass} py-12 sm:py-16`}>
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">
          Bio · {storeBrand}
        </p>
        <h1 className="font-store-display mt-4 text-4xl font-medium leading-tight tracking-tight text-stone-900 sm:text-5xl">
          Hola, soy{" "}
          <span className="italic font-normal">María Paz Estrada</span>.
        </h1>
        <p className="font-store-display mt-8 text-xl leading-snug text-stone-800 sm:text-2xl">
          Soy Ingeniera Civil de profesión y fundadora de María Paz Imports.
        </p>
        <p className="mt-6 text-[15px] leading-relaxed text-stone-600 sm:text-base">
          Siempre me han apasionado las ventas, descubrir las mejores ofertas y
          encontrar productos que realmente valen la pena. Esa pasión me llevó a
          crear esta tienda con un propósito muy claro: acercar a Colombia
          productos 100 % originales de Estados Unidos con precios justos y una
          experiencia de compra en la que puedas confiar.
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-stone-600 sm:text-base">
          En María Paz Imports cada producto es seleccionado cuidadosamente y
          cada cliente es atendido con dedicación, porque creo que los pequeños
          detalles hacen la diferencia.
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-stone-600 sm:text-base">
          Gracias por estar aquí y por confiar en mi tienda. Será un gusto
          acompañarte en cada compra.
        </p>
        <Link
          href="/products"
          className="mt-10 inline-flex border border-stone-900 bg-stone-900 px-8 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-stone-900"
        >
          Ver la tienda
        </Link>
      </div>
    </div>
  );
}
