"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { productLabelClass } from "@/components/admin/product-form-primitives";
import {
  assertProductImageSize,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES_PER_GROUP,
} from "@/lib/product-image-upload";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

type ExistingItem = {
  path: string;
  previewUrl: string | null;
};

type PickedItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type Props = {
  label?: string;
  helperText?: string;
  initialExisting?: ExistingItem[];
};

function newPickId() {
  return `pick-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductCatalogImagesField({
  label = "Imágenes (catálogo en línea, opcional)",
  helperText = "Visible en el catálogo y ficha del producto. La primera imagen es la portada.",
  initialExisting = [],
}: Props) {
  const [existing, setExisting] = useState<ExistingItem[]>(initialExisting);
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const totalCount = existing.length + picked.length;
  const atMax = totalCount >= MAX_PRODUCT_IMAGES_PER_GROUP;

  const revokeBlob = (url: string) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  };

  const syncFileInput = (files: File[]) => {
    const el = fileInputRef.current;
    if (!el) return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    el.files = dt.files;
  };

  useEffect(() => {
    syncFileInput(picked.map((p) => p.file));
  }, [picked]);

  useEffect(() => {
    const set = blobUrlsRef.current;
    return () => {
      for (const u of set) URL.revokeObjectURL(u);
      set.clear();
    };
  }, []);

  const removeExisting = (path: string) => {
    setExisting((prev) => prev.filter((e) => e.path !== path));
  };

  const removePicked = (id: string) => {
    setPicked((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) revokeBlob(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const slots = MAX_PRODUCT_IMAGES_PER_GROUP - totalCount;
    if (slots <= 0) {
      alert(`Máximo ${MAX_PRODUCT_IMAGES_PER_GROUP} imágenes por producto.`);
      return;
    }
    const toAdd: PickedItem[] = [];
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
      alert(`Solo se añadieron ${slots} imagen(es). Máximo ${MAX_PRODUCT_IMAGES_PER_GROUP} en total.`);
    }
    if (toAdd.length > 0) setPicked((prev) => [...prev, ...toAdd]);
  };

  return (
    <div>
      <span className={productLabelClass}>{label}</span>

      {existing.map((item) => (
        <input
          key={`ex-${item.path}`}
          type="hidden"
          name="image_paths_existing"
          value={item.path}
        />
      ))}

      <input
        ref={fileInputRef}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      <div className="mt-2 flex flex-wrap gap-3">
        {existing.map((item) => {
          const src = item.previewUrl;
          return (
            <div
              key={item.path}
              className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100/60 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {src ? (
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={shouldUnoptimizeStorageImageUrl(src)}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-zinc-400">
                  Guardada
                </div>
              )}
              <button
                type="button"
                onClick={() => removeExisting(item.path)}
                className="absolute inset-x-0 bottom-0 bg-zinc-900/75 py-1 text-[10px] font-medium text-white"
              >
                Quitar
              </button>
            </div>
          );
        })}
        {picked.map((item) => (
          <div
            key={item.id}
            className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100/60 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
            <img src={item.previewUrl} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removePicked(item.id)}
              className="absolute inset-x-0 bottom-0 bg-zinc-900/75 py-1 text-[10px] font-medium text-white"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <label
          className={
            atMax
              ? "inline-flex cursor-not-allowed opacity-50"
              : "inline-flex cursor-pointer"
          }
        >
          <span className="rounded-lg border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
            {totalCount === 0 ? "Seleccionar imágenes" : "Añadir imágenes"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={atMax}
            className="sr-only"
            onChange={(e) => {
              onPickFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          JPG, PNG o WebP. Máx. {MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)} MB por archivo. Hasta{" "}
          {MAX_PRODUCT_IMAGES_PER_GROUP} imágenes ({totalCount}/{MAX_PRODUCT_IMAGES_PER_GROUP}).
          {helperText ? ` ${helperText}` : null}
        </p>
      </div>
    </div>
  );
}
