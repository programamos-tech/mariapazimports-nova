"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadOrderPaymentProof } from "@/lib/order-payment-proof-upload";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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

function revalidateAfterProof(orderId: string, token: string) {
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/pedidos/seguimiento/${token}`);
  revalidatePath("/checkout/transferencia");
}

export async function uploadOrderPaymentProofAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    redirect(transferenciaUrl(orderId, token, "archivo"));
  }

  const result = await uploadOrderPaymentProof({ orderId, token, file });

  if (!result.ok) {
    if (result.error === "order") redirect("/checkout?error=order");
    if (result.error === "paid") redirect(transferenciaUrl(orderId, token));
    redirect(transferenciaUrl(orderId, token, result.error));
  }

  revalidateAfterProof(orderId, token);
  redirect(`${transferenciaUrl(orderId, token)}&uploaded=1`);
}
