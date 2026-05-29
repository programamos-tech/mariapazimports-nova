"use client";

import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ProductMoneyInput,
  ProductQuantityInput,
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";
import {
  assertProductImageSize,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES_PER_GROUP,
} from "@/lib/product-image-upload";
import {
  formatSizeVariantLabel,
  VARIANT_AXIS_OPTIONS,
  type ProductVariantAxis,
} from "@/lib/product-variants";
import { SIZE_UNITS, type SizeUnit } from "@/lib/product-size-options";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export type VariantRowInitial = {
  id?: string | null;
  label: string;
  costCents: number;
  priceCents: number;
  stockWarehouse: number;
  stockLocal: number;
  existingImagePaths?: string[];
  previewUrls?: (string | null)[];
  sizeValue?: string;
  sizeUnit?: SizeUnit;
};

type PickedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type RowState = {
  id: string;
  label: string;
  costCents: number;
  priceCents: number;
  stockWarehouse: number;
  stockLocal: number;
  existingPaths: string[];
  serverPreviewUrls: (string | null)[];
  picked: PickedImage[];
  sizeValue: string;
  sizeUnit: SizeUnit;
};

export type VariantFormTotals = {
  usesVariants: boolean;
  stockLocal: number;
  stockWarehouse: number;
  minPriceCents: number;
  minCostCents: number;
};

/** @deprecated Use VariantFormTotals */
export type VariantStockTotals = VariantFormTotals & {
  usesVariantStock: boolean;
};

type Props = {
  initialAxis?: ProductVariantAxis;
  initialRows?: VariantRowInitial[];
  onVariantTotalsChange?: (totals: VariantFormTotals) => void;
  /** @deprecated Use onVariantTotalsChange */
  onStockTotalsChange?: (totals: VariantStockTotals) => void;
};

function emptyRow(): RowState {
  return {
    id: "",
    label: "",
    costCents: 0,
    priceCents: 0,
    stockWarehouse: 0,
    stockLocal: 0,
    existingPaths: [],
    serverPreviewUrls: [],
    picked: [],
    sizeValue: "",
    sizeUnit: "ml",
  };
}

function toRowState(rows: VariantRowInitial[]): RowState[] {
  if (rows.length === 0) return [emptyRow()];
  return rows.map((r) => {
    const paths =
      r.existingImagePaths?.filter((p) => p?.trim()) ?? [];
    const previews =
      r.previewUrls ?? paths.map(() => null);
    return {
      id: r.id?.trim() ?? "",
      label: r.label,
      costCents: r.costCents,
      priceCents: r.priceCents,
      stockWarehouse: r.stockWarehouse,
      stockLocal: r.stockLocal,
      existingPaths: paths,
      serverPreviewUrls: previews,
      picked: [],
      sizeValue: r.sizeValue ?? "",
      sizeUnit: r.sizeUnit ?? "ml",
    };
  });
}

function newPickId() {
  return `vp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeVariantFormTotals(
  axis: ProductVariantAxis,
  rows: RowState[],
): VariantFormTotals {
  if (axis === "none") {
    return {
      usesVariants: false,
      stockLocal: 0,
      stockWarehouse: 0,
      minPriceCents: 0,
      minCostCents: 0,
    };
  }
  let stockLocal = 0;
  let stockWarehouse = 0;
  let minPrice = Number.POSITIVE_INFINITY;
  let minCost = Number.POSITIVE_INFINITY;
  for (const row of rows) {
    if (!row.label.trim()) continue;
    stockLocal += Math.max(0, Math.floor(row.stockLocal));
    stockWarehouse += Math.max(0, Math.floor(row.stockWarehouse));
    minPrice = Math.min(minPrice, Math.max(0, Math.floor(row.priceCents)));
    minCost = Math.min(minCost, Math.max(0, Math.floor(row.costCents)));
  }
  return {
    usesVariants: true,
    stockLocal,
    stockWarehouse,
    minPriceCents: Number.isFinite(minPrice) ? minPrice : 0,
    minCostCents: Number.isFinite(minCost) ? minCost : 0,
  };
}

export function ProductVariantRows({
  initialAxis = "none",
  initialRows = [],
  onVariantTotalsChange,
  onStockTotalsChange,
}: Props) {
  const [axis, setAxis] = useState<ProductVariantAxis>(initialAxis);
  const [rows, setRows] = useState<RowState[]>(() => toRowState(initialRows));
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const showRows = axis !== "none";

  const revokeBlob = (url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  };

  const syncRowFileInput = (rowIndex: number, files: File[]) => {
    const el = fileInputRefs.current.get(rowIndex);
    if (!el) return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    el.files = dt.files;
  };

  useEffect(() => {
    rows.forEach((row, i) => {
      syncRowFileInput(i, row.picked.map((p) => p.file));
    });
  }, [rows]);

  useEffect(() => {
    const set = blobUrlsRef.current;
    return () => {
      for (const u of set) URL.revokeObjectURL(u);
      set.clear();
    };
  }, []);

  useEffect(() => {
    const totals = computeVariantFormTotals(axis, rows);
    onVariantTotalsChange?.(totals);
    onStockTotalsChange?.({
      ...totals,
      usesVariantStock: totals.usesVariants,
    });
  }, [axis, rows, onVariantTotalsChange, onStockTotalsChange]);

  const add = () => setRows((prev) => [...prev, emptyRow()]);

  const remove = (i: number) =>
    setRows((prev) => {
      const dropped = prev[i];
      if (dropped) {
        for (const p of dropped.picked) revokeBlob(p.previewUrl);
      }
      return prev.length <= 1 ? [emptyRow()] : prev.filter((_, j) => j !== i);
    });

  const patchRow = (i: number, patch: Partial<RowState>) =>
    setRows((prev) =>
      prev.map((row, j) => (j === i ? { ...row, ...patch } : row)),
    );

  const onSizeChange = (i: number, value: string, unit: SizeUnit) => {
    const label = formatSizeVariantLabel(Number(value), unit);
    patchRow(i, {
      sizeValue: value,
      sizeUnit: unit,
      label: label || rows[i]?.label || "",
    });
  };

  const removeExistingPath = (rowIndex: number, path: string) => {
    setRows((prev) =>
      prev.map((row, j) => {
        if (j !== rowIndex) return row;
        const idx = row.existingPaths.indexOf(path);
        return {
          ...row,
          existingPaths: row.existingPaths.filter((p) => p !== path),
          serverPreviewUrls: row.serverPreviewUrls.filter((_, k) => k !== idx),
        };
      }),
    );
  };

  const removePicked = (rowIndex: number, pickId: string) => {
    setRows((prev) =>
      prev.map((row, j) => {
        if (j !== rowIndex) return row;
        const item = row.picked.find((p) => p.id === pickId);
        if (item) revokeBlob(item.previewUrl);
        return { ...row, picked: row.picked.filter((p) => p.id !== pickId) };
      }),
    );
  };

  const onPickImages = (rowIndex: number, fileList: FileList | null) => {
    if (!fileList?.length) return;
    const row = rows[rowIndex];
    if (!row) return;
    const total = row.existingPaths.length + row.picked.length;
    const slots = MAX_PRODUCT_IMAGES_PER_GROUP - total;
    if (slots <= 0) {
      alert(`Máximo ${MAX_PRODUCT_IMAGES_PER_GROUP} imágenes por presentación.`);
      return;
    }
    const toAdd: PickedImage[] = [];
    for (let i = 0; i < fileList.length && toAdd.length < slots; i++) {
      const file = fileList[i];
      const msg = assertProductImageSize(file);
      if (msg) {
        alert(msg);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(previewUrl);
      toAdd.push({ id: newPickId(), file, previewUrl });
    }
    if (toAdd.length === 0) return;
    setRows((prev) =>
      prev.map((r, j) =>
        j === rowIndex ? { ...r, picked: [...r.picked, ...toAdd] } : r,
      ),
    );
  };

  return (
    <div>
      <label htmlFor="variant-axis" className={productLabelClass}>
        Tipo de presentación
      </label>
      <select
        id="variant-axis"
        name="variant_axis"
        value={axis}
        onChange={(e) => {
          const next = e.target.value as ProductVariantAxis;
          setAxis(next);
          if (next !== "none" && rows.every((r) => !r.label.trim())) {
            setRows([emptyRow()]);
          }
        }}
        className={`${productInputClass} mt-1.5 max-w-md`}
      >
        {VARIANT_AXIS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {showRows ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Cada presentación es un SKU: define su costo, precio de venta e inventario. El
            cliente elige una opción en la tienda.
          </p>
          {rows.map((row, i) => {
            const totalImages = row.existingPaths.length + row.picked.length;
            const atMax = totalImages >= MAX_PRODUCT_IMAGES_PER_GROUP;

            return (
              <div
                key={i}
                className="rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-3 dark:border-zinc-700 dark:bg-zinc-950/50 sm:p-4"
              >
                <input type="hidden" name="variant_id" value={row.id} />
                <input
                  type="hidden"
                  name="variant_images_existing"
                  value={JSON.stringify(row.existingPaths)}
                />

                {axis === "size" ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={row.sizeValue}
                      onChange={(e) =>
                        onSizeChange(i, e.target.value, row.sizeUnit)
                      }
                      placeholder="110"
                      className={`${productInputClass} min-w-0 sm:max-w-[8rem]`}
                    />
                    <select
                      value={row.sizeUnit}
                      onChange={(e) =>
                        onSizeChange(
                          i,
                          row.sizeValue,
                          e.target.value as SizeUnit,
                        )
                      }
                      className={`${productInputClass} w-full shrink-0 sm:w-36`}
                    >
                      {SIZE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <input
                      name="variant_label"
                      value={row.label}
                      onChange={(e) => patchRow(i, { label: e.target.value })}
                      placeholder="Etiqueta visible (ej. 110 ml)"
                      className={`${productInputClass} min-w-0 flex-1`}
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex gap-2">
                    <input
                      name="variant_label"
                      value={row.label}
                      onChange={(e) => patchRow(i, { label: e.target.value })}
                      placeholder={
                        axis === "fragrance"
                          ? "Nombre de la fragancia"
                          : axis === "tone"
                            ? "Nombre del tono"
                            : axis === "color"
                              ? "Nombre del color"
                              : "Etiqueta de la presentación"
                      }
                      autoComplete="off"
                      className={`${productInputClass} min-w-0 flex-1`}
                    />
                  </div>
                )}

                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Costo de compra
                    </span>
                    <ProductMoneyInput
                      name="variant_cost_cents"
                      value={row.costCents}
                      onChange={(v) => patchRow(i, { costCents: v })}
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Precio de venta
                    </span>
                    <ProductMoneyInput
                      name="variant_price_cents"
                      value={row.priceCents}
                      onChange={(v) => patchRow(i, { priceCents: v })}
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Stock bodega
                    </span>
                    <ProductQuantityInput
                      name="variant_stock_warehouse"
                      value={row.stockWarehouse}
                      onChange={(v) => patchRow(i, { stockWarehouse: v })}
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Stock local
                    </span>
                    <ProductQuantityInput
                      name="variant_stock_local"
                      value={row.stockLocal}
                      onChange={(v) => patchRow(i, { stockLocal: v })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    aria-label="Quitar presentación"
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                  </button>
                </div>

                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(i, el);
                    else fileInputRefs.current.delete(i);
                  }}
                  name={`variant_option_image_${i}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                />

                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Imágenes (máx. {MAX_PRODUCT_IMAGES_PER_GROUP})
                  </label>
                  {totalImages > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {row.existingPaths.map((path, k) => {
                        const src = row.serverPreviewUrls[k] ?? null;
                        return (
                          <div
                            key={`ex-${path}`}
                            className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
                          >
                            {src ? (
                              <Image
                                src={src}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized={shouldUnoptimizeStorageImageUrl(src)}
                              />
                            ) : null}
                            <button
                              type="button"
                              onClick={() => removeExistingPath(i, path)}
                              className="absolute inset-x-0 bottom-0 bg-zinc-900/75 py-0.5 text-[9px] font-medium text-white"
                            >
                              Quitar
                            </button>
                          </div>
                        );
                      })}
                      {row.picked.map((item) => (
                        <div
                          key={item.id}
                          className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePicked(i, item.id)}
                            className="absolute inset-x-0 bottom-0 bg-zinc-900/75 py-0.5 text-[9px] font-medium text-white"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <label
                    className={
                      atMax
                        ? "inline-flex cursor-not-allowed opacity-50"
                        : "inline-flex cursor-pointer"
                    }
                  >
                    <span className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                      {totalImages === 0 ? "Seleccionar imágenes" : "Añadir imágenes"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={atMax}
                      className="sr-only"
                      onChange={(e) => {
                        onPickImages(i, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    JPG, PNG o WebP. Máx. {MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)} MB
                  </p>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-300"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            Añadir presentación
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Añade todas las presentaciones que vendes (tamaños, fragancias, tonos, etc.).
          </p>
        </div>
      ) : null}
    </div>
  );
}
