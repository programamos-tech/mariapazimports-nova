/**
 * Utilidades de montos.
 *
 * IMPORTANTE — convención de este proyecto:
 * - `orders.total_cents`, `products.price_cents`, etc. guardan **pesos enteros COP**
 *   (p. ej. 289900 = $289.900). Ver `formatCop`.
 * - Wompi exige `amount_in_cents` = pesos × 100 (289900 → 28990000).
 *
 * Al copiar este módulo a otro proyecto que sí guarde centavos reales,
 * ajustá `pesosToWompiCents` / `domainAmountToWompiCents`.
 */

import { PaymentError } from "@/lib/payments/errors";

const MAX_WOMPI_CENTS = 999_999_999_999;

export function assertPositiveInteger(n: number, label: string): number {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new PaymentError("VALIDATION", `${label} debe ser un entero positivo`, {
      details: { value: n },
    });
  }
  return n;
}

/** Pesos enteros del dominio → centavos Wompi. */
export function pesosToWompiCents(pesos: number): number {
  const p = assertPositiveInteger(Math.floor(pesos), "Monto (pesos)");
  const cents = p * 100;
  if (cents > MAX_WOMPI_CENTS) {
    throw new PaymentError("VALIDATION", "Monto excede el máximo permitido");
  }
  return cents;
}

export function wompiCentsToPesos(amountInCents: number): number {
  const c = assertPositiveInteger(Math.floor(amountInCents), "Monto (centavos Wompi)");
  if (c % 100 !== 0) {
    // Wompi COP suele usar múltiplos de 100; avisamos pero no bloqueamos.
  }
  return Math.floor(c / 100);
}

/**
 * Punto de extensión: si tu dominio ya guarda centavos reales, cambiá esta función
 * para devolver `amount` sin multiplicar.
 */
export function domainAmountToWompiCents(domainAmountPesos: number): number {
  return pesosToWompiCents(domainAmountPesos);
}

export function amountsMatch(
  expectedWompiCents: number,
  actualWompiCents: number,
): boolean {
  return (
    Number.isInteger(expectedWompiCents) &&
    Number.isInteger(actualWompiCents) &&
    expectedWompiCents === actualWompiCents
  );
}
