"use server";

import { isCategoryIconKey, resolveCategoryIconKey } from "@/lib/category-icons";
import { assertActionPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateCategorySurfaces() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("categorias_gestionar");

  const fromModal = String(formData.get("from") ?? "") === "modal";
  const name = String(formData.get("name") ?? "").trim();
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();
  const parentId = parentIdRaw || null;
  const iconRaw = String(formData.get("icon_key") ?? "").trim();
  const iconKey = resolveCategoryIconKey(iconRaw);

  const redirectErr = (kind: "name" | "db" | "parent") => {
    if (fromModal) {
      redirect(`/admin/products?categories=1&category_error=${kind}`);
    }
    redirect(`/admin/categories/new?error=${kind}`);
  };

  if (!name) redirectErr("name");

  if (iconRaw && !isCategoryIconKey(iconRaw)) redirectErr("db");

  if (parentId) {
    const { data: parent, error: parentErr } = await supabase
      .from("categories")
      .select("id,parent_id")
      .eq("id", parentId)
      .maybeSingle();
    if (parentErr || !parent || parent.parent_id) redirectErr("parent");
  }

  let siblingsQuery = supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  siblingsQuery =
    parentId == null
      ? siblingsQuery.is("parent_id", null)
      : siblingsQuery.eq("parent_id", parentId);
  const { data: maxRows } = await siblingsQuery;
  const maxSort = Number(maxRows?.[0]?.sort_order ?? -1);
  const sortOrder = Number.isFinite(maxSort) ? Math.floor(maxSort) + 1 : 0;

  const { error } = await supabase.from("categories").insert({
    name,
    icon_key: iconKey,
    parent_id: parentId,
    sort_order: sortOrder,
  });
  if (error) redirectErr("db");

  revalidateCategorySurfaces();
  redirect("/admin/products?categories=1");
}

/**
 * Sube o baja una categoría entre sus hermanas (mismo parent).
 * Define el orden del menú Shop y del listado.
 */
export async function moveCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("categorias_gestionar");

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();
  if (!categoryId || (direction !== "up" && direction !== "down")) {
    redirect("/admin/products?categories=1");
  }

  const { data: current, error: curErr } = await supabase
    .from("categories")
    .select("id,parent_id,sort_order,name")
    .eq("id", categoryId)
    .maybeSingle();

  if (curErr || !current) {
    redirect("/admin/products?categories=1&category_error=db");
  }

  let siblingsQuery = supabase
    .from("categories")
    .select("id,sort_order,name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  siblingsQuery =
    current.parent_id == null
      ? siblingsQuery.is("parent_id", null)
      : siblingsQuery.eq("parent_id", current.parent_id);

  const { data: siblings, error: sibErr } = await siblingsQuery;
  if (sibErr || !siblings?.length) {
    redirect("/admin/products?categories=1&category_error=db");
  }

  const index = siblings.findIndex((s) => s.id === categoryId);
  if (index < 0) redirect("/admin/products?categories=1");

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) {
    redirect("/admin/products?categories=1");
  }

  const a = siblings[index]!;
  const b = siblings[swapIndex]!;
  const orderA = Number(a.sort_order ?? index);
  const orderB = Number(b.sort_order ?? swapIndex);

  // Si comparten el mismo sort_order, reasignamos índices consecutivos
  // y luego intercambiamos; si no, solo swap de sort_order.
  if (orderA === orderB) {
    const updates = siblings.map((s, i) => ({
      id: s.id,
      sort_order: i === index ? swapIndex : i === swapIndex ? index : i,
    }));
    for (const u of updates) {
      const { error } = await supabase
        .from("categories")
        .update({ sort_order: u.sort_order })
        .eq("id", u.id);
      if (error) {
        redirect("/admin/products?categories=1&category_error=db");
      }
    }
  } else {
    const { error: e1 } = await supabase
      .from("categories")
      .update({ sort_order: orderB })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("categories")
      .update({ sort_order: orderA })
      .eq("id", b.id);
    if (e1 || e2) {
      redirect("/admin/products?categories=1&category_error=db");
    }
  }

  revalidateCategorySurfaces();
  redirect("/admin/products?categories=1");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("categorias_gestionar");

  await supabase.from("categories").delete().eq("id", categoryId);
  revalidateCategorySurfaces();
  redirect("/admin/products?categories=1");
}

export async function updateCategoryListingHero(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("categorias_gestionar");

  const categoryId = String(formData.get("category_id") ?? "").trim();
  if (!categoryId) redirect("/admin/products?categories=1");

  const pathRaw = String(formData.get("listing_hero_image_path") ?? "").trim();
  const altRaw = String(formData.get("listing_hero_alt_text") ?? "").trim();

  const { error } = await supabase
    .from("categories")
    .update({
      listing_hero_image_path: pathRaw || null,
      listing_hero_alt_text: altRaw || null,
    })
    .eq("id", categoryId);

  if (error) {
    redirect("/admin/products?categories=1&category_error=db");
  }

  revalidateCategorySurfaces();
  redirect("/admin/products?categories=1");
}
