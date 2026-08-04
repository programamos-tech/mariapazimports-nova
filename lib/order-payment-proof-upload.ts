import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const MAX_PROOF_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export type PaymentProofUploadError =
  | "archivo"
  | "tipo"
  | "order"
  | "paid"
  | "limite"
  | "subida"
  | "db";

export type PaymentProofUploadResult =
  | { ok: true }
  | { ok: false; error: PaymentProofUploadError; detail?: string };

export function fileNameOf(file: Blob): string {
  if (typeof File !== "undefined" && file instanceof File && file.name.trim()) {
    return file.name.trim();
  }
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf") return "comprobante.pdf";
  if (type.includes("png")) return "comprobante.png";
  if (type.includes("webp")) return "comprobante.webp";
  if (type.includes("heic") || type.includes("heif")) return "comprobante.heic";
  return "comprobante.jpg";
}

export function isAllowedProofMeta(input: {
  fileName: string;
  mimeType: string;
  size: number;
}): boolean {
  if (input.size <= 0 || input.size > MAX_PROOF_BYTES) return false;
  const type = (input.mimeType || "").toLowerCase();
  if (ALLOWED_MIME.has(type)) return true;
  const name = input.fileName.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    name.endsWith(".pdf")
  );
}

export function isAllowedProofFile(file: Blob): boolean {
  return isAllowedProofMeta({
    fileName: fileNameOf(file),
    mimeType: file.type || "",
    size: file.size,
  });
}

export function resolveProofContentType(fileName: string, mimeType: string) {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

async function assertBankTransferOrder(orderId: string, token: string) {
  const supabase = createSupabaseServiceClient();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, status, payment_method, fulfillment_status")
    .eq("id", orderId)
    .eq("tracking_token", token)
    .maybeSingle();

  if (orderErr) {
    console.error("[payment-proof] order lookup", orderErr.message);
    return {
      ok: false as const,
      error: "db" as const,
      detail: orderErr.message,
    };
  }

  if (
    !order ||
    order.payment_method !== "bank_transfer" ||
    order.status === "cancelled"
  ) {
    return { ok: false as const, error: "order" as const };
  }

  if (order.status === "paid") {
    return { ok: false as const, error: "paid" as const };
  }

  const { count, error: countErr } = await supabase
    .from("order_payment_proofs")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if (countErr) {
    console.error("[payment-proof] count", countErr.message);
    return {
      ok: false as const,
      error: "db" as const,
      detail: countErr.message,
    };
  }

  if ((count ?? 0) >= 3) {
    return { ok: false as const, error: "limite" as const };
  }

  return { ok: true as const, supabase, order };
}

export type SignedProofUpload = {
  storageKey: string;
  signedUrl: string;
  token: string;
  contentType: string;
  fileName: string;
};

/** URL firmada para subir el archivo directo a Storage (evita límite de body en Vercel). */
export async function createPaymentProofSignedUpload(input: {
  orderId: string;
  token: string;
  fileName: string;
  mimeType: string;
  size: number;
}): Promise<
  | { ok: true; upload: SignedProofUpload }
  | { ok: false; error: PaymentProofUploadError; detail?: string }
> {
  const orderId = input.orderId.trim();
  const token = input.token.trim();
  if (!orderId || !token) return { ok: false, error: "archivo" };

  if (
    !isAllowedProofMeta({
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
    })
  ) {
    return { ok: false, error: "tipo" };
  }

  const gate = await assertBankTransferOrder(orderId, token);
  if (!gate.ok) return gate;

  const originalName = input.fileName.trim() || "comprobante.jpg";
  const safeName =
    originalName.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "comprobante";
  const storageKey = `${orderId}/${Date.now()}-${safeName}`;
  const contentType = resolveProofContentType(originalName, input.mimeType);

  const { data, error } = await gate.supabase.storage
    .from("order-payment-proofs")
    .createSignedUploadUrl(storageKey);

  if (error || !data?.signedUrl || !data.token) {
    console.error("[payment-proof] signed upload url", error?.message);
    return { ok: false, error: "subida", detail: error?.message };
  }

  return {
    ok: true,
    upload: {
      storageKey,
      signedUrl: data.signedUrl,
      token: data.token,
      contentType,
      fileName: originalName.slice(0, 200),
    },
  };
}

/** Confirma el archivo ya subido a Storage y lo registra en la venta. */
export async function confirmPaymentProofUpload(input: {
  orderId: string;
  token: string;
  storageKey: string;
  fileName: string;
  contentType: string;
}): Promise<PaymentProofUploadResult> {
  const orderId = input.orderId.trim();
  const token = input.token.trim();
  const storageKey = input.storageKey.trim();
  if (!orderId || !token || !storageKey) {
    return { ok: false, error: "archivo" };
  }

  // Solo permitir keys del pedido (evita path traversal).
  if (
    !storageKey.startsWith(`${orderId}/`) ||
    storageKey.includes("..") ||
    storageKey.includes("\\")
  ) {
    return { ok: false, error: "archivo" };
  }

  const gate = await assertBankTransferOrder(orderId, token);
  if (!gate.ok) return gate;

  const { error: headErr } = await gate.supabase.storage
    .from("order-payment-proofs")
    .createSignedUrl(storageKey, 30);
  if (headErr) {
    console.error("[payment-proof] missing object", headErr.message);
    return { ok: false, error: "subida", detail: "Archivo no encontrado" };
  }

  const storagePath = `order-payment-proofs/${storageKey}`;
  const { error: insErr } = await gate.supabase.from("order_payment_proofs").insert({
    order_id: orderId,
    storage_path: storagePath,
    file_name: input.fileName.slice(0, 200) || "comprobante",
    mime_type: input.contentType || null,
  });

  if (insErr) {
    console.error("[payment-proof] insert", insErr.message);
    await gate.supabase.storage.from("order-payment-proofs").remove([storageKey]);
    return { ok: false, error: "db", detail: insErr.message };
  }

  const { error: updErr } = await gate.supabase
    .from("orders")
    .update({ fulfillment_status: "payment_submitted" })
    .eq("id", orderId);

  if (updErr) {
    console.error("[payment-proof] fulfillment update", updErr.message);
  }

  return { ok: true };
}

/** Subida proxy (Server Action / API) — útil en local; en prod preferir signed URL. */
export async function uploadOrderPaymentProof(input: {
  orderId: string;
  token: string;
  file: Blob;
}): Promise<PaymentProofUploadResult> {
  const orderId = input.orderId.trim();
  const token = input.token.trim();
  const file = input.file;

  if (!orderId || !token || !(file instanceof Blob) || file.size <= 0) {
    return { ok: false, error: "archivo" };
  }

  if (!isAllowedProofFile(file)) {
    return { ok: false, error: "tipo" };
  }

  const gate = await assertBankTransferOrder(orderId, token);
  if (!gate.ok) return gate;

  const originalName = fileNameOf(file);
  const safeName =
    originalName.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "comprobante";
  const storageKey = `${orderId}/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const contentType = resolveProofContentType(originalName, file.type || "");

  const { error: upErr } = await gate.supabase.storage
    .from("order-payment-proofs")
    .upload(storageKey, buf, {
      contentType,
      upsert: false,
    });

  if (upErr) {
    console.error("[payment-proof] storage upload", upErr.message, upErr);
    return { ok: false, error: "subida", detail: upErr.message };
  }

  return confirmPaymentProofUpload({
    orderId,
    token,
    storageKey,
    fileName: originalName,
    contentType,
  });
}
