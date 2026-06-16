"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function isAllowedProofFile(file: File): boolean {
  if (file.size <= 0 || file.size > MAX_PROOF_BYTES) return false;
  const type = file.type || "";
  if (ALLOWED_MIME.has(type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".pdf")
  );
}

export async function uploadOrderPaymentProofAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const file = formData.get("file");

  if (!orderId || !token || !(file instanceof File)) {
    redirect(
      `/checkout/transferencia?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&error=archivo`,
    );
  }

  if (!isAllowedProofFile(file)) {
    redirect(
      `/checkout/transferencia?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&error=tipo`,
    );
  }

  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_method, wompi_reference, fulfillment_status")
    .eq("id", orderId)
    .eq("tracking_token", token)
    .maybeSingle();

  if (
    !order ||
    order.payment_method !== "bank_transfer" ||
    order.status === "cancelled"
  ) {
    redirect("/checkout?error=order");
  }

  if (order.status === "paid") {
    redirect(`/pedidos/seguimiento/${encodeURIComponent(token)}`);
  }

  const { count } = await supabase
    .from("order_payment_proofs")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if ((count ?? 0) >= 3) {
    redirect(
      `/checkout/transferencia?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&error=limite`,
    );
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "comprobante";
  const storageKey = `${orderId}/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("order-payment-proofs")
    .upload(storageKey, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upErr) {
    redirect(
      `/checkout/transferencia?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&error=subida`,
    );
  }

  const storagePath = `order-payment-proofs/${storageKey}`;
  const { error: insErr } = await supabase.from("order_payment_proofs").insert({
    order_id: orderId,
    storage_path: storagePath,
    file_name: file.name.slice(0, 200),
    mime_type: file.type || null,
  });

  if (insErr) {
    await supabase.storage.from("order-payment-proofs").remove([storageKey]);
    redirect(
      `/checkout/transferencia?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&error=db`,
    );
  }

  await supabase
    .from("orders")
    .update({ fulfillment_status: "payment_submitted" })
    .eq("id", orderId);

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/pedidos/seguimiento/${token}`);

  redirect(`/pedidos/seguimiento/${encodeURIComponent(token)}?uploaded=1`);
}
