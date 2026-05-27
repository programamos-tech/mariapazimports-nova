"use client";

import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";
import {
  assertProductImageSize,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES_PER_GROUP,
} from "@/lib/product-image-upload";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export type FragranceRowInitial = {
  label: string;
  /** Rutas en storage (legacy: una sola). */
  existingImagePaths?: string[];
  /** Una sola ruta legacy. */
  existingImagePath?: string | null;
  previewUrls?: (string | null)[];
  /** Una sola URL legacy. */
  previewUrl?: string | null;
};

type PickedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type RowState = {
  label: string;
  existingPaths: string[];
  serverPreviewUrls: (string | null)[];
  picked: PickedImage[];
};

type Props = {
  initialRows: FragranceRowInitial[];
};

function normalizeInitialRow(r: FragranceRowInitial): {
  paths: string[];
  previews: (string | null)[];
} {
  const paths =
    r.existingImagePaths?.filter((p) => p?.trim()) ??
    (r.existingImagePath?.trim() ? [r.existingImagePath.trim()] : []);
  const previews =
    r.previewUrls ??
    (r.previewUrl?.trim() ? [r.previewUrl.trim()] : paths.map(() => null));
  return { paths, previews };
}

function toRowState(rows: FragranceRowInitial[]): RowState[] {
  if (rows.length === 0) {
    return [{ label: "", existingPaths: [], serverPreviewUrls: [], picked: [] }];
  }
  return rows.map((r) => {
    const { paths, previews } = normalizeInitialRow(r);
    return {
      label: r.label,
      existingPaths: paths,
      serverPreviewUrls: previews,
      picked: [],
    };
  });
}

function newPickId() {
  return `fp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductFragranceRows({ initialRows }: Props) {
  const [rows, setRows] = useState<RowState[]>(() => toRowState(initialRows));
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

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

  const add = () =>
    setRows((prev) => [
      ...prev,
      { label: "", existingPaths: [], serverPreviewUrls: [], picked: [] },
    ]);

  const remove = (i: number) =>
    setRows((prev) => {
      const dropped = prev[i];
      if (dropped) {
        for (const p of dropped.picked) revokeBlob(p.previewUrl);
      }
      const next =
        prev.length <= 1
          ? [{ label: "", existingPaths: [], serverPreviewUrls: [], picked: [] }]
          : prev.filter((_, j) => j !== i);
      return next;
    });

  const setLabel = (i: number, v: string) =>
    setRows((prev) =>
      prev.map((row, j) => (j === i ? { ...row, label: v } : row)),
    );

  const removeExistingPath = (rowIndex: number, path: string) => {
    setRows((prev) =>
      prev.map((row, j) => {
        if (j !== rowIndex) return row;
        const idx = row.existingPaths.indexOf(path);
        const existingPaths = row.existingPaths.filter((p) => p !== path);
        const serverPreviewUrls = row.serverPreviewUrls.filter((_, k) => k !== idx);
        return { ...row, existingPaths, serverPreviewUrls };
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
      alert(`Máximo ${MAX_PRODUCT_IMAGES_PER_GROUP} imágenes por fragancia.`);
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
    if (fileList.length > slots && toAdd.length === slots) {
      alert(`Solo se añadieron ${slots} imagen(es). Máximo ${MAX_PRODUCT_IMAGES_PER_GROUP} por opción.`);
    }
    if (toAdd.length === 0) return;
    setRows((prev) =>
      prev.map((r, j) =>
        j === rowIndex ? { ...r, picked: [...r.picked, ...toAdd] } : r,
      ),
    );
  };

  const clearAllStoredImages = (rowIndex: number) => {
    setRows((prev) =>
      prev.map((row, j) => {
        if (j !== rowIndex) return row;
        for (const p of row.picked) revokeBlob(p.previewUrl);
        return {
          ...row,
          existingPaths: [],
          serverPreviewUrls: [],
          picked: [],
        };
      }),
    );
  };

  return (
    <div>
      <span className={productLabelClass}>Fragancias / tonos (opcional)</span>
      <div className="mt-2 space-y-4">
        {rows.map((row, i) => {
          const totalImages = row.existingPaths.length + row.picked.length;
          const atMax = totalImages >= MAX_PRODUCT_IMAGES_PER_GROUP;
          const hasStored = row.existingPaths.length > 0 || row.serverPreviewUrls.some(Boolean);

          return (
            <div
              key={i}
              className="rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-3 dark:border-zinc-700 dark:bg-zinc-950/50 sm:p-4"
            >
              <div className="mb-3 flex gap-2">
                <input
                  name="fragrance_option"
                  value={row.label}
                  onChange={(e) => setLabel(i, e.target.value)}
                  placeholder="Nombre de la fragancia o tono"
                  autoComplete="off"
                  className={`${productInputClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                  aria-label="Quitar fragancia o tono"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>

              <input
                type="hidden"
                name="fragrance_images_existing"
                value={JSON.stringify(row.existingPaths)}
                aria-hidden
              />

              <input
                ref={(el) => {
                  if (el) fileInputRefs.current.set(i, el);
                  else fileInputRefs.current.delete(i);
                }}
                name={`fragrance_option_image_${i}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />

              <div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Imágenes para esta opción (opcional, máx. {MAX_PRODUCT_IMAGES_PER_GROUP})
                  </label>

                  {totalImages > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {row.existingPaths.map((path, k) => {
                        const src = row.serverPreviewUrls[k] ?? null;
                        return (
                          <div
                            key={`ex-${path}`}
                            className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
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
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-zinc-400">
                                OK
                              </div>
                            )}
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
                          className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
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
                    JPG, PNG o WebP. Máx. {MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)} MB ·{" "}
                    {totalImages}/{MAX_PRODUCT_IMAGES_PER_GROUP}
                  </p>
                </div>
              </div>

              {hasStored ? (
                <button
                  type="button"
                  onClick={() => clearAllStoredImages(i)}
                  className="mt-2 text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
                >
                  Quitar todas las imágenes guardadas
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
        Añadir fragancia o tono
      </button>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Cada nombre debe coincidir con lo que verá el cliente al elegir en la tienda. Podés subir
        hasta {MAX_PRODUCT_IMAGES_PER_GROUP} fotos distintas por cada fragancia o tono.
      </p>
    </div>
  );
}
