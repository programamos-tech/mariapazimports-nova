import { cookies } from "next/headers";

export type CartLine = { productId: string; quantity: number };

const CART_COOKIE = "tiendas_cart";

export async function getCart(): Promise<CartLine[]> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        typeof l.productId === "string" &&
        typeof l.quantity === "number" &&
        l.quantity > 0,
    );
  } catch {
    return [];
  }
}

export async function setCart(lines: CartLine[]) {
  const jar = await cookies();
  jar.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Solo productos publicados; cantidad acotada al stock. Sin escritura de cookies (usable en Server Components). */
export function normalizeCartForCheckout(
  cart: CartLine[],
  byId: Map<
    string,
    { is_published: boolean | null; stock_quantity: number | null }
  >,
): CartLine[] {
  const next: CartLine[] = [];
  for (const line of cart) {
    const p = byId.get(line.productId);
    if (!p || !p.is_published) continue;
    const stock = Math.max(0, Math.floor(Number(p.stock_quantity ?? 0)));
    const q = Math.min(line.quantity, stock);
    if (q > 0) next.push({ productId: line.productId, quantity: q });
  }
  return next;
}
