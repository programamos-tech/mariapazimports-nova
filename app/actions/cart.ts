"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cartLinesMatch,
  getCart,
  setCart,
  type CartLine,
} from "@/lib/cart";
import { validateCartLineAdd } from "@/lib/storefront-cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeStorefrontCartLines } from "@/lib/storefront-cart";

function revalidateStoreCart() {
  revalidatePath("/products");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

async function syncCartCookieIfStale() {
  const raw = await getCart();
  const normalized = await normalizeStorefrontCartLines(raw);
  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    await setCart(normalized);
    revalidateStoreCart();
  }
}

export async function addToCart(
  productId: string,
  quantity: number,
  variantId?: string,
) {
  await syncCartCookieIfStale();
  const validated = await validateCartLineAdd(productId, quantity, variantId);
  if (!validated.ok) return;

  const cart = await getCart();
  const next: CartLine[] = [...cart];
  const vid = validated.line.variantId;
  const i = next.findIndex((l) =>
    cartLinesMatch(l, { productId, variantId: vid }),
  );
  const current = i >= 0 ? next[i]!.quantity : 0;
  const newQty = current + validated.line.quantity;

  const recheck = await validateCartLineAdd(productId, newQty, vid);
  if (!recheck.ok) return;

  const line: CartLine = {
    productId,
    quantity: recheck.line.quantity,
    ...(vid ? { variantId: vid } : {}),
  };
  if (i >= 0) next[i] = line;
  else next.push(line);

  await setCart(next);
  revalidateStoreCart();
}

export async function setLineQuantity(
  productId: string,
  quantity: number,
  variantId?: string,
) {
  await syncCartCookieIfStale();
  const raw = Math.floor(quantity);
  const vid =
    typeof variantId === "string" && variantId.trim()
      ? variantId.trim()
      : undefined;

  const cart = await getCart();
  let next: CartLine[];

  if (raw <= 0) {
    next = cart.filter(
      (l) => !cartLinesMatch(l, { productId, variantId: vid }),
    );
  } else {
    const validated = await validateCartLineAdd(productId, raw, vid);
    if (!validated.ok) {
      next = cart.filter(
        (l) => !cartLinesMatch(l, { productId, variantId: vid }),
      );
    } else {
      const idx = cart.findIndex((l) =>
        cartLinesMatch(l, { productId, variantId: vid }),
      );
      const line: CartLine = {
        productId,
        quantity: validated.line.quantity,
        ...(vid ? { variantId: vid } : {}),
      };
      if (idx >= 0) {
        next = cart.map((l, i) => (i === idx ? line : l));
      } else {
        next = [...cart, line];
      }
    }
  }
  await setCart(next);
  revalidateStoreCart();
}

export async function addToCartFromForm(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const qty = Number(formData.get("quantity") ?? 1);
  const variantRaw = String(formData.get("variantId") ?? "").trim();
  if (!productId) return;
  await addToCart(
    productId,
    Number.isFinite(qty) ? qty : 1,
    variantRaw || undefined,
  );
}

export async function buyNowFromDetail(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) redirect("/products");

  const requested = Math.max(
    1,
    Math.floor(Number(formData.get("quantity") ?? 1)),
  );
  const variantRaw = String(formData.get("variantId") ?? "").trim();

  const validated = await validateCartLineAdd(
    productId,
    requested,
    variantRaw || undefined,
  );
  if (!validated.ok) redirect(`/products/${productId}`);

  await setCart([
    {
      productId,
      quantity: validated.line.quantity,
      ...(validated.line.variantId
        ? { variantId: validated.line.variantId }
        : {}),
    },
  ]);
  revalidateStoreCart();
  redirect("/checkout");
}

export async function updateLineFromForm(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const q = Number(formData.get("quantity") ?? 0);
  const variantRaw = String(formData.get("variantId") ?? "").trim();
  if (!productId) return;
  await setLineQuantity(productId, q, variantRaw || undefined);
}

export async function clearCart() {
  await setCart([]);
  revalidateStoreCart();
}
