"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCart, setCart, type CartLine } from "@/lib/cart";

export async function addToCart(productId: string, quantity: number) {
  const q = Math.max(1, Math.floor(quantity || 1));
  const cart = await getCart();
  const next: CartLine[] = [...cart];
  const i = next.findIndex((l) => l.productId === productId);
  if (i >= 0) next[i] = { productId, quantity: next[i].quantity + q };
  else next.push({ productId, quantity: q });
  await setCart(next);
  revalidatePath("/cart");
  revalidatePath("/products");
}

export async function setLineQuantity(productId: string, quantity: number) {
  const q = Math.floor(quantity);
  const cart = await getCart();
  let next: CartLine[];
  if (q <= 0) {
    next = cart.filter((l) => l.productId !== productId);
  } else {
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
  revalidatePath("/cart");
}

export async function addToCartFromForm(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const qty = Number(formData.get("quantity") ?? 1);
  if (!productId) return;
  await addToCart(productId, Number.isFinite(qty) ? qty : 1);
}

/** Deja solo este ítem en el carrito y va al checkout (flujo “Comprar ahora”). */
export async function buyNowFromDetail(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const qty = Math.max(
    1,
    Math.floor(Number(formData.get("quantity") ?? 1)),
  );
  if (!productId) redirect("/products");
  await setCart([{ productId, quantity: qty }]);
  revalidatePath("/cart");
  revalidatePath("/products");
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
  revalidatePath("/cart");
}
