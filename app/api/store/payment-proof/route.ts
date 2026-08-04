import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  confirmPaymentProofUpload,
  createPaymentProofSignedUpload,
  uploadOrderPaymentProof,
} from "@/lib/order-payment-proof-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ERROR_MESSAGES: Record<string, string> = {
  archivo: "Selecciona un archivo válido.",
  tipo: "Formato no permitido. Usa JPG, PNG, WebP, HEIC o PDF (máx. 8 MB).",
  order: "No encontramos este pedido.",
  paid: "Este pedido ya está pagado.",
  limite: "Ya subiste el máximo de comprobantes para este pedido.",
  subida: "No se pudo subir el archivo. Intenta de nuevo.",
  db: "No se pudo registrar el comprobante.",
};

function jsonError(error: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error,
      message: ERROR_MESSAGES[error] ?? "Error al subir.",
    },
    { status },
  );
}

function statusFor(error: string) {
  if (error === "order") return 404;
  if (error === "limite") return 409;
  if (error === "subida" || error === "db") return 502;
  return 400;
}

function revalidateProofPaths(orderId: string, token: string) {
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/pedidos/seguimiento/${token}`);
  revalidatePath("/checkout/transferencia");
}

/**
 * Flujo preferido (signed URL):
 * 1) POST JSON { intent: "prepare", order_id, token, file_name, mime_type, size }
 * 2) Cliente sube el archivo a `signedUrl`
 * 3) POST JSON { intent: "confirm", order_id, token, storage_key, file_name, content_type }
 *
 * Compat: POST multipart con `file` (proxy por el servidor).
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let body: {
      intent?: string;
      order_id?: string;
      token?: string;
      file_name?: string;
      mime_type?: string;
      size?: number;
      storage_key?: string;
      content_type?: string;
    };
    try {
      body = await request.json();
    } catch {
      return jsonError("archivo", 400);
    }

    const orderId = String(body.order_id ?? "").trim();
    const token = String(body.token ?? "").trim();
    const intent = String(body.intent ?? "").trim();

    if (intent === "prepare") {
      const result = await createPaymentProofSignedUpload({
        orderId,
        token,
        fileName: String(body.file_name ?? "comprobante.jpg"),
        mimeType: String(body.mime_type ?? ""),
        size: Number(body.size ?? 0),
      });
      if (!result.ok) {
        return jsonError(result.error, statusFor(result.error));
      }
      return NextResponse.json({ ok: true, upload: result.upload });
    }

    if (intent === "confirm") {
      const result = await confirmPaymentProofUpload({
        orderId,
        token,
        storageKey: String(body.storage_key ?? ""),
        fileName: String(body.file_name ?? "comprobante"),
        contentType: String(body.content_type ?? "application/octet-stream"),
      });
      if (!result.ok) {
        return jsonError(result.error, statusFor(result.error));
      }
      revalidateProofPaths(orderId, token);
      return NextResponse.json({ ok: true });
    }

    return jsonError("archivo", 400);
  }

  // Multipart fallback (archivos chicos / entornos locales)
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("[payment-proof] formData", err);
    return jsonError("archivo", 400);
  }

  const orderId = String(formData.get("order_id") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return jsonError("archivo", 400);
  }

  const result = await uploadOrderPaymentProof({ orderId, token, file });
  if (!result.ok) {
    return jsonError(result.error, statusFor(result.error));
  }

  revalidateProofPaths(orderId, token);
  return NextResponse.json({ ok: true });
}
