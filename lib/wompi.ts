/**
 * Legacy Wompi helpers (Payment Links).
 * El flujo principal de la tienda usa Widget + `lib/payments/*` y `PaymentService`.
 * `verifyWompiEventIntegrity` está deprecado: el webhook usa `verifyEventChecksum`
 * con `WOMPI_EVENTS_SECRET` (no el integrity secret del Widget).
 */

import { createHash } from "node:crypto";
import { verifyEventChecksum } from "@/lib/payments/signature";

export type WompiEnv = "sandbox" | "production";

export function getWompiBaseUrl(env: WompiEnv = "sandbox") {
  return env === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";
}

export function getWompiEnv(): WompiEnv {
  return process.env.WOMPI_ENV === "production" ? "production" : "sandbox";
}

/** Sin `WOMPI_PRIVATE_KEY`, en desarrollo (o con `CHECKOUT_SKIP_WOMPI=true`) el checkout no llama a Wompi. */
export function shouldSkipWompiPayment(): boolean {
  if (process.env.WOMPI_PRIVATE_KEY?.trim()) return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.CHECKOUT_SKIP_WOMPI === "1" ||
    process.env.CHECKOUT_SKIP_WOMPI === "true"
  );
}

type CreatePaymentLinkInput = {
  name: string;
  description: string;
  amountInCents: number;
  currency?: string;
  redirectUrl: string;
  /** Max 36 chars per Wompi; we use order id (36 with hyphens). */
  sku: string;
  singleUse?: boolean;
};

export type CreatePaymentLinkResult =
  | { ok: true; id: string; url: string }
  | { ok: false; error: string; status?: number };

/**
 * Creates a single-use payment link. Docs: POST /v1/payment_links
 * @deprecated Prefer Widget Checkout (`createWompiCheckoutSession`).
 */
export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResult> {
  const key = process.env.WOMPI_PRIVATE_KEY;
  if (!key) {
    return { ok: false, error: "WOMPI_PRIVATE_KEY is not set" };
  }

  const base = getWompiBaseUrl(getWompiEnv());
  const body = {
    name: input.name,
    description: input.description,
    amount_in_cents: input.amountInCents,
    currency: input.currency ?? "COP",
    single_use: input.singleUse ?? true,
    collect_shipping: false,
    redirect_url: input.redirectUrl,
    sku: input.sku.slice(0, 36),
  };

  const res = await fetch(`${base}/payment_links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!res.ok) {
    const err =
      (json?.error as string) ||
      (json?.message as string) ||
      `Wompi error (${res.status})`;
    return { ok: false, error: err, status: res.status };
  }

  const data = json?.data as Record<string, unknown> | undefined;
  const id = String(data?.id ?? "");
  const url = String(
    data?.permalink ?? data?.checkout_url ?? data?.url ?? "",
  );
  if (!id || !url) {
    return {
      ok: false,
      error: "Unexpected Wompi response: missing id or checkout URL",
      status: res.status,
    };
  }

  return { ok: true, id, url };
}

/**
 * @deprecated Usa `verifyEventChecksum` de `@/lib/payments/signature` con
 * `WOMPI_EVENTS_SECRET`. Esta función usaba el integrity secret incorrecto
 * y omitía el timestamp.
 */
export function verifyWompiEventIntegrity(event: unknown): boolean {
  let header: string | null = null;
  if (event && typeof event === "object" && "signature" in event) {
    const checksum = (event as { signature?: { checksum?: string } }).signature
      ?.checksum;
    header = typeof checksum === "string" ? checksum : null;
  }
  try {
    return verifyEventChecksum(event, header);
  } catch {
    return false;
  }
}

/** @deprecated Solo para scripts de diagnóstico legacy. */
export function legacyIntegrityDigestWithoutTimestamp(
  concat: string,
  secret: string,
): string {
  return createHash("sha256")
    .update(`${concat}${secret}`, "utf8")
    .digest("hex")
    .toUpperCase();
}
