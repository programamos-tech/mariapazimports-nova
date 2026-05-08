"use client";

import Link from "next/link";
import { useState } from "react";
import {
  createStoreCoupon,
  deleteStoreCoupon,
  updateStoreCoupon,
} from "@/app/actions/admin/store-coupons";
import {
  CouponProductPicker,
  type CouponProductPickerHit,
} from "@/components/admin/CouponProductPicker";
import { AdminDateInput } from "@/components/admin/product-form-primitives";
import type { StoreCouponRow } from "@/lib/store-coupons";
import { storeCouponToDateInputValue } from "@/lib/store-coupons";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-900";
const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300/50";
const sectionTitle =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400";
const cardClass = "rounded-xl border border-zinc-200/90 bg-white p-4 sm:p-6";

export function NewCouponHeader() {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/admin/coupons" className="hover:text-zinc-800">
            Cupones
          </Link>
          <span className="mx-1.5 text-zinc-300">/</span>
          <span className="text-zinc-700">Nuevo cupón</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">
          Nuevo cupón
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Define el mensaje de la franja superior, el código y el descuento que se aplicará en el
          checkout.
        </p>
      </div>
      <Link
        href="/admin/coupons"
        className="inline-flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:bg-white hover:text-zinc-900 sm:self-auto"
        aria-label="Volver al listado"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export function NewCouponForm() {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  return (
    <form action={createStoreCoupon} className="space-y-6">
      <section className={cardClass}>
        <h2 className={sectionTitle}>Datos del cupón</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nc-internal" className={labelClass}>
              Nombre interno <span className="font-normal text-zinc-500">(opcional)</span>
            </label>
            <input
              id="nc-internal"
              name="internal_label"
              placeholder="Bienvenida, Día de las madres…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="nc-sort" className={labelClass}>
              Orden en franja <span className="font-normal text-zinc-500">(0 = primero)</span>
            </label>
            <input
              id="nc-sort"
              name="sort_order"
              type="number"
              min={0}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="nc-banner" className={labelClass}>
              Texto del banner <span className="text-red-600">*</span>
            </label>
            <input
              id="nc-banner"
              name="banner_message"
              required
              placeholder="Bienvenida: 10% OFF en tu primera compra"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="nc-code" className={labelClass}>
              Código <span className="text-red-600">*</span>
            </label>
            <input
              id="nc-code"
              name="code"
              required
              placeholder="BIENVENIDA10"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="nc-pct" className={labelClass}>
              Descuento (%)
            </label>
            <input
              id="nc-pct"
              name="discount_percent"
              type="number"
              min={0}
              max={100}
              defaultValue={10}
              className={inputClass}
            />
          </div>
          <CouponProductPicker
            initialSelected={[]}
            restrictInitially={false}
          />
          <div>
            <label htmlFor="nc-start" className={labelClass}>
              Inicio <span className="font-normal text-zinc-500">(día, opcional)</span>
            </label>
            <AdminDateInput
              id="nc-start"
              name="starts_at"
              value={startsAt}
              onChange={setStartsAt}
              allowEmpty
            />
          </div>
          <div>
            <label htmlFor="nc-end" className={labelClass}>
              Fin <span className="font-normal text-zinc-500">(día, opcional)</span>
            </label>
            <AdminDateInput
              id="nc-end"
              name="ends_at"
              value={endsAt}
              onChange={setEndsAt}
              allowEmpty
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            <input
              type="checkbox"
              name="is_enabled"
              defaultChecked
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            Cupón habilitado
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            <input
              type="checkbox"
              name="show_in_banner"
              defaultChecked
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            Mostrar en franja superior de la tienda
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Crear cupón
          </button>
          <Link
            href="/admin/coupons"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        </div>
      </section>
    </form>
  );
}

export function EditCouponHeader({ row }: { row: StoreCouponRow }) {
  const title = row.internal_label?.trim() || row.code;
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/admin/coupons" className="hover:text-zinc-800">
            Cupones
          </Link>
          <span className="mx-1.5 text-zinc-300">/</span>
          <span className="text-zinc-700">Editar</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Actualiza el mensaje, el código, las fechas o desactiva el cupón cuando termine la campaña.
        </p>
      </div>
      <Link
        href="/admin/coupons"
        className="inline-flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:bg-white hover:text-zinc-900 sm:self-auto"
        aria-label="Volver al listado"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export function EditCouponForm({
  row,
  linkedProducts,
}: {
  row: StoreCouponRow;
  linkedProducts: CouponProductPickerHit[];
}) {
  const [startsAt, setStartsAt] = useState(() =>
    storeCouponToDateInputValue(row.starts_at),
  );
  const [endsAt, setEndsAt] = useState(() =>
    storeCouponToDateInputValue(row.ends_at),
  );

  return (
    <form action={updateStoreCoupon} className="space-y-6">
      <input type="hidden" name="id" value={row.id} />
      <section className={cardClass}>
        <h2 className={sectionTitle}>Datos del cupón</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ec-internal" className={labelClass}>
              Nombre interno <span className="font-normal text-zinc-500">(opcional)</span>
            </label>
            <input
              id="ec-internal"
              name="internal_label"
              defaultValue={row.internal_label ?? ""}
              placeholder="Bienvenida, Día de las madres…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ec-sort" className={labelClass}>
              Orden en franja
            </label>
            <input
              id="ec-sort"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={row.sort_order}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ec-banner" className={labelClass}>
              Texto del banner <span className="text-red-600">*</span>
            </label>
            <input
              id="ec-banner"
              name="banner_message"
              required
              defaultValue={row.banner_message}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ec-code" className={labelClass}>
              Código <span className="text-red-600">*</span>
            </label>
            <input
              id="ec-code"
              name="code"
              required
              defaultValue={row.code}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="ec-pct" className={labelClass}>
              Descuento (%)
            </label>
            <input
              id="ec-pct"
              name="discount_percent"
              type="number"
              min={0}
              max={100}
              defaultValue={row.discount_percent}
              className={inputClass}
            />
          </div>
          <CouponProductPicker
            key={row.id}
            initialSelected={linkedProducts}
            restrictInitially={linkedProducts.length > 0}
          />
          <div>
            <label htmlFor="ec-start" className={labelClass}>
              Inicio <span className="font-normal text-zinc-500">(día, opcional)</span>
            </label>
            <AdminDateInput
              id="ec-start"
              name="starts_at"
              value={startsAt}
              onChange={setStartsAt}
              allowEmpty
            />
          </div>
          <div>
            <label htmlFor="ec-end" className={labelClass}>
              Fin <span className="font-normal text-zinc-500">(día, opcional)</span>
            </label>
            <AdminDateInput
              id="ec-end"
              name="ends_at"
              value={endsAt}
              onChange={setEndsAt}
              allowEmpty
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            <input
              type="checkbox"
              name="is_enabled"
              defaultChecked={row.is_enabled}
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            Cupón habilitado
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            <input
              type="checkbox"
              name="show_in_banner"
              defaultChecked={row.show_in_banner}
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            Mostrar en franja superior de la tienda
          </label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Guardar cambios
          </button>
          <Link
            href="/admin/coupons"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Volver al listado
          </Link>
          <button
            type="submit"
            formAction={deleteStoreCoupon}
            className="ml-auto inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Eliminar cupón
          </button>
        </div>
      </section>
    </form>
  );
}
