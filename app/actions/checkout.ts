"use server";

import { getCart, setCart } from "@/lib/cart";
import { storeBrand } from "@/lib/brand";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createPaymentLink, getWompiEnv } from "@/lib/wompi";
import { redirect } from "next/navigation";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function startCheckout(formData: FormData) {
  const customerEmail = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const customerName = `${firstName} ${lastName}`.trim();
  const legacyName = String(formData.get("name") ?? "").trim();
  const resolvedName = customerName || legacyName;

  const shippingAddress = String(formData.get("address") ?? "").trim();
  const shippingCity = String(formData.get("city") ?? "").trim();
  const shippingPostalCode = String(formData.get("zipCode") ?? "").trim();
  const shippingPhone = String(formData.get("mobile") ?? "").trim();

  if (!resolvedName) {
    redirect("/checkout?error=missing_name");
  }
  if (!isEmail(customerEmail)) {
    redirect("/checkout?error=invalid_email");
  }
  if (!shippingAddress || !shippingCity || !shippingPhone) {
    redirect("/checkout?error=missing_shipping");
  }

  const cart = await getCart();
  if (!cart.length) {
    redirect("/cart?error=empty");
  }

  const supabase = createSupabaseServiceClient();
  const ids = cart.map((l) => l.productId);
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id,name,price_cents,currency,stock_quantity,is_published")
    .in("id", ids)
    .eq("is_published", true);

  if (pErr || !products?.length) {
    redirect("/checkout?error=products");
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  let total = 0;
  const lines: {
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    product_name_snapshot: string;
  }[] = [];

  for (const line of cart) {
    const p = byId.get(line.productId);
    if (!p) redirect("/checkout?error=products");
    if (p.stock_quantity < line.quantity) {
      redirect(`/cart?error=stock&product=${p.name}`);
    }
    const sub = p.price_cents * line.quantity;
    total += sub;
    lines.push({
      product_id: p.id,
      quantity: line.quantity,
      unit_price_cents: p.price_cents,
      product_name_snapshot: p.name,
    });
  }

  const currency = products[0]?.currency ?? "COP";

  const emailLc = customerEmail.toLowerCase();

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", emailLc)
    .maybeSingle();

  let customerId: string;

  if (existingCustomer?.id) {
    customerId = existingCustomer.id as string;
    await supabase
      .from("customers")
      .update({
        name: resolvedName,
        phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode || null,
      })
      .eq("id", customerId);
  } else {
    const { data: insertedCustomer, error: cErr } = await supabase
      .from("customers")
      .insert({
        name: resolvedName,
        email: emailLc,
        phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode || null,
        source: "storefront",
      })
      .select("id")
      .single();

    if (cErr || !insertedCustomer) {
      redirect("/checkout?error=order");
    }
    customerId = insertedCustomer.id as string;
  }

  const { data: orderRow, error: oErr } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      customer_email: customerEmail,
      customer_name: resolvedName,
      total_cents: total,
      currency,
      status: "pending",
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_postal_code: shippingPostalCode || null,
      shipping_phone: shippingPhone,
    })
    .select("id")
    .single();

  if (oErr || !orderRow) {
    redirect("/checkout?error=order");
  }

  const orderId = orderRow.id as string;

  const { error: iErr } = await supabase.from("order_items").insert(
    lines.map((l) => ({
      order_id: orderId,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_price_cents: l.unit_price_cents,
      product_name_snapshot: l.product_name_snapshot,
    })),
  );

  if (iErr) {
    await supabase.from("orders").delete().eq("id", orderId);
    redirect("/checkout?error=items");
  }

  const redirectUrl = `${siteUrl()}/checkout/return?order_id=${orderId}`;
  const link = await createPaymentLink({
    name: `${storeBrand} · Pedido`,
    description: `Pedido ${orderId}`,
    amountInCents: total,
    currency,
    redirectUrl,
    sku: orderId,
    singleUse: true,
  });

  if (!link.ok) {
    await supabase.from("orders").delete().eq("id", orderId);
    redirect(
      `/checkout?error=wompi&message=${encodeURIComponent(link.error)}`,
    );
  }

  await supabase
    .from("orders")
    .update({
      wompi_payment_link_id: link.id,
      wompi_reference: orderId,
    })
    .eq("id", orderId);

  await setCart([]);

  const env = getWompiEnv();
  if (process.env.NODE_ENV === "development") {
    console.info("[checkout] Wompi env:", env, "order:", orderId);
  }

  redirect(link.url);
}
