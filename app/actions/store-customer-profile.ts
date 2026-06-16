"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function settingsRedirect(code: string): never {
  redirect(`/cuenta/direcciones?perfil=${encodeURIComponent(code)}`);
}

export async function updateStoreCustomerProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("shipping_city") ?? "").trim();

  if (!name) {
    settingsRedirect("name");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    redirect("/cuenta/entrar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) {
    settingsRedirect("forbidden");
  }

  const { data: updated, error } = await supabase
    .from("customers")
    .update({
      name,
      phone: phone || null,
      shipping_city: city || null,
    })
    .eq("auth_user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    settingsRedirect("db");
  }

  await supabase.auth.updateUser({
    data: { full_name: name },
  });

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/direcciones");
  settingsRedirect("ok");
}
