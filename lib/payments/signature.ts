/**
 * Firmas criptográficas Wompi.
 *
 * Widget integrity:
 *   SHA256(reference + amountInCents + currency + integritySecret)
 *   Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 *
 * Events / webhook:
 *   SHA256(concat(propertyValues) + timestamp + eventsSecret)
 *   Header: X-Event-Checksum
 *   Docs: Events guide (Wompi)
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { getWompiConfig } from "@/config/payments";
import { SignatureError } from "@/lib/payments/errors";
import type { WompiWebhookPayload } from "@/types/wompi";

export type IntegritySignatureInput = {
  reference: string;
  amountInCents: number;
  currency: string;
  /** ISO8601 opcional; si se envía, se incluye antes del secret. */
  expirationTime?: string;
  integritySecret?: string;
};

export function generateIntegritySignature(
  input: IntegritySignatureInput,
): string {
  const secret =
    input.integritySecret ?? getWompiConfig().integritySecret;
  const base = `${input.reference}${input.amountInCents}${input.currency}`;
  const payload = input.expirationTime
    ? `${base}${input.expirationTime}${secret}`
    : `${base}${secret}`;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as object)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a.toLowerCase(), "utf8");
    const bb = Buffer.from(b.toLowerCase(), "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Verifica el checksum de un evento Wompi.
 * @param payload cuerpo JSON parseado
 * @param headerChecksum valor de `X-Event-Checksum` (preferido) o signature.checksum
 * @param eventsSecret override (tests); por defecto env
 * @param maxAgeSeconds anti-replay (default 10 min)
 */
export function verifyEventChecksum(
  payload: unknown,
  headerChecksum: string | null | undefined,
  opts?: { eventsSecret?: string; maxAgeSeconds?: number },
): boolean {
  const secret =
    opts?.eventsSecret ??
    (() => {
      try {
        return getWompiConfig().eventsSecret;
      } catch {
        return "";
      }
    })();

  if (!secret) {
    // En producción NUNCA omitir verificación.
    if (process.env.NODE_ENV === "production") {
      throw new SignatureError("WOMPI_EVENTS_SECRET no configurado");
    }
    // En dev, fallar cerrado si se intenta verificar sin secret.
    return false;
  }

  if (!payload || typeof payload !== "object") return false;
  const event = payload as WompiWebhookPayload;
  const properties = event.signature?.properties;
  const checksum =
    (headerChecksum?.trim() || event.signature?.checksum || "").trim();
  if (!properties?.length || !checksum) return false;

  const timestamp = event.timestamp;
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return false;
  }

  const maxAge = opts?.maxAgeSeconds ?? 600;
  const nowSec = Math.floor(Date.now() / 1000);
  // Wompi envía timestamp en segundos (a veces ms). Normalizar.
  const tsSec = timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
  if (Math.abs(nowSec - tsSec) > maxAge) {
    return false;
  }

  const concat = properties
    .map((p) => {
      const v = getPath(event, p) ?? getPath(event.data, p);
      if (v === undefined || v === null) return "";
      return String(v);
    })
    .join("");

  const digest = createHash("sha256")
    .update(`${concat}${timestamp}${secret}`, "utf8")
    .digest("hex")
    .toUpperCase();

  return safeEqualHex(digest, checksum.toUpperCase());
}
