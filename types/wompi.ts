/**
 * Tipos del proveedor Wompi (Widget + Events/Webhooks).
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */

export type WompiEnv = "sandbox" | "production";

export const WompiTransactionStatus = {
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
  ERROR: "ERROR",
  PENDING: "PENDING",
  CANCELED: "CANCELED",
  CANCELLED: "CANCELLED",
} as const;

export type WompiTransactionStatus =
  (typeof WompiTransactionStatus)[keyof typeof WompiTransactionStatus];

export type WompiCustomerData = {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  phoneNumberPrefix?: string;
  legalId?: string;
  legalIdType?: string;
};

export type WompiShippingAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  country?: string;
  phoneNumber?: string;
  name?: string;
};

/** Parámetros del Widget JS (`new WidgetCheckout({...})`). */
export type WidgetCheckoutParams = {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: { integrity: string };
  redirectUrl?: string;
  expirationTime?: string;
  customerData?: WompiCustomerData;
  shippingAddress?: WompiShippingAddress;
  taxInCents?: { vat?: number; consumption?: number };
};

/**
 * Arma `customerData` sin campos vacíos/undefined.
 * Wompi rechaza el widget si llegan claves con valor inválido
 * ("El tipo o el valor de los datos del pagador son inválidos").
 * Teléfono solo si hay número + prefijo juntos.
 */
export function buildWompiCustomerData(input: {
  email?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  phoneNumberPrefix?: string | null;
  legalId?: string | null;
  legalIdType?: string | null;
}): WompiCustomerData | undefined {
  const data: WompiCustomerData = {};

  const email = input.email?.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    data.email = email;
  }

  const fullName = input.fullName?.trim();
  if (fullName) {
    data.fullName = fullName;
  }

  const digits = (input.phoneNumber ?? "").replace(/\D/g, "");
  const prefix = input.phoneNumberPrefix?.trim() || "+57";
  // Colombia móvil: 10 dígitos empezando en 3
  const local =
    digits.length === 10
      ? digits
      : digits.length === 12 && digits.startsWith("57")
        ? digits.slice(2)
        : "";
  if (local.length === 10 && prefix) {
    data.phoneNumber = local;
    data.phoneNumberPrefix = prefix.startsWith("+") ? prefix : `+${prefix}`;
  }

  const legalId = input.legalId?.trim();
  const legalIdType = input.legalIdType?.trim();
  if (legalId && legalIdType) {
    data.legalId = legalId;
    data.legalIdType = legalIdType;
  }

  return Object.keys(data).length > 0 ? data : undefined;
}

export type WompiTransaction = {
  id: string;
  status: WompiTransactionStatus | string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string | null;
  payment_method?: Record<string, unknown> | null;
  status_message?: string | null;
  payment_link_id?: string | null;
  customer_email?: string | null;
  created_at?: string | null;
  finalized_at?: string | null;
};

export type WompiSignatureBlock = {
  properties: string[];
  checksum: string;
};

export type WompiWebhookPayload = {
  event: string;
  data: {
    transaction?: WompiTransaction;
  };
  sent_at?: string;
  timestamp: number;
  signature: WompiSignatureBlock;
  environment?: string;
};

/** Resultado del callback `checkout.open((result) => ...)`. */
export type WompiWidgetCheckoutResult = {
  transaction: {
    id: string;
    status: string;
    reference?: string;
    amountInCents?: number;
    currency?: string;
  };
};

declare global {
  interface Window {
    WidgetCheckout?: new (params: WidgetCheckoutParams) => {
      open: (cb: (result: WompiWidgetCheckoutResult) => void) => void;
    };
  }
}

export {};
