"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const fromModal = String(formData.get("from") ?? "") === "modal";
  const name = String(formData.get("name") ?? "").trim();

  const redirectErr = (kind: "name" | "db") => {
    if (fromModal) {
      redirect(`/admin/products?categories=1&category_error=${kind}`);
    }
    redirect(`/admin/categories/new?error=${kind}`);
  };

  if (!name) redirectErr("name");

  const { error } = await supabase.from("categories").insert({ name });
  if (error) redirectErr("db");

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect("/admin/products?categories=1");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect("/admin/products?categories=1");
}
