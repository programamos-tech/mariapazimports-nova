import { cookies } from "next/headers";

export type CartLine = {
  productId: string;
  quantity: number;
  variantId?: string;
  /** Legacy cookie field (fragancia); migrado a `variantId` al normalizar. */
  fragrance?: string;
};

export function cartLinesMatch(
  a: Pick<CartLine, "productId" | "variantId">,
  b: Pick<CartLine, "productId" | "variantId">,
): boolean {
  return (
    a.productId === b.productId &&
    (a.variantId ?? "") === (b.variantId ?? "")
  );
}

/** @deprecated Usar cartLinesMatch */
export const cartLinesMatchFragrance = cartLinesMatch;

const CART_COOKIE = "tiendas_cart";

export async function getCart(): Promise<CartLine[]> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l) =>
          typeof l.productId === "string" &&
          typeof l.quantity === "number" &&
          l.quantity > 0,
      )
      .map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        variantId:
          typeof l.variantId === "string" && l.variantId.trim()
            ? l.variantId.trim()
            : undefined,
        fragrance:
          typeof l.fragrance === "string" && l.fragrance.trim()
            ? l.fragrance.trim()
            : undefined,
      }));
  } catch {
    return [];
  }
}

export async function setCart(lines: CartLine[]) {
  const jar = await cookies();
  const sanitized = lines.map(({ productId, quantity, variantId }) => ({
    productId,
    quantity,
    ...(variantId ? { variantId } : {}),
  }));
  jar.set(CART_COOKIE, JSON.stringify(sanitized), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export type CartNormalizeProductRow = {
  is_published: boolean | null;
  stock_quantity: number | null;
  variant_axis?: string | null;
};

export type CartNormalizeVariant = {
  id: string;
  stockQuantity: number;
};

/** Solo productos publicados; cantidad acotada al stock. Preserva `variantId`. */
export function normalizeCartForCheckout(
  cart: CartLine[],
  byId: Map<string, CartNormalizeProductRow>,
  variantsByProductId: Map<string, CartNormalizeVariant[]>,
): CartLine[] {
  const next: CartLine[] = [];
  for (const line of cart) {
    const p = byId.get(line.productId);
    if (!p || !p.is_published) continue;

    const axis = (p.variant_axis ?? "none").toLowerCase();
    const variants = variantsByProductId.get(line.productId) ?? [];
    let stock: number;

    if (axis !== "none" && line.variantId) {
      const v = variants.find((x) => x.id === line.variantId);
      if (!v) continue;
      stock = Math.max(0, v.stockQuantity);
    } else if (axis !== "none" && variants.length > 1) {
      continue;
    } else {
      stock = Math.max(0, Math.floor(Number(p.stock_quantity ?? 0)));
    }

    const q = Math.min(line.quantity, stock);
    if (q > 0) {
      next.push({
        productId: line.productId,
        quantity: q,
        ...(line.variantId ? { variantId: line.variantId } : {}),
      });
    }
  }
  return next;
}
