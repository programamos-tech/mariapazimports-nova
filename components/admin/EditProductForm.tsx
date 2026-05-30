"use client";

import { useCallback, useState } from "react";
import { ProductCatalogImagesField } from "@/components/admin/ProductCatalogImagesField";
import {
  AdminDateInput,
  ProductMoneyInput,
  ProductQuantityInput,
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import type { ProductCategoryOption } from "@/components/admin/NewProductForm";
import {
  ProductVariantRows,
  type VariantFormTotals,
  type VariantRowInitial,
} from "@/components/admin/ProductVariantRows";
import { formatCop, formatQuantityInputGrouping } from "@/lib/money";
import { blockSubmitIfImageTooLarge } from "@/lib/product-image-upload";
import type { ProductVariantAxis } from "@/lib/product-variants";
import {
  STOCK_LOCAL_LABEL,
  STOCK_TOTAL_SUMMARY,
  STOCK_WAREHOUSE_LABEL,
} from "@/lib/stock-locations";

const cardClass =
  "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

const summaryInset =
  "mt-4 rounded-lg border border-zinc-200/90 bg-white/60 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950/60";

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
  variantAxis: ProductVariantAxis;
  variantRows: VariantRowInitial[];
  hasExpiration: boolean;
  expirationDate: string;
  hasVat: boolean;
  vatPercent: number | null;
  colors: string[];
};

type CatalogImageExisting = {
  path: string;
  previewUrl: string | null;
};

type Props = {
  formAction: (formData: FormData) => void;
  categories: ProductCategoryOption[];
  initial: Initial;
  catalogImagesExisting: CatalogImageExisting[];
};

export function EditProductForm({
  formAction,
  categories,
  initial,
  catalogImagesExisting,
}: Props) {
  const [name, setName] = useState(initial.name);
  const [reference, setReference] = useState(initial.reference);
  const [description, setDescription] = useState(initial.description);
  const [brand, setBrand] = useState(initial.brand);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [costCents, setCostCents] = useState(initial.costCents);
  const [priceCents, setPriceCents] = useState(initial.priceCents);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [hasExpiration, setHasExpiration] = useState(initial.hasExpiration);
  const [expirationDate, setExpirationDate] = useState(initial.expirationDate);
  const [hasVat, setHasVat] = useState(initial.hasVat);
  const [vatPercent, setVatPercent] = useState(
    initial.vatPercent == null ? "" : String(initial.vatPercent),
  );
  const [stockManagedByVariants, setStockManagedByVariants] = useState(
    initial.variantAxis !== "none",
  );
  const [variantStockLocal, setVariantStockLocal] = useState(initial.stockLocal);
  const [variantStockWarehouse, setVariantStockWarehouse] = useState(
    initial.stockWarehouse,
  );
  const [variantMinPriceCents, setVariantMinPriceCents] = useState(initial.priceCents);
  const [variantMinCostCents, setVariantMinCostCents] = useState(initial.costCents);

  const handleVariantTotalsChange = useCallback((totals: VariantFormTotals) => {
    setStockManagedByVariants(totals.usesVariants);
    setVariantStockLocal(totals.stockLocal);
    setVariantStockWarehouse(totals.stockWarehouse);
    setVariantMinPriceCents(totals.minPriceCents);
    setVariantMinCostCents(totals.minCostCents);
  }, []);

  const effectiveStockLocal = stockManagedByVariants
    ? variantStockLocal
    : initial.stockLocal;
  const effectiveStockWarehouse = stockManagedByVariants
    ? variantStockWarehouse
    : initial.stockWarehouse;
  const effectivePriceCents = stockManagedByVariants ? variantMinPriceCents : priceCents;
  const effectiveCostCents = stockManagedByVariants ? variantMinCostCents : costCents;
  const totalStock = effectiveStockLocal + effectiveStockWarehouse;
  const fmtStock = (n: number) =>
    n <= 0 ? "0" : formatQuantityInputGrouping(n);

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
        value={String(effectiveStockLocal)}
      />
      <input
        type="hidden"
        name="stock_warehouse"
        value={String(effectiveStockWarehouse)}
      />
      <input type="hidden" name="cost_cents" value={String(effectiveCostCents)} />
      <input type="hidden" name="price_cents" value={String(effectivePriceCents)} />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <section className={cardClass}>
            <h2 className={sectionTitle}>Información básica</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="ep-name" className={labelClass}>
                  Nombre del producto <span className="text-red-600 dark:text-red-400">*</span>
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
                  Referencia <span className="text-red-600 dark:text-red-400">*</span>
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

              <ProductCatalogImagesField
                label="Imágenes (catálogo en línea)"
                initialExisting={catalogImagesExisting}
              />

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
              <ProductVariantRows
                initialAxis={initial.variantAxis}
                initialRows={initial.variantRows}
                onVariantTotalsChange={handleVariantTotalsChange}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    name="has_expiration"
                    checked={hasExpiration}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setHasExpiration(next);
                      if (!next) setExpirationDate("");
                    }}
                    className="rounded border-zinc-300 accent-zinc-900 focus:ring-zinc-200/80 dark:border-zinc-600 dark:accent-zinc-100 dark:focus:ring-zinc-600/40"
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
                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    name="has_vat"
                    checked={hasVat}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setHasVat(next);
                      if (!next) setVatPercent("");
                    }}
                    className="rounded border-zinc-300 accent-zinc-900 focus:ring-zinc-200/80 dark:border-zinc-600 dark:accent-zinc-100 dark:focus:ring-zinc-600/40"
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

              <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  name="is_published"
                  value="on"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-zinc-300 accent-zinc-900 focus:ring-zinc-200/80 dark:border-zinc-600 dark:accent-zinc-100 dark:focus:ring-zinc-600/40"
                />
                Publicado en la tienda
              </label>
            </div>
          </section>

          {stockManagedByVariants ? (
            <section className={cardClass}>
              <h2 className={sectionTitle}>Control de stock</h2>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Total calculado automáticamente desde las presentaciones. Indica el stock
                en cada fila de arriba.
              </p>
              <div className="pointer-events-none mt-5 grid gap-4 opacity-75 sm:grid-cols-2">
                <div>
                  <label htmlFor="ep-sl" className={labelClass}>
                    {STOCK_LOCAL_LABEL}
                  </label>
                  <ProductQuantityInput
                    id="ep-sl"
                    name="stock_local_display"
                    value={effectiveStockLocal}
                    onChange={() => {}}
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="ep-sw" className={labelClass}>
                    {STOCK_WAREHOUSE_LABEL}
                  </label>
                  <ProductQuantityInput
                    id="ep-sw"
                    name="stock_warehouse_display"
                    value={effectiveStockWarehouse}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-zinc-200/90 bg-white/60 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-200">
                Total:{" "}
                <span className="font-medium tabular-nums">
                  {fmtStock(totalStock)} unidades
                </span>{" "}
                ({STOCK_TOTAL_SUMMARY})
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Cada presentación tiene su propio stock. Aquí ves la suma de todas las filas
                con etiqueta.
              </p>
            </section>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <section className={cardClass}>
            <h2 className={sectionTitle}>Información financiera</h2>
            {stockManagedByVariants ? (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Con presentaciones, indica costo y precio en cada fila de arriba. Aquí ves el
                valor mínimo de venta (como en la tienda: «Desde $X»).
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Precio y costo únicos para este producto.
              </p>
            )}
            <div
              className={`mt-5 space-y-4${stockManagedByVariants ? " pointer-events-none opacity-75" : ""}`}
            >
              <div>
                <label className={labelClass}>
                  Costo de compra{" "}
                  {!stockManagedByVariants ? (
                    <span className="text-red-600 dark:text-red-400">*</span>
                  ) : null}
                </label>
                <ProductMoneyInput
                  name={stockManagedByVariants ? "cost_cents_display" : "cost_cents"}
                  value={effectiveCostCents}
                  onChange={setCostCents}
                  required={!stockManagedByVariants}
                  disabled={stockManagedByVariants}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Precio de venta{" "}
                  {!stockManagedByVariants ? (
                    <span className="text-red-600 dark:text-red-400">*</span>
                  ) : null}
                </label>
                <ProductMoneyInput
                  name={stockManagedByVariants ? "price_cents_display" : "price_cents"}
                  value={effectivePriceCents}
                  onChange={setPriceCents}
                  required={!stockManagedByVariants}
                  disabled={stockManagedByVariants}
                />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={sectionTitle}>Resumen del producto</h2>
            <div className={summaryInset}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                Producto
              </p>
              <dl className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-300">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Nombre</dt>
                  <dd className="max-w-[60%] truncate text-right text-zinc-900 dark:text-zinc-100">
                    {name.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Referencia</dt>
                  <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                    {reference.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Categoría</dt>
                  <dd className="max-w-[55%] truncate text-right text-zinc-800 dark:text-zinc-100">
                    {categoryLabel}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 border-t border-zinc-200/70 pt-5 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {stockManagedByVariants ? "Precio desde" : "Precio de venta"}
              </p>
              <p className="mt-1 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {stockManagedByVariants && effectivePriceCents > 0
                  ? `Desde ${formatCop(effectivePriceCents)}`
                  : formatCop(effectivePriceCents)}
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-zinc-200/70 pt-4 text-sm dark:border-zinc-800">
              <li className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{stockManagedByVariants ? "Costo mínimo" : "Costo"}</span>
                <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatCop(effectiveCostCents)}
                </span>
              </li>
              <li className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100">
                <span>{stockManagedByVariants ? "Precio desde" : "Precio venta"}</span>
                <span className="tabular-nums">{formatCop(effectivePriceCents)}</span>
              </li>
            </ul>

            <p className="mt-5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Guardar cambios
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Se actualizarán los datos del producto en el catálogo. El stock se ajusta desde{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Inventario</span> con
              Actualizar stock.
            </p>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg border border-zinc-900 bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              Guardar cambios
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
