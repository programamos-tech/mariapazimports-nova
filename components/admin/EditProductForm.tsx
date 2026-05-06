"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ProductMoneyInput,
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import type { ProductCategoryOption } from "@/components/admin/NewProductForm";
import { formatCop } from "@/lib/money";
import {
  assertProductImageSize,
  blockSubmitIfImageTooLarge,
  MAX_PRODUCT_IMAGE_BYTES,
} from "@/lib/product-image-upload";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

type Initial = {
  name: string;
  reference: string;
  description: string;
  brand: string;
  categoryId: string;
  priceCents: number;
  costCents: number;
  stockLocal: number;
  stockWarehouse: number;
  isPublished: boolean;
};

type Props = {
  formAction: (formData: FormData) => void;
  categories: ProductCategoryOption[];
  initial: Initial;
  currentImageUrl: string | null;
};

export function EditProductForm({
  formAction,
  categories,
  initial,
  currentImageUrl,
}: Props) {
  const [name, setName] = useState(initial.name);
  const [reference, setReference] = useState(initial.reference);
  const [description, setDescription] = useState(initial.description);
  const [brand, setBrand] = useState(initial.brand);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [costCents, setCostCents] = useState(initial.costCents);
  const [priceCents, setPriceCents] = useState(initial.priceCents);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [fileLabel, setFileLabel] = useState("Ningún archivo seleccionado");

  const categoryLabel =
    categories.find((c) => c.id === categoryId)?.name ?? "—";

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        if (blockSubmitIfImageTooLarge(e.currentTarget)) {
          e.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="stock_local"
        value={String(initial.stockLocal)}
      />
      <input
        type="hidden"
        name="stock_warehouse"
        value={String(initial.stockWarehouse)}
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className={sectionTitle}>Información básica</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="ep-name" className={labelClass}>
                  Nombre del producto <span className="text-red-600">*</span>
                </label>
                <input
                  id="ep-name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ep-ref" className={labelClass}>
                  Referencia <span className="text-red-600">*</span>
                </label>
                <input
                  id="ep-ref"
                  name="reference"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ep-desc" className={labelClass}>
                  Descripción (opcional)
                </label>
                <textarea
                  id="ep-desc"
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <span className={labelClass}>Imagen (catálogo en línea)</span>
                <div className="flex flex-wrap items-start gap-4">
                  {currentImageUrl ? (
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                      <Image
                        src={currentImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized={shouldUnoptimizeStorageImageUrl(
                          currentImageUrl,
                        )}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer">
                        <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-100">
                          Seleccionar archivo
                        </span>
                        <input
                          name="image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            const msg = assertProductImageSize(f ?? undefined);
                            if (msg) {
                              alert(msg);
                              e.target.value = "";
                              setFileLabel("Ningún archivo seleccionado");
                              return;
                            }
                            setFileLabel(f ? f.name : "Ningún archivo seleccionado");
                          }}
                        />
                      </label>
                      <span className="text-sm text-zinc-500">{fileLabel}</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      JPG, PNG o WebP. Máx. {MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)} MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ep-brand" className={labelClass}>
                    Marca (opcional)
                  </label>
                  <input
                    id="ep-brand"
                    name="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ep-cat" className={labelClass}>
                    Categoría (opcional)
                  </label>
                  <select
                    id="ep-cat"
                    name="category_id"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  name="is_published"
                  value="on"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300"
                />
                Publicado en la tienda
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className={sectionTitle}>Información financiera</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass}>
                  Costo de compra <span className="text-red-600">*</span>
                </label>
                <ProductMoneyInput
                  name="cost_cents"
                  value={costCents}
                  onChange={setCostCents}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  Precio de venta <span className="text-red-600">*</span>
                </label>
                <ProductMoneyInput
                  name="price_cents"
                  value={priceCents}
                  onChange={setPriceCents}
                  required
                />
              </div>
              <p className="text-xs text-zinc-500">
                Este producto no podrá ser vendido por menos del valor de precio de venta.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className={sectionTitle}>Resumen del producto</h2>
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                Producto
              </p>
              <dl className="mt-3 space-y-2 text-zinc-700">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Nombre</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-zinc-900">
                    {name.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Referencia</dt>
                  <dd className="font-mono text-xs font-medium text-zinc-900">
                    {reference.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Categoría</dt>
                  <dd className="max-w-[55%] truncate text-right text-zinc-800">
                    {categoryLabel}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 border-t border-zinc-100 pt-5">
              <p className="text-xs font-medium text-zinc-500">Precio de venta</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                {formatCop(priceCents)}
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-zinc-100 pt-4 text-sm">
              <li className="flex justify-between text-zinc-600">
                <span>Costo</span>
                <span className="tabular-nums font-medium text-zinc-900">
                  {formatCop(costCents)}
                </span>
              </li>
              <li className="flex justify-between font-semibold text-zinc-900">
                <span>Precio venta</span>
                <span className="tabular-nums">{formatCop(priceCents)}</span>
              </li>
            </ul>

            <p className="mt-5 text-xs font-medium text-zinc-500">
              Guardar cambios
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Se actualizarán los datos del producto en el catálogo. El stock se ajusta
              desde <span className="font-medium text-zinc-700">Inventario</span> con
              Actualizar stock.
            </p>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Guardar cambios
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
