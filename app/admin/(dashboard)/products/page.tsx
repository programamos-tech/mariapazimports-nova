import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminProductsPagination } from "@/components/admin/AdminProductsPagination";
import { CategoriesModal } from "@/components/admin/CategoriesModal";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ProductFiltersBar } from "@/components/admin/ProductFiltersBar";
import { ProductTableActions } from "@/components/admin/ProductTableActions";
import {
  adminProductsListHref,
  adminProductsUrlWithoutFlash,
  parseAdminProductsCategoriesModal,
  parseAdminProductsPage,
  parseAdminProductsPerPage,
} from "@/lib/admin-products-url";
import {
  fetchAdminCategoriesList,
  fetchAdminCategoriesManageList,
  fetchAdminProductsList,
} from "@/lib/supabase/admin-products-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import { AdminProductsFlashToast } from "@/components/admin/AdminProductsFlashToast";

export const dynamic = "force-dynamic";

const LOW_STOCK_MAX = 4;

type Search = {
  q?: string;
  status?: string;
  category_id?: string;
  categories?: string;
  category_error?: string;
  error?: string;
  saved?: string;
  uploadError?: string;
  page?: string;
  per_page?: string;
};

function stockBadge(stock: number) {
  if (stock <= 0) {
    return {
      label: "Sin stock",
      className: "bg-red-50 text-red-800 ring-red-200/90",
    };
  }
  if (stock <= LOW_STOCK_MAX) {
    return {
      label: "Stock bajo",
      className: "bg-amber-50 text-amber-900 ring-amber-200/90",
    };
  }
  return {
    label: "Con stock",
    className: "bg-emerald-50/90 text-emerald-900 ring-emerald-200/80",
  };
}

function shortSku(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const spRecord = sp as Record<string, string | string[] | undefined>;
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "all").trim() || "all";
  const categoryId = (sp.category_id ?? "").trim();
  const err = sp.error;
  const flashSaved = sp.saved === "1" || sp.saved === "true";
  const flashUploadError =
    sp.uploadError === "1" || sp.uploadError === "true";
  const cleanProductsHref = adminProductsUrlWithoutFlash(spRecord);

  const currentPage = parseAdminProductsPage(spRecord);
  const pageSize = parseAdminProductsPerPage(spRecord);
  const showCategories = parseAdminProductsCategoriesModal(spRecord);
  const rawCategoryErr =
    typeof sp.category_error === "string" ? sp.category_error : undefined;
  const categoryFormError =
    showCategories && (rawCategoryErr === "name" || rawCategoryErr === "db")
      ? rawCategoryErr
      : undefined;

  const categoriesCloseHref = adminProductsListHref({
    q,
    status,
    category_id: categoryId,
    page: currentPage,
    per_page: pageSize,
  });
  const categoriesOpenHref = adminProductsListHref({
    q,
    status,
    category_id: categoryId,
    page: currentPage,
    per_page: pageSize,
    categories: true,
  });

  const supabase = await createSupabaseServerClient();

  const [categoryList, listResult, categoriesManage] = await Promise.all([
    fetchAdminCategoriesList(supabase),
    fetchAdminProductsList(supabase, {
      q,
      status,
      categoryId,
      lowStockMax: LOW_STOCK_MAX,
      page: currentPage,
      pageSize,
    }),
    showCategories
      ? fetchAdminCategoriesManageList(supabase)
      : Promise.resolve({ list: [], error: false }),
  ]);

  const {
    list,
    error: queryError,
    usedFallbackSelect,
    totalCount,
  } = listResult;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!queryError && totalCount > 0 && currentPage > totalPages) {
    redirect(
      adminProductsListHref({
        q,
        status,
        category_id: categoryId,
        page: totalPages,
        per_page: pageSize,
        categories: showCategories,
      }),
    );
  }

  return (
    <>
    <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Productos
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Gestioná inventario, precios y publicación.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={categoriesOpenHref}
            scroll={false}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200/80"
          >
            Categorías
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200/80"
            title="Quitar filtros y recargar"
          >
            Actualizar
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            + Nuevo producto
          </Link>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {queryError ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-100">
            No se pudo cargar productos desde Supabase. Revisá{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> y la clave
            anónima, que exista la tabla <code className="text-xs">products</code>{" "}
            y tu usuario admin en <code className="text-xs">public.profiles</code>.
            En Supabase → SQL, podés ejecutar el archivo{" "}
            <code className="text-xs">supabase/full_schema.sql</code> (todas las
            migraciones en orden).
          </p>
        ) : null}

        {!queryError && usedFallbackSelect ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            La base está parcialmente migrada: se listan productos con un esquema
            compatible. Ejecutá{" "}
            <code className="text-xs">supabase/full_schema.sql</code> en el SQL
            editor para alinear categorías, stock bodega/local y referencia/costo.
          </p>
        ) : null}

        {err === "stock" ? (
          <p
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-100"
            role="alert"
          >
            No se pudo actualizar el stock. Intentá de nuevo.
          </p>
        ) : null}

        <ProductFiltersBar
          defaultQ={q}
          defaultStatus={status}
          defaultCategoryId={categoryId}
          defaultPerPage={pageSize}
          lowStockMax={LOW_STOCK_MAX}
          categories={categoryList}
          categoriesModalOpen={showCategories}
        />
      </div>

      {!queryError && totalCount === 0 ? (
        <div className="border-t border-zinc-100 px-5 py-12 text-center sm:px-6">
          <p className="text-sm text-zinc-500">No hay productos con estos criterios.</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block text-sm font-semibold text-zinc-900 underline decoration-zinc-300"
          >
            Crear el primero
          </Link>
        </div>
      ) : !queryError ? (
        <>
        <div className="overflow-x-auto border-t border-zinc-100">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-white">
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Producto
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Código
                </th>
                <th className="hidden px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-400 md:table-cell">
                  Categoría
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Local
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Bodega
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Estado
                </th>
                <th className="hidden px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-zinc-400 lg:table-cell">
                  Precio
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, index) => {
                const raw = row as {
                  id: string;
                  name: string;
                  reference?: string | null;
                  price_cents: number;
                  stock_quantity: number;
                  stock_warehouse: number;
                  stock_local: number;
                  is_published: boolean;
                  image_path: string | null;
                  categories:
                    | { id: string; name: string }
                    | { id: string; name: string }[]
                    | null;
                };
                const catRow = Array.isArray(raw.categories)
                  ? raw.categories[0] ?? null
                  : raw.categories;
                const p = { ...raw, categories: catRow };
                const img = storagePublicObjectUrl(p.image_path);
                const cat = p.categories?.name ?? "—";
                const st = stockBadge(p.stock_quantity);
                const code =
                  (p.reference && String(p.reference).trim()) || shortSku(p.id);
                const zebra = index % 2 === 1 ? "bg-zinc-50/80" : "bg-white";
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-zinc-100/90 ${zebra} transition hover:bg-zinc-100/60`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-100">
                          {img ? (
                            <Image
                              src={img}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={shouldUnoptimizeStorageImageUrl(img)}
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs text-zinc-300">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="hover:underline"
                            >
                              {p.name}
                            </Link>
                          </p>
                          <p className="text-xs text-zinc-500 md:hidden">{cat}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-zinc-600">
                      {code}
                    </td>
                    <td className="hidden px-4 py-3.5 text-zinc-600 md:table-cell">
                      {cat}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-zinc-900">
                      {p.stock_local ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-zinc-900">
                      {p.stock_warehouse ?? 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3.5 text-right text-sm font-bold tabular-nums text-zinc-900 lg:table-cell">
                      {formatCop(p.price_cents)}
                    </td>
                    <td className="px-4 py-3.5">
                      <ProductTableActions productId={p.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminProductsPagination
          page={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          filters={{
            q,
            status,
            category_id: categoryId,
            categories: showCategories,
          }}
        />
        </>
      ) : null}
    </div>
    {flashSaved || flashUploadError ? (
      <AdminProductsFlashToast
        saved={flashSaved}
        uploadError={flashUploadError}
        cleanHref={cleanProductsHref}
      />
    ) : null}

    {showCategories ? (
      <CategoriesModal closeHref={categoriesCloseHref}>
        <CategoriesPanel
          list={categoriesManage.list}
          loadError={categoriesManage.error}
          categoryError={categoryFormError}
        />
      </CategoriesModal>
    ) : null}
    </>
  );
}
