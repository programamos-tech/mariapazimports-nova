const ALLOWED_PAGE_SIZES = [10, 25, 50, 100] as const;

export type AdminProductsListQuery = {
  q?: string;
  status?: string;
  category_id?: string;
  page?: number;
  per_page?: number;
  /** Abre el modal de gestión de categorías sobre el listado de productos. */
  categories?: boolean;
  /** Resalta la fila del producto recién editado o creado. */
  updated?: string;
  created?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseAdminProductsHighlightId(
  sp: Record<string, string | string[] | undefined>,
): string | null {
  const raw =
    (typeof sp.updated === "string" ? sp.updated : "") ||
    (typeof sp.created === "string" ? sp.created : "");
  const id = raw.trim();
  return UUID_RE.test(id) ? id : null;
}

export function clampAdminProductsPageSize(raw: number): number {
  if (ALLOWED_PAGE_SIZES.includes(raw as (typeof ALLOWED_PAGE_SIZES)[number])) {
    return raw;
  }
  return 25;
}

/** Lee query string de Next (searchParams). */
export function parseAdminProductsPage(
  sp: Record<string, string | string[] | undefined>,
): number {
  const v = sp.page;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
  const n = Math.floor(Number(s));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function parseAdminProductsPerPage(
  sp: Record<string, string | string[] | undefined>,
): number {
  const v = sp.per_page;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
  const n = Math.floor(Number(s));
  return clampAdminProductsPageSize(Number.isFinite(n) ? n : 25);
}

export function parseAdminProductsCategoriesModal(
  sp: Record<string, string | string[] | undefined>,
): boolean {
  const v = sp.categories;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
  return s === "1" || s === "true";
}

export function adminProductsListHref(q: AdminProductsListQuery): string {
  const params = new URLSearchParams();
  const search = (q.q ?? "").trim();
  if (search) params.set("q", search);
  const st = (q.status ?? "all").trim() || "all";
  if (st !== "all") params.set("status", st);
  const cat = (q.category_id ?? "").trim();
  if (cat) params.set("category_id", cat);
  const per = clampAdminProductsPageSize(q.per_page ?? 25);
  if (per !== 25) params.set("per_page", String(per));
  const pg = Math.max(1, Math.floor(q.page ?? 1));
  if (pg > 1) params.set("page", String(pg));
  if (q.categories) params.set("categories", "1");
  const updated = (q.updated ?? "").trim();
  if (updated && UUID_RE.test(updated)) params.set("updated", updated);
  const created = (q.created ?? "").trim();
  if (created && UUID_RE.test(created)) params.set("created", created);
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

function listQueryFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): AdminProductsListQuery {
  return {
    q: typeof sp.q === "string" ? sp.q : "",
    status: typeof sp.status === "string" ? sp.status : "all",
    category_id: typeof sp.category_id === "string" ? sp.category_id : "",
    page: parseAdminProductsPage(sp),
    per_page: parseAdminProductsPerPage(sp),
    categories: parseAdminProductsCategoriesModal(sp),
  };
}

/** URL del listado sin toast (`saved`, `uploadError`); conserva `updated`/`created` para el resaltado. */
export function adminProductsUrlWithoutFlash(
  sp: Record<string, string | string[] | undefined>,
): string {
  const base = listQueryFromSearchParams(sp);
  const highlightId = parseAdminProductsHighlightId(sp);
  if (!highlightId) return adminProductsListHref(base);
  const isCreated =
    typeof sp.created === "string" && sp.created.trim() === highlightId;
  return adminProductsListHref({
    ...base,
    ...(isCreated ? { created: highlightId } : { updated: highlightId }),
  });
}

/** URL del listado sin ningún param de feedback (toast ni resaltado). */
export function adminProductsUrlFullyClean(
  sp: Record<string, string | string[] | undefined>,
): string {
  return adminProductsListHref(listQueryFromSearchParams(sp));
}
