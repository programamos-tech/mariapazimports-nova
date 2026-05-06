"use client";

import Image from "next/image";
import {
  deleteStoreBanner,
  updateStoreBanner,
  uploadStoreBanner,
} from "@/app/actions/admin/store-banners";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import type { StoreBannerRow } from "@/lib/store-banners";
import { shouldUnoptimizeStorageImageUrl, storagePublicObjectUrl } from "@/lib/storage-public-url";

function errorText(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "file":
      return "Seleccioná un archivo de imagen.";
    case "size":
      return "El archivo supera 5 MB.";
    case "type":
      return "Solo se permiten imágenes JPEG, PNG, WebP o GIF.";
    case "upload":
      return "Error al subir a Storage. Revisá el bucket store-banners y permisos.";
    case "db":
      return "Error en la base de datos. Ejecutá la migración store_banners.";
    case "placement":
      return "Ubicación de banner no válida.";
    default:
      return "Algo salió mal. Intentá de nuevo.";
  }
}

function BannerRowEditor({ row }: { row: StoreBannerRow }) {
  const url = storagePublicObjectUrl(row.image_path);

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-start">
      <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
        {url ? (
          <Image
            src={url}
            alt={row.alt_text || "Banner"}
            fill
            sizes="160px"
            className="object-cover"
            unoptimized={shouldUnoptimizeStorageImageUrl(url)}
          />
        ) : null}
      </div>
      <form action={updateStoreBanner} className="min-w-0 flex-1 space-y-3">
        <input type="hidden" name="id" value={row.id} readOnly />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Enlace (opcional)</label>
            <input
              name="href"
              type="url"
              defaultValue={row.href ?? ""}
              placeholder="https://…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Texto alternativo</label>
            <input
              name="alt_text"
              type="text"
              defaultValue={row.alt_text ?? ""}
              placeholder="Descripción breve"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Orden</label>
            <input
              name="sort_order"
              type="number"
              min={0}
              defaultValue={row.sort_order}
              className={inputClass}
            />
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800">
              <input
                type="checkbox"
                name="is_published"
                defaultChecked={row.is_published}
                className="size-4 rounded border-zinc-300 text-zinc-900"
              />
              Publicado
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Guardar cambios
          </button>
        </div>
      </form>
      <form action={deleteStoreBanner} className="shrink-0 self-end sm:self-start">
        <input type="hidden" name="id" value={row.id} readOnly />
        <button
          type="submit"
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
        >
          Eliminar
        </button>
      </form>
    </li>
  );
}

function UploadBlock({
  placement,
  title,
  hint,
}: {
  placement: "hero" | "products";
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4">
      <p className="text-sm font-medium text-zinc-800">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      <form
        action={uploadStoreBanner}
        encType="multipart/form-data"
        className="mt-4 space-y-3"
      >
        <input type="hidden" name="placement" value={placement} readOnly />
        <div>
          <label className={labelClass}>Imagen</label>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800"
          />
        </div>
        <div>
          <label className={labelClass}>Enlace al hacer clic (opcional)</label>
          <input name="href" type="url" placeholder="https://…" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Texto alternativo (opcional)</label>
          <input
            name="alt_text"
            type="text"
            placeholder="Ej. Oferta de verano"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 sm:w-auto sm:px-5"
        >
          Subir banner
        </button>
      </form>
    </div>
  );
}

function Section({
  placement,
  label,
  description,
  rows,
}: {
  placement: "hero" | "products";
  label: string;
  description: string;
  rows: StoreBannerRow[];
}) {
  const list = rows.filter((r) => r.placement === placement);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className={sectionTitle}>{label}</h2>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Todavía no hay banners. Subí la primera imagen.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((row) => (
            <BannerRowEditor key={row.id} row={row} />
          ))}
        </ul>
      )}

      <div className="mt-6">
        <UploadBlock
          placement={placement}
          title="Añadir otra imagen al carrusel"
          hint={
            placement === "hero"
              ? "Se muestran a la derecha del título en el inicio, con flechas y puntos si hay varias."
              : "Se muestra arriba del listado de productos; podés subir varias para carrusel."
          }
        />
      </div>
    </section>
  );
}

export function BannersAdminPanel({
  banners,
  errorCode,
}: {
  banners: StoreBannerRow[];
  errorCode?: string;
}) {
  const err = errorText(errorCode);

  return (
    <div className="space-y-8">
      {err ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {err}
        </p>
      ) : null}

      <Section
        placement="hero"
        label="Hero (inicio)"
        description="Banners del carrusel principal del home. El orden numérico define el deslizamiento (menor primero)."
        rows={banners}
      />

      <Section
        placement="products"
        label="Sección productos"
        description="Banners encima de los filtros en /products. Podés usar una sola imagen o varias en carrusel."
        rows={banners}
      />
    </div>
  );
}
