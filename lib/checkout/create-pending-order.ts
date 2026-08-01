/**
 * Crea un pedido pendiente de la tienda a partir del FormData del checkout.
 * Compartido por transferencia y por sesión Widget Wompi.
 * Solo importar desde Server Actions / Route Handlers (usa redirect).
 */

import { getCart, normalizeCartForCheckout, setCart } from "@/lib/cart";
import {
  ensureStoreCustomerLinked,
  attachAuthUserToCustomerEmail,
} from "@/lib/store-customer-service";
import {
  findVariantForCartLine,
  migrateLegacyFragranceToVariantId,
  resolveCartLinePrice,
  type CartNormalizeProduct,
} from "@/lib/store-listing-variant-meta";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  fetchProductVariantsByProductIds,
  parseProductVariantAxis,
} from "@/lib/product-variants";
import { findActiveStoreCouponForCheckout } from "@/lib/store-coupons";
import {
  quoteShippingForMunicipality,
  SHIPPING_METHOD_DELIVERY,
} from "@/lib/shipping-rates";
import {
  createOrderTrackingToken,
  isBankTransferConfigured,
  ONLINE_BANK_TRANSFER_REF,
} from "@/lib/bank-transfer";
import {
  normalizeMunicipalityCode,
  normalizeDepartmentCode,
} from "@/lib/colombia-geo";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PendingStoreOrder = {
  orderId: string;
  totalPesos: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  trackingToken: string | null;
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isDuplicateDbError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "23505" ||
    error.message?.toLowerCase().includes("duplicate") ||
    error.message?.toLowerCase().includes("unique")
  );
}

export async function createPendingStoreOrderFromForm(
  formData: FormData,
  paymentMethod: "wompi" | "bank_transfer",
): Promise<PendingStoreOrder> {
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
  const shippingMunicipalityCode =
    normalizeMunicipalityCode(
      String(formData.get("shippingMunicipalityCode") ?? "").trim(),
    ) ?? "";
  const shippingDepartmentCode =
    normalizeDepartmentCode(
      String(formData.get("shippingDepartmentCode") ?? "").trim(),
    ) ?? "";
  const couponCode = String(formData.get("couponCode") ?? "").trim();

  if (paymentMethod === "bank_transfer" && !isBankTransferConfigured()) {
    redirect("/checkout?error=bank_transfer_unavailable");
  }

  if (!resolvedName) {
    redirect("/checkout?error=missing_name");
  }
  if (
    !shippingAddress ||
    !shippingPhone ||
    !shippingMunicipalityCode ||
    !shippingDepartmentCode
  ) {
    redirect("/checkout?error=missing_shipping");
  }

  const sessionSb = await createSupabaseServerClient();
  const {
    data: { user: sessionUser },
  } = await sessionSb.auth.getUser();

  let customerEmailForOrder = customerEmail;
  let linkedCustomerId: string | null = null;
  let storeSessionUserId: string | null = null;

  if (sessionUser?.email) {
    const { data: adminProf } = await sessionSb
      .from("profiles")
      .select("id")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (!adminProf) {
      storeSessionUserId = sessionUser.id;
      const sessionMeta = sessionUser.user_metadata as
        | { document_id?: string }
        | undefined;
      linkedCustomerId = await ensureStoreCustomerLinked(
        sessionUser.id,
        sessionUser.email,
        resolvedName,
        sessionMeta?.document_id ?? null,
      );
      customerEmailForOrder = sessionUser.email;
    }
  }

  // Correo opcional en transferencia; si viene, debe ser válido.
  // Wompi sí lo exige para crear el pago en línea.
  if (customerEmailForOrder && !isEmail(customerEmailForOrder)) {
    redirect("/checkout?error=invalid_email");
  }
  if (paymentMethod === "wompi" && !isEmail(customerEmailForOrder)) {
    redirect("/checkout?error=invalid_email");
  }

  const cart = await getCart();
  if (!cart.length) {
    redirect("/checkout?error=empty");
  }

  const supabase = createSupabaseServiceClient();
  const ids = [...new Set(cart.map((l) => l.productId))];
  const [{ data: products, error: pErr }, variantMap] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,price_cents,currency,stock_quantity,is_published,variant_axis",
      )
      .in("id", ids),
    fetchProductVariantsByProductIds(supabase, ids),
  ]);

  if (pErr) {
    redirect("/checkout?error=products");
  }

  const byId = new Map(
    (products ?? []).map((p) => [
      p.id,
      {
        is_published: p.is_published,
        stock_quantity: p.stock_quantity,
        variant_axis: p.variant_axis,
      },
    ]),
  );
  const variantStockMap = new Map<
    string,
    { id: string; stockQuantity: number }[]
  >();
  for (const [pid, variants] of variantMap) {
    variantStockMap.set(
      pid,
      variants.map((v) => ({ id: v.id, stockQuantity: v.stockQuantity })),
    );
  }

  const migrated = cart.map((line) => {
    const p = byId.get(line.productId);
    if (!p) return line;
    const axis = parseProductVariantAxis(p.variant_axis);
    const variants = variantMap.get(line.productId) ?? [];
    const variantId = migrateLegacyFragranceToVariantId(line, variants, axis);
    return {
      productId: line.productId,
      quantity: line.quantity,
      ...(variantId ? { variantId } : {}),
    };
  });

  const normalized = normalizeCartForCheckout(migrated, byId, variantStockMap);

  if (JSON.stringify(cart) !== JSON.stringify(normalized)) {
    await setCart(normalized);
  }

  if (!normalized.length) {
    redirect("/checkout?error=empty");
  }

  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  let total = 0;
  const lines: {
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    product_name_snapshot: string;
    variant_id: string | null;
    variant_label_snapshot: string | null;
  }[] = [];

  for (const line of normalized) {
    const p = productById.get(line.productId);
    if (!p) {
      redirect("/checkout?error=removed");
    }
    const variants = variantMap.get(line.productId) ?? [];
    const variant = findVariantForCartLine(variants, line.variantId);
    const unitPrice = resolveCartLinePrice(p as CartNormalizeProduct, variant);
    const sub = unitPrice * line.quantity;
    total += sub;
    const variantLabel = variant?.label?.trim() || null;
    lines.push({
      product_id: p.id,
      quantity: line.quantity,
      unit_price_cents: unitPrice,
      product_name_snapshot: variantLabel
        ? `${p.name} (${variantLabel})`
        : p.name,
      variant_id: variant?.id ?? null,
      variant_label_snapshot: variantLabel,
    });
  }

  let discount = 0;
  if (couponCode) {
    const couponMatch = await findActiveStoreCouponForCheckout(
      supabase,
      couponCode,
    );
    if (!couponMatch) {
      redirect("/checkout?error=coupon_invalid");
    }
    const eligible =
      couponMatch.eligible_product_ids === null
        ? total
        : normalized.reduce((sum, line) => {
            if (!couponMatch.eligible_product_ids!.has(line.productId)) {
              return sum;
            }
            const p = productById.get(line.productId);
            if (!p) return sum;
            const variants = variantMap.get(line.productId) ?? [];
            const variant = findVariantForCartLine(variants, line.variantId);
            const unitPrice = resolveCartLinePrice(
              p as CartNormalizeProduct,
              variant,
            );
            return sum + unitPrice * line.quantity;
          }, 0);
    if (
      couponMatch.eligible_product_ids !== null &&
      couponMatch.eligible_product_ids.size > 0 &&
      eligible <= 0
    ) {
      redirect("/checkout?error=coupon_no_eligible_items");
    }
    discount = Math.max(
      0,
      Math.round((eligible * couponMatch.discount_percent) / 100),
    );
  }
  const totalWithDiscount = Math.max(0, total - discount);

  const shippingQuote = await quoteShippingForMunicipality(
    supabase,
    shippingMunicipalityCode,
  );
  if (
    !shippingQuote ||
    shippingQuote.departmentCode !== shippingDepartmentCode
  ) {
    redirect("/checkout?error=shipping_unavailable");
  }
  const shippingCents = shippingQuote.costCents;
  const orderSubtotalCents = totalWithDiscount;
  const orderTotalCents = orderSubtotalCents + shippingCents;
  const resolvedShippingCity = shippingCity || shippingQuote.label;

  const first = productById.get(normalized[0]!.productId);
  const currency = first?.currency ?? "COP";

  const emailLc = customerEmailForOrder
    ? customerEmailForOrder.toLowerCase()
    : null;

  let customerId: string;

  if (linkedCustomerId) {
    customerId = linkedCustomerId;
    const linkedPatch: Record<string, unknown> = {
      name: resolvedName,
      phone: shippingPhone,
      shipping_address: shippingAddress,
      shipping_city: resolvedShippingCity,
      shipping_postal_code: shippingPostalCode || null,
    };
    if (emailLc) linkedPatch.email = emailLc;
    await supabase.from("customers").update(linkedPatch).eq("id", customerId);
  } else if (emailLc) {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, auth_user_id")
      .eq("email", emailLc)
      .maybeSingle();

    if (existingCustomer?.id) {
      customerId = existingCustomer.id as string;
      const patch: Record<string, unknown> = {
        name: resolvedName,
        phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_city: resolvedShippingCity,
        shipping_postal_code: shippingPostalCode || null,
      };
      if (
        storeSessionUserId &&
        (!existingCustomer.auth_user_id ||
          existingCustomer.auth_user_id === storeSessionUserId)
      ) {
        patch.auth_user_id = storeSessionUserId;
      }
      await supabase.from("customers").update(patch).eq("id", customerId);
      if (storeSessionUserId && !existingCustomer.auth_user_id) {
        linkedCustomerId =
          (await attachAuthUserToCustomerEmail(
            storeSessionUserId,
            customerEmailForOrder,
          )) ?? customerId;
      }
    } else {
      const { data: insertedCustomer, error: cErr } = await supabase
        .from("customers")
        .insert({
          name: resolvedName,
          email: emailLc,
          phone: shippingPhone,
          shipping_address: shippingAddress,
          shipping_city: resolvedShippingCity,
          shipping_postal_code: shippingPostalCode || null,
          source: "storefront",
          auth_user_id: storeSessionUserId,
        })
        .select("id")
        .single();

      if (cErr || !insertedCustomer) {
        if (storeSessionUserId && isDuplicateDbError(cErr)) {
          const recovered = await attachAuthUserToCustomerEmail(
            storeSessionUserId,
            customerEmailForOrder,
          );
          if (recovered) {
            customerId = recovered;
            await supabase
              .from("customers")
              .update({
                name: resolvedName,
                phone: shippingPhone,
                shipping_address: shippingAddress,
                shipping_city: resolvedShippingCity,
                shipping_postal_code: shippingPostalCode || null,
              })
              .eq("id", customerId);
          } else {
            redirect("/checkout?error=order");
          }
        } else {
          redirect("/checkout?error=order");
        }
      } else {
        customerId = insertedCustomer.id as string;
      }
    }
  } else {
    const { data: insertedCustomer, error: cErr } = await supabase
      .from("customers")
      .insert({
        name: resolvedName,
        email: null,
        phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_city: resolvedShippingCity,
        shipping_postal_code: shippingPostalCode || null,
        source: "storefront",
        auth_user_id: storeSessionUserId,
      })
      .select("id")
      .single();

    if (cErr || !insertedCustomer) {
      redirect("/checkout?error=order");
    }
    customerId = insertedCustomer.id as string;
  }

  const trackingToken =
    paymentMethod === "bank_transfer" ? createOrderTrackingToken() : null;

  const { data: orderRow, error: oErr } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      customer_email: customerEmailForOrder || "",
      customer_name: resolvedName,
      total_cents: orderTotalCents,
      subtotal_cents: orderSubtotalCents,
      shipping_cents: shippingCents,
      shipping_department_code: shippingDepartmentCode,
      shipping_municipality_code: shippingMunicipalityCode,
      shipping_method: SHIPPING_METHOD_DELIVERY,
      currency,
      status: "pending",
      payment_method:
        paymentMethod === "bank_transfer" ? "bank_transfer" : "wompi",
      fulfillment_status:
        paymentMethod === "bank_transfer" ? "awaiting_payment" : null,
      tracking_token: trackingToken,
      wompi_reference:
        paymentMethod === "bank_transfer" ? ONLINE_BANK_TRANSFER_REF : null,
      shipping_address: shippingAddress,
      shipping_city: resolvedShippingCity,
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
      variant_id: l.variant_id,
      variant_label_snapshot: l.variant_label_snapshot,
    })),
  );

  if (iErr) {
    await supabase.from("orders").delete().eq("id", orderId);
    redirect("/checkout?error=items");
  }

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/orders");
  revalidatePath("/cuenta/pedidos");

  // Vaciar carrito al crear el pedido (antes de abrir widget / transferencia).
  await setCart([]);

  return {
    orderId,
    totalPesos: orderTotalCents,
    currency,
    customerEmail: customerEmailForOrder,
    customerName: resolvedName,
    customerPhone: shippingPhone,
    trackingToken,
  };
}
