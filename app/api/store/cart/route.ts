import { NextResponse } from "next/server";
import { getStorefrontCartLines } from "@/lib/storefront-cart";

export const dynamic = "force-dynamic";

/** Líneas del carrito efectivo (publicados + stock) para vistas solo cliente. */
export async function GET() {
  const lines = await getStorefrontCartLines();
  return NextResponse.json({ lines });
}
