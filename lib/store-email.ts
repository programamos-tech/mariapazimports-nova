import nodemailer from "nodemailer";
import { storeBrand, storeSupportEmail, storeSupportPhone } from "@/lib/brand";

/** Remitente Gmail (SMTP). Vacío = emails desactivados. */
function gmailUser() {
  return (
    process.env.GMAIL_USER?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""
  );
}

function gmailAppPassword() {
  return (
    process.env.GMAIL_APP_PASSWORD?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    ""
  );
}

/** Destino de la copia interna (vos). Por defecto el email público de la tienda. */
export function orderNotifyCopyTo() {
  return (
    process.env.ORDER_NOTIFY_TO?.trim() ||
    process.env.NEXT_PUBLIC_STORE_EMAIL?.trim() ||
    storeSupportEmail
  );
}

export function isStoreEmailConfigured() {
  return Boolean(gmailUser() && gmailAppPassword());
}

function createTransport() {
  const user = gmailUser();
  const pass = gmailAppPassword();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export type SendStoreEmailParams = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  /** Copia oculta (p. ej. la tienda). */
  bcc?: string | string[];
  replyTo?: string;
};

/** Envía un correo por Gmail SMTP. No lanza: falla → log. */
export async function sendStoreEmail(
  params: SendStoreEmailParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const transport = createTransport();
  if (!transport) {
    return { ok: false, error: "email_not_configured" };
  }

  const fromUser = gmailUser();
  const from = `${storeBrand} <${fromUser}>`;
  const replyTo =
    params.replyTo?.trim() || orderNotifyCopyTo() || storeSupportEmail;

  try {
    await transport.sendMail({
      from,
      to: params.to,
      bcc: params.bcc,
      replyTo,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendStoreEmail]", msg);
    return { ok: false, error: msg };
  }
}

export function storeEmailFooterText() {
  return [
    storeBrand,
    storeSupportPhone ? `WhatsApp / tel: ${storeSupportPhone}` : null,
    storeSupportEmail ? `Email: ${storeSupportEmail}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
