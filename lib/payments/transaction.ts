/**
 * Cliente HTTP hacia la API de Wompi (reconciliación server-side).
 */

import { getWompiConfig } from "@/config/payments";
import { PaymentError } from "@/lib/payments/errors";
import { paymentLogger } from "@/lib/payments/logger";
import type { WompiTransaction } from "@/types/wompi";

export async function getWompiTransaction(
  transactionId: string,
): Promise<WompiTransaction> {
  const config = getWompiConfig();
  if (!config.privateKey) {
    throw new PaymentError("CONFIG", "Falta WOMPI_PRIVATE_KEY para consultar transacciones", {
      httpStatus: 500,
    });
  }

  const url = `${config.apiBaseUrl}/transactions/${encodeURIComponent(transactionId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.privateKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as {
    data?: WompiTransaction;
    error?: { messages?: unknown; type?: string };
  } | null;

  if (!res.ok || !json?.data?.id) {
    paymentLogger.error("getWompiTransaction failed", {
      status: res.status,
      transactionId,
      error: json?.error,
    });
    throw new PaymentError("PROVIDER", "No se pudo consultar la transacción en Wompi", {
      httpStatus: 502,
      details: { status: res.status, transactionId },
    });
  }

  return json.data;
}
