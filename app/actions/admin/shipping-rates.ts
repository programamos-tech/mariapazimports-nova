"use server";

import { assertActionPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectError(code: string): never {
  redirect(`/admin/envios?error=${encodeURIComponent(code)}`);
}

export async function updateShippingMunicipalityRateAction(formData: FormData) {
  await assertActionPermission("envios_gestionar");
  const supabase = await createSupabaseServerClient();

  const code = String(formData.get("municipality_code") ?? "").trim();
  const costRaw = String(formData.get("cost_cents") ?? "").trim();
  const enabled = formData.get("is_delivery_enabled") === "on";

  if (!/^\d{5}$/.test(code)) redirectError("validation");

  const costDigits = costRaw.replace(/\D/g, "");
  const costCents = costDigits.length ? Math.max(0, parseInt(costDigits, 10)) : 0;
  if (!Number.isFinite(costCents)) redirectError("validation");

  const { error } = await supabase
    .from("shipping_municipalities")
    .update({
      cost_cents: costCents,
      is_delivery_enabled: enabled,
    })
    .eq("code", code);

  if (error) redirectError("db");

  revalidatePath("/admin/envios");
  redirect("/admin/envios?saved=1");
}

export async function bulkUpdateShippingRatesAction(formData: FormData) {
  await assertActionPermission("envios_gestionar");
  const supabase = await createSupabaseServerClient();

  const departmentCode = String(formData.get("department_code") ?? "").trim();
  const costRaw = String(formData.get("cost_cents") ?? "").trim();
  const applyEnabled = formData.get("apply_enabled") === "on";
  const enabledValue = formData.get("is_delivery_enabled") === "on";

  if (!/^\d{2}$/.test(departmentCode)) redirectError("validation");

  const costDigits = costRaw.replace(/\D/g, "");
  const costCents = costDigits.length ? Math.max(0, parseInt(costDigits, 10)) : 0;
  if (!Number.isFinite(costCents)) redirectError("validation");

  const patch: { cost_cents: number; is_delivery_enabled?: boolean } = {
    cost_cents: costCents,
  };
  if (applyEnabled) {
    patch.is_delivery_enabled = enabledValue;
  }

  const { error } = await supabase
    .from("shipping_municipalities")
    .update(patch)
    .eq("department_code", departmentCode);

  if (error) redirectError("db");

  revalidatePath("/admin/envios");
  redirect(`/admin/envios?dept=${departmentCode}&saved=1`);
}
