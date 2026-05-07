import Image from "next/image";
import {
  createStoreWelcomeModal,
  deleteStoreWelcomeModal,
  updateStoreWelcomeModal,
} from "@/app/actions/admin/store-welcome-modal";
import type { StoreWelcomeModalRow } from "@/lib/store-welcome-modal";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";

function errorText(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "title":
      return "El título del modal es obligatorio.";
    case "id":
      return "No se encontró el modal para actualizar.";
    case "db":
      return "No se pudo guardar en base de datos. Revisá migraciones/permisos.";
    case "size":
      return "La imagen supera 5 MB.";
    case "type":
      return "Solo se permiten imágenes JPEG, PNG, WebP o GIF.";
    case "upload":
      return "No se pudo subir la imagen a Storage.";
    default:
      return "No se pudo guardar el modal de bienvenida.";
  }
}

function WelcomeModalRowEditor({ row }: { row: StoreWelcomeModalRow }) {
  const img = storagePublicObjectUrl(row.image_path);
  return (
    <li className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:p-5">
      <form action={updateStoreWelcomeModal} className="space-y-3">
        <input type="hidden" name="id" value={row.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">Imagen</label>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800"
            />
            {img ? (
              <div className="mt-2">
                <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  <Image
                    src={img}
                    alt="Imagen actual del modal"
                    fill
                    className="object-cover"
                    sizes="320px"
                    unoptimized={shouldUnoptimizeStorageImageUrl(img)}
                  />
                </div>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    name="remove_image"
                    className="size-4 rounded border-zinc-300 text-zinc-900"
                  />
                  Quitar imagen actual
                </label>
              </div>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">Sin imagen cargada.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">Título</label>
            <input
              name="title"
              required
              defaultValue={row.title}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">Descripción</label>
            <textarea
              name="description"
              defaultValue={row.description}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">
              Código descuento
            </label>
            <input
              name="discount_code"
              defaultValue={row.discount_code ?? ""}
              placeholder="BIENVENIDA10"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">Orden</label>
            <input
              name="sort_order"
              type="number"
              min={0}
              defaultValue={row.sort_order}
              placeholder="0"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">
              Texto del botón
            </label>
            <input
              name="cta_label"
              defaultValue={row.cta_label}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">
              Enlace del botón
            </label>
            <input
              name="cta_href"
              type="url"
              defaultValue={row.cta_href ?? ""}
              placeholder="https://wa.me/..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800">
            <input
              type="checkbox"
              name="is_enabled"
              defaultChecked={row.is_enabled}
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            Modal habilitado
          </label>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Guardar
          </button>
          <button
            type="submit"
            formAction={deleteStoreWelcomeModal}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </form>
    </li>
  );
}

export function StoreWelcomeModalPanel({
  modals,
  errorCode,
}: {
  modals: StoreWelcomeModalRow[];
  errorCode?: string;
}) {
  const err = errorText(errorCode);

  return (
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Modal de bienvenida</h2>
        <p className="mt-1 text-sm text-stone-600">
          Creá promos dinámicas tipo “Registrate y obtené descuento”.
        </p>
      </div>

      {err ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {err}
        </p>
      ) : null}

      <form action={createStoreWelcomeModal} className="space-y-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
        <p className="text-sm font-medium text-zinc-900">Crear modal</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-900">Imagen (opcional)</label>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800"
            />
          </div>
          <input
            name="title"
            required
            placeholder="Registrate y obtené 10% OFF"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm sm:col-span-2"
          />
          <textarea
            name="description"
            placeholder="Te damos un código de descuento exclusivo..."
            rows={3}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm sm:col-span-2"
          />
          <input
            name="discount_code"
            placeholder="BIENVENIDA10"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          />
          <input
            name="sort_order"
            type="number"
            min={0}
            placeholder="0"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          />
          <input
            name="cta_label"
            placeholder="Quiero mi descuento"
            defaultValue="Quiero mi descuento"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          />
          <input
            name="cta_href"
            type="url"
            placeholder="https://wa.me/..."
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            <input
              type="checkbox"
              name="is_enabled"
              defaultChecked
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            Habilitar al crear
          </label>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Crear modal
        </button>
      </form>

      {modals.length > 0 ? (
        <ul className="space-y-3">
          {modals.map((row) => (
            <WelcomeModalRowEditor key={row.id} row={row} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Aún no hay modales de bienvenida configurados.
        </p>
      )}
    </section>
  );
}

