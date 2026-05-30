import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMunicipalityLabel } from "@/lib/colombia-geo";

export type ShippingDepartmentRow = {
  code: string;
  name: string;
  sort_order: number;
};

export type ShippingMunicipalityRow = {
  code: string;
  department_code: string;
  name: string;
  cost_cents: number;
  is_delivery_enabled: boolean;
  sort_order: number;
  shipping_departments?: { name: string } | { name: string }[] | null;
};

export type ShippingQuote = {
  municipalityCode: string;
  municipalityName: string;
  departmentCode: string;
  departmentName: string;
  costCents: number;
  label: string;
};

export const SHIPPING_METHOD_PICKUP = "pickup" as const;
export const SHIPPING_METHOD_DELIVERY = "delivery" as const;
export type ShippingMethod =
  | typeof SHIPPING_METHOD_PICKUP
  | typeof SHIPPING_METHOD_DELIVERY;

function departmentNameFromJoin(
  row: ShippingMunicipalityRow,
): string | null {
  const rel = row.shipping_departments;
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0]?.name ?? null;
  return rel.name ?? null;
}

export async function fetchShippingDepartments(
  supabase: SupabaseClient,
): Promise<ShippingDepartmentRow[]> {
  const { data, error } = await supabase
    .from("shipping_departments")
    .select("code,name,sort_order")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ShippingDepartmentRow[];
}

export async function fetchShippingMunicipalitiesByDepartment(
  supabase: SupabaseClient,
  departmentCode: string,
  opts: { admin?: boolean } = {},
): Promise<ShippingMunicipalityRow[]> {
  let q = supabase
    .from("shipping_municipalities")
    .select("code,department_code,name,cost_cents,is_delivery_enabled,sort_order")
    .eq("department_code", departmentCode)
    .order("name", { ascending: true });
  if (!opts.admin) {
    q = q.eq("is_delivery_enabled", true);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ShippingMunicipalityRow[];
}

export async function fetchShippingMunicipalityByCode(
  supabase: SupabaseClient,
  municipalityCode: string,
  opts: { admin?: boolean } = {},
): Promise<ShippingMunicipalityRow | null> {
  let q = supabase
    .from("shipping_municipalities")
    .select(
      "code,department_code,name,cost_cents,is_delivery_enabled,sort_order,shipping_departments(name)",
    )
    .eq("code", municipalityCode);
  if (!opts.admin) {
    q = q.eq("is_delivery_enabled", true);
  }
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data as ShippingMunicipalityRow | null) ?? null;
}

export async function quoteShippingForMunicipality(
  supabase: SupabaseClient,
  municipalityCode: string,
): Promise<ShippingQuote | null> {
  const row = await fetchShippingMunicipalityByCode(supabase, municipalityCode);
  if (!row) return null;
  const departmentName = departmentNameFromJoin(row) ?? row.department_code;
  return {
    municipalityCode: row.code,
    municipalityName: row.name,
    departmentCode: row.department_code,
    departmentName,
    costCents: Math.max(0, Math.floor(Number(row.cost_cents ?? 0))),
    label: formatMunicipalityLabel(row.name, departmentName),
  };
}

export async function searchShippingMunicipalitiesAdmin(
  supabase: SupabaseClient,
  opts: {
    departmentCode?: string | null;
    q?: string | null;
    limit?: number;
  },
): Promise<(ShippingMunicipalityRow & { department_name: string })[]> {
  const limit = Math.min(500, Math.max(1, opts.limit ?? 200));
  let query = supabase
    .from("shipping_municipalities")
    .select(
      "code,department_code,name,cost_cents,is_delivery_enabled,sort_order,shipping_departments(name)",
    )
    .order("name", { ascending: true })
    .limit(limit);

  if (opts.departmentCode) {
    query = query.eq("department_code", opts.departmentCode);
  }
  const q = opts.q?.trim();
  if (q && q.length >= 2) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as ShippingMunicipalityRow[]).map((row) => ({
    ...row,
    department_name: departmentNameFromJoin(row) ?? row.department_code,
  }));
}

export function shippingCostForMethod(
  method: ShippingMethod,
  quote: ShippingQuote | null,
): number {
  if (method === SHIPPING_METHOD_PICKUP) return 0;
  return quote?.costCents ?? 0;
}

export function shippingAdminErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "forbidden":
      return "No tienes permiso para gestionar envíos.";
    case "validation":
      return "Revisa los datos ingresados.";
    case "db":
      return "No se pudieron guardar los cambios.";
    default:
      return code ? "Ocurrió un error al guardar." : null;
  }
}
