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

function transferenciaUrl(orderId: string, token: string, error?: string) {
  const base = `/checkout/transferencia?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
  return error ? `${base}&error=${encodeURIComponent(error)}` : base;
}

export type StorePaymentProof = {
  id: string;
  fileName: string;
  mimeType: string | null;
  uploadedAt: string;
  signedUrl: string | null;
};

/** Comprobantes del pedido para la tienda (validados con token de seguimiento). */
export async function listStoreOrderPaymentProofs(
  orderId: string,
  token: string,
): Promise<StorePaymentProof[]> {
  const oid = orderId.trim();
  const tok = token.trim();
  if (!oid || !tok) return [];

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", oid)
    .eq("tracking_token", tok)
    .maybeSingle();

  if (!order) return [];

  const { data: rows } = await supabase
    .from("order_payment_proofs")
    .select("id, file_name, mime_type, uploaded_at, storage_path")
    .eq("order_id", oid)
    .order("uploaded_at", { ascending: false });

  if (!rows?.length) return [];

  return Promise.all(
    rows.map(async (row) => {
      const storagePath = String(row.storage_path ?? "");
      const key = storagePath.replace(/^order-payment-proofs\//, "");
      const { data: signed } = await supabase.storage
        .from("order-payment-proofs")
        .createSignedUrl(key, 60 * 30);

      return {
        id: String(row.id),
        fileName: String(row.file_name ?? "comprobante"),
        mimeType: row.mime_type != null ? String(row.mime_type) : null,
        uploadedAt: String(row.uploaded_at ?? ""),
        signedUrl: signed?.signedUrl ?? null,
      };
    }),
  );
}

export async function uploadOrderPaymentProofAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const file = formData.get("file");

  if (!orderId || !token || !(file instanceof File) || file.size <= 0) {
    redirect(transferenciaUrl(orderId, token, "archivo"));
  }

  if (!isAllowedProofFile(file)) {
    redirect(transferenciaUrl(orderId, token, "tipo"));
  }

  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_method, fulfillment_status")
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
    redirect(transferenciaUrl(orderId, token));
  }

  const { count } = await supabase
    .from("order_payment_proofs")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if ((count ?? 0) >= 3) {
    redirect(transferenciaUrl(orderId, token, "limite"));
  }

  const safeName =
    file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "comprobante";
  const storageKey = `${orderId}/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("order-payment-proofs")
    .upload(storageKey, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upErr) {
    redirect(transferenciaUrl(orderId, token, "subida"));
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
    redirect(transferenciaUrl(orderId, token, "db"));
  }

  await supabase
    .from("orders")
    .update({ fulfillment_status: "payment_submitted" })
    .eq("id", orderId);

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/pedidos/seguimiento/${token}`);
  revalidatePath("/checkout/transferencia");

  redirect(`${transferenciaUrl(orderId, token)}&uploaded=1`);
}
