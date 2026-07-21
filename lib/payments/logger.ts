/**
 * Logger reutilizable del SDK de pagos.
 * Redacta secretos conocidos en mensajes/objetos.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const SECRET_KEYS = [
  "privateKey",
  "integritySecret",
  "eventsSecret",
  "WOMPI_PRIVATE_KEY",
  "WOMPI_INTEGRITY_SECRET",
  "WOMPI_EVENTS_SECRET",
  "authorization",
  "Authorization",
];

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEYS.some((k) => k.toLowerCase() === key.toLowerCase())) {
    return "[REDACTED]";
  }
  if (typeof value === "string" && /^(prv_|pub_test_|prod_|test_integrity_)/.test(value)) {
    return `[REDACTED:${value.slice(0, 8)}…]`;
  }
  return value;
}

function sanitize(payload: unknown): unknown {
  if (payload == null || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(sanitize);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    out[k] = typeof v === "object" && v !== null ? sanitize(v) : redactValue(k, v);
  }
  return out;
}

function write(level: LogLevel, message: string, meta?: unknown) {
  const prefix = `[payments] ${message}`;
  const args = meta === undefined ? [prefix] : [prefix, sanitize(meta)];
  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else if (level === "debug" && process.env.NODE_ENV === "development") {
    console.debug(...args);
  } else console.info(...args);
}

export const paymentLogger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
