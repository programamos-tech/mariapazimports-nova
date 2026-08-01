import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  sanitizeStoreProductSearchQuery,
  storeProductNameOrBrandSearchOr,
} from "@/lib/store-product-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q")?.trim() ?? "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Missing Supabase env" },
      { status: 500 },
    );
  }

  const supabase = createClient(url, key);
  const select = "id,name,brand,price_cents,image_path";

  // Sin query (o muy corta): vitrina por defecto del drawer de búsqueda.
  if (raw.length < 2) {
    const { data, error } = await supabase
      .from("products")
      .select(select)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ products: data ?? [] });
  }

  const q = sanitizeStoreProductSearchQuery(raw);
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const orClause = storeProductNameOrBrandSearchOr(q);
  if (!orClause) {
    return NextResponse.json({ products: [] });
  }

  const { data, error } = await supabase
    .from("products")
    .select(select)
    .eq("is_published", true)
    .or(orClause)
    .order("name")
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}
