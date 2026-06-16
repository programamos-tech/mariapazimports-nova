import { randomBytes } from "node:crypto";

export type BankTransferDetails = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  paymentKey: string | null;
  nit: string | null;
  referenceHint: string;
};

/** Referencia en `wompi_reference` para transferencias del checkout online. */
export const ONLINE_BANK_TRANSFER_REF = "ONLINE:transfer";

export function isOnlineBankTransferOrder(
  wompiReference: string | null | undefined,
  paymentMethod?: string | null,
): boolean {
  if (paymentMethod === "bank_transfer") return true;
  return (wompiReference?.trim() ?? "") === ONLINE_BANK_TRANSFER_REF;
}

export function getPublicBankTransferDetails(): BankTransferDetails | null {
  const bankName = process.env.NEXT_PUBLIC_STORE_BANK_NAME?.trim() ?? "";
  const accountType =
    process.env.NEXT_PUBLIC_STORE_BANK_ACCOUNT_TYPE?.trim() ?? "";
  const accountNumber =
    process.env.NEXT_PUBLIC_STORE_BANK_ACCOUNT_NUMBER?.trim() ?? "";
  const holderName =
    process.env.NEXT_PUBLIC_STORE_BANK_HOLDER_NAME?.trim() ?? "";
  const paymentKey =
    process.env.NEXT_PUBLIC_STORE_BANK_PAYMENT_KEY?.trim() || null;
  const nit = process.env.NEXT_PUBLIC_STORE_BANK_NIT?.trim() || null;
  const referenceHint =
    process.env.NEXT_PUBLIC_STORE_BANK_REFERENCE_HINT?.trim() ||
    "Usa el número de pedido como referencia de la transferencia.";

  if (!bankName || !accountType || !accountNumber || !holderName) {
    return null;
  }

  return {
    bankName,
    accountType,
    accountNumber,
    holderName,
    paymentKey,
    nit,
    referenceHint,
  };
}

export function isBankTransferConfigured(): boolean {
  return getPublicBankTransferDetails() !== null;
}

export function createOrderTrackingToken(): string {
  return randomBytes(24).toString("hex");
}

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\s/g, "");
  if (digits.length <= 4) return accountNumber;
  const tail = digits.slice(-4);
  return `•••• ${tail}`;
}
