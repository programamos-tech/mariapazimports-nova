/**
 * Configuración centralizada de pagos / Wompi.
 * ABSOLUTAMENTE TODO sale de variables de entorno.
 */

import type { WompiEnv } from "@/types/wompi";

export type WompiConfig = {
  env: WompiEnv;
  publicKey: string;
  privateKey: string;
  /** Secret para firma de integridad del Widget (NO es el de eventos). */
  integritySecret: string;
  /** Secret de Events/Webhooks (checksum del evento). */
  eventsSecret: string;
  baseUrl: string;
  apiBaseUrl: string;
  widgetScriptUrl: string;
};

function trimEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getWompiEnv(): WompiEnv {
  return trimEnv("WOMPI_ENV") === "production" ? "production" : "sandbox";
}

export function getPublicBaseUrl(): string {
  const fromEnv =
    trimEnv("NEXT_PUBLIC_BASE_URL") || trimEnv("NEXT_PUBLIC_SITE_URL");
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * ¿Hay llaves suficientes para abrir el Widget in-site?
 * Requiere public + integrity. Private/events se validan al cobrar/webhook.
 */
export function isWompiWidgetConfigured(): boolean {
  return Boolean(
    trimEnv("NEXT_PUBLIC_WOMPI_PUBLIC_KEY") &&
      trimEnv("WOMPI_INTEGRITY_SECRET"),
  );
}

export function isWompiApiConfigured(): boolean {
  return Boolean(trimEnv("WOMPI_PRIVATE_KEY"));
}

export function isWompiEventsConfigured(): boolean {
  return Boolean(trimEnv("WOMPI_EVENTS_SECRET"));
}

/**
 * Config completa para operaciones server-side.
 * Lanza si faltan secretos críticos (no degradar a "skip" en producción).
 */
export function getWompiConfig(): WompiConfig {
  const env = getWompiEnv();
  const publicKey = trimEnv("NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
  const privateKey = trimEnv("WOMPI_PRIVATE_KEY");
  const integritySecret = trimEnv("WOMPI_INTEGRITY_SECRET");
  const eventsSecret = trimEnv("WOMPI_EVENTS_SECRET");

  if (!publicKey) {
    throw new Error("Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
  }
  if (!integritySecret) {
    throw new Error("Falta WOMPI_INTEGRITY_SECRET (firma del Widget)");
  }

  return {
    env,
    publicKey,
    privateKey,
    integritySecret,
    eventsSecret,
    baseUrl: getPublicBaseUrl(),
    apiBaseUrl:
      env === "production"
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1",
    widgetScriptUrl: "https://checkout.wompi.co/widget.js",
  };
}

/** Solo valores seguros para el cliente (nunca secrets). */
export function getWompiPublicClientConfig(): {
  publicKey: string;
  env: WompiEnv;
  widgetScriptUrl: string;
} {
  const env = getWompiEnv();
  const publicKey = trimEnv("NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
  if (!publicKey) {
    throw new Error("Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
  }
  return {
    publicKey,
    env,
    widgetScriptUrl: "https://checkout.wompi.co/widget.js",
  };
}
