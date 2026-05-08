"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCart, setCart, type CartLine } from "@/lib/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeStorefrontCartLines } from "@/lib/storefront-cart";

function revalidateStoreCart() {
  revalidatePath("/products");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

/** Quita de la cookie líneas con productos no publicados, sin stock o inexistentes. */
async function syncCartCookieIfStale() {
  const raw = await getCart();
  const normalized = await normalizeStorefrontCartLines(raw);
  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    await setCart(normalized);
    revalidateStoreCart();
  }
}

export async function addToCart(productId: string, quantity: number) {
  await syncCartCookieIfStale();
  const q = Math.max(1, Math.floor(quantity || 1));
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();

  if (!row) return;

  const stock = Math.max(0, Math.floor(Number(row.stock_quantity ?? 0)));
  if (stock <= 0) return;

  const cart = await getCart();
  const next: CartLine[] = [...cart];
  const i = next.findIndex((l) => l.productId === productId);
  const current = i >= 0 ? next[i].quantity : 0;
  const newQty = Math.min(current + q, stock);
  if (newQty <= 0) return;

  if (i >= 0) next[i] = { productId, quantity: newQty };
  else next.push({ productId, quantity: newQty });

  await setCart(next);
  revalidateStoreCart();
}

export async function setLineQuantity(productId: string, quantity: number) {
  await syncCartCookieIfStale();
  const raw = Math.floor(quantity);
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();
  const stock = Math.max(0, Math.floor(Number(row?.stock_quantity ?? 0)));

  const cart = await getCart();
  let next: CartLine[];

  if (raw <= 0 || stock <= 0) {
    next = cart.filter((l) => l.productId !== productId);
  } else {
    const q = Math.min(raw, stock);
    const idx = cart.findIndex((l) => l.productId === productId);
    if (idx >= 0) {
      next = cart.map((l, i) =>
        i === idx ? { ...l, quantity: q } : l,
      );
    } else {
      next = [...cart, { productId, quantity: q }];
    }
  }
  await setCart(next);
  revalidateStoreCart();
}

export async function addToCartFromForm(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const qty = Number(formData.get("quantity") ?? 1);
  if (!productId) return;
  await addToCart(productId, Number.isFinite(qty) ? qty : 1);
}

/** Deja solo este ítem en la bolsa y va al checkout (flujo “Comprar ahora”). */
export async function buyNowFromDetail(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) redirect("/products");

  const requested = Math.max(
    1,
    Math.floor(Number(formData.get("quantity") ?? 1)),
  );

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();

  const stock = Math.max(0, Math.floor(Number(row?.stock_quantity ?? 0)));
  if (stock <= 0) redirect("/products");

  const qty = Math.min(requested, stock);
  await setCart([{ productId, quantity: qty }]);
  revalidateStoreCart();
  redirect("/checkout");
}

export async function updateLineFromForm(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const q = Number(formData.get("quantity") ?? 0);
  if (!productId) return;
  await setLineQuantity(productId, q);
}

export async function clearCart() {
  await setCart([]);
  revalidateStoreCart();
}
