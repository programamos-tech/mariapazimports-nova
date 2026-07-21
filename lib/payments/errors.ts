/**
 * Errores tipados del SDK de pagos.
 */

export type PaymentErrorCode =
  | "CONFIG"
  | "VALIDATION"
  | "SIGNATURE"
  | "AMOUNT_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "REFERENCE"
  | "NOT_FOUND"
  | "PROVIDER"
  | "IDEMPOTENT"
  | "STATE"
  | "DATABASE";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PaymentErrorCode,
    message: string,
    opts?: { httpStatus?: number; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, opts?.cause ? { cause: opts.cause } : undefined);
    this.name = "PaymentError";
    this.code = code;
    this.httpStatus = opts?.httpStatus ?? 400;
    this.details = opts?.details;
  }
}

export class SignatureError extends PaymentError {
  constructor(message = "Firma inválida", details?: Record<string, unknown>) {
    super("SIGNATURE", message, { httpStatus: 401, details });
    this.name = "SignatureError";
  }
}

export class AmountMismatchError extends PaymentError {
  constructor(expected: number, actual: number) {
    super("AMOUNT_MISMATCH", "El monto del proveedor no coincide con el pago", {
      httpStatus: 409,
      details: { expected, actual },
    });
    this.name = "AmountMismatchError";
  }
}

export function isPaymentError(err: unknown): err is PaymentError {
  return err instanceof PaymentError;
}
