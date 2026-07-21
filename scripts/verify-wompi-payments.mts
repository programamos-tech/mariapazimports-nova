/**
 * Verificación rápida de amount + integrity signature (sin red).
 * Uso: node --experimental-strip-types scripts/verify-wompi-payments.mts
 * o: npx tsx scripts/verify-wompi-payments.mts
 */

import { createHash } from "node:crypto";

function pesosToWompiCents(pesos: number): number {
  return pesos * 100;
}

function integrity(reference: string, amountInCents: number, currency: string, secret: string) {
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${secret}`, "utf8")
    .digest("hex");
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

const pesos = 289900;
const cents = pesosToWompiCents(pesos);
assert(cents === 28990000, "289900 COP → 28990000 centavos Wompi");

const ref = "ord_test_ref_001";
const secret = "test_integrity_secret";
const sig = integrity(ref, cents, "COP", secret);
const expected = createHash("sha256")
  .update(`${ref}${cents}COP${secret}`, "utf8")
  .digest("hex");
assert(sig === expected, "integrity SHA256(reference+amount+currency+secret)");

// Event checksum shape (properties concat + timestamp + events secret)
const eventsSecret = "test_events_secret";
const ts = 1700000000;
const concat = "APPROVED" + "28990000";
const eventDigest = createHash("sha256")
  .update(`${concat}${ts}${eventsSecret}`, "utf8")
  .digest("hex")
  .toUpperCase();
assert(eventDigest.length === 64, "event checksum hex length 64");

console.log(process.exitCode ? "\nAlgunas aserciones fallaron" : "\nTodas las aserciones OK");
