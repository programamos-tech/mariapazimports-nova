"use client";

import Image from "next/image";
import { useState } from "react";
import {
  AdminDateInput,
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
import { PRODUCT_COLOR_OPTIONS, productColorSwatchClass } from "@/lib/product-colors";

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
  sizeValue: number | null;
  sizeUnit: string;
  hasExpiration: boolean;
  expirationDate: string;
  hasVat: boolean;
  vatPercent: number | null;
  colors: string[];
  fragranceOptionsCsv: string;
  fragranceOptionImagesJson: string;
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
  const [sizeValue, setSizeValue] = useState(
    initial.sizeValue == null ? "" : String(initial.sizeValue),
  );
  const [sizeUnit, setSizeUnit] = useState(initial.sizeUnit || "ml");
  const [hasExpiration, setHasExpiration] = useState(initial.hasExpiration);
  const [expirationDate, setExpirationDate] = useState(initial.expirationDate);
  const [hasVat, setHasVat] = useState(initial.hasVat);
  const [vatPercent, setVatPercent] = useState(
    initial.vatPercent == null ? "" : String(initial.vatPercent),
  );
  const [selectedColors, setSelectedColors] = useState(initial.colors);
  const [fragranceCsv, setFragranceCsv] = useState(initial.fragranceOptionsCsv);
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
          <section className="rounded-xl border border-zinc-200/90 bg-white p-6">
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
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100/60">
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
                        <span className="rounded-lg border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ep-size-value" className={labelClass}>
                    Tamaño / contenido (opcional)
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      id="ep-size-value"
                      name="size_value"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={sizeValue}
                      onChange={(e) => setSizeValue(e.target.value)}
                      className={inputClass}
                    />
                    <select
                      name="size_unit"
                      value={sizeUnit}
                      onChange={(e) => setSizeUnit(e.target.value)}
                      className={inputClass}
                    >
                      <option value="ml">ml</option>
                      <option value="l">L</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="oz">oz</option>
                      <option value="unidad">unidad</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Colores (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_COLOR_OPTIONS.map((color) => {
                      const checked = selectedColors.includes(color);
                      return (
                        <label
                          key={color}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                            checked
                              ? "border-[#3d5240] bg-[#eef3ee] text-[#3d5240]"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="colors"
                            value={color}
                            checked={checked}
                            onChange={(e) =>
                              setSelectedColors((prev) =>
                                e.target.checked
                                  ? [...prev, color]
                                  : prev.filter((c) => c !== color),
                              )
                            }
                            className="sr-only"
                          />
                          <span className={`size-3 rounded-full ${productColorSwatchClass(color)}`} />
                          {color}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="ep-fragrances" className={labelClass}>
                  Fragancias / tonos (opcional)
                </label>
                <textarea
                  id="ep-fragrances"
                  name="fragrance_options_csv"
                  rows={3}
                  value={fragranceCsv}
                  onChange={(e) => setFragranceCsv(e.target.value)}
                  placeholder="Una por línea o separadas por coma (ej. Vanilla Cashmere, Fresh & Cozy)"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ep-frag-img-json" className={labelClass}>
                  Imágenes por fragancia (JSON opcional)
                </label>
                <textarea
                  id="ep-frag-img-json"
                  name="fragrance_option_images_json"
                  rows={5}
                  defaultValue={initial.fragranceOptionImagesJson}
                  placeholder={`{\n  "Fresh & Cozy": "product-images/…/archivo.jpg"\n}`}
                  className={`${inputClass} font-mono text-xs`}
                />
                <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">
                  Misma clave de texto que cada fragancia; valor = ruta pública (igual que la imagen
                  principal del producto).
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    name="has_expiration"
                    checked={hasExpiration}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setHasExpiration(next);
                      if (!next) setExpirationDate("");
                    }}
                    className="rounded border-zinc-300 accent-zinc-900 focus:ring-zinc-200/80"
                  />
                  Tiene fecha de vencimiento
                </label>
                <div className={!hasExpiration ? "pointer-events-none opacity-60" : ""}>
                  <label htmlFor="ep-expiration" className={labelClass}>
                    Fecha de vencimiento
                  </label>
                  <AdminDateInput
                    id="ep-expiration"
                    name="expiration_date"
                    value={expirationDate}
                    onChange={setExpirationDate}
                    required={false}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    name="has_vat"
                    checked={hasVat}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setHasVat(next);
                      if (!next) setVatPercent("");
                    }}
                    className="rounded border-zinc-300 accent-zinc-900 focus:ring-zinc-200/80"
                  />
                  Maneja IVA
                </label>
                <div className={!hasVat ? "pointer-events-none opacity-60" : ""}>
                  <label htmlFor="ep-vat" className={labelClass}>
                    IVA del producto (%)
                  </label>
                  <input
                    id="ep-vat"
                    name="vat_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  name="is_published"
                  value="on"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-zinc-300 accent-zinc-900 focus:ring-zinc-200/80"
                />
                Publicado en la tienda
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <section className="rounded-xl border border-zinc-200/90 bg-white p-6">
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

          <section className="rounded-xl border border-zinc-200/90 bg-white p-6">
            <h2 className={sectionTitle}>Resumen del producto</h2>
            <div className="mt-4 rounded-lg border border-zinc-200/90 bg-white/60 p-4 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Producto
              </p>
              <dl className="mt-3 space-y-2 text-zinc-700">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Nombre</dt>
                  <dd className="max-w-[60%] truncate text-right text-zinc-900">
                    {name.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Referencia</dt>
                  <dd className="font-mono text-xs text-zinc-900">
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

            <div className="mt-5 border-t border-zinc-200/70 pt-5">
              <p className="text-xs font-medium text-zinc-500">Precio de venta</p>
              <p className="mt-1 text-2xl font-medium tabular-nums text-zinc-900">
                {formatCop(priceCents)}
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-zinc-200/70 pt-4 text-sm">
              <li className="flex justify-between text-zinc-600">
                <span>Costo</span>
                <span className="tabular-nums text-zinc-900">
                  {formatCop(costCents)}
                </span>
              </li>
              <li className="flex justify-between font-medium text-zinc-900">
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
              className="mt-4 w-full rounded-lg border border-zinc-900 bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Guardar cambios
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
