import { storeBrand } from "@/lib/brand";
import { formatCop } from "@/lib/money";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import {
  isStoreEmailConfigured,
  orderNotifyCopyTo,
  sendStoreEmail,
  storeEmailFooterText,
} from "@/lib/store-email";

export type OrderReceivedEmailLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  variantLabel?: string | null;
};

export type OrderReceivedEmailPayload = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  paymentMethod: "bank_transfer" | "wompi" | string;
  lines: OrderReceivedEmailLine[];
  trackingToken?: string | null;
};

function siteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    ""
  );
}

function paymentLabel(method: string) {
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "wompi") return "Pago en línea (Wompi)";
  return method;
}

function buildBodies(payload: OrderReceivedEmailPayload) {
  const orderRef = ventaNumeroReferencia(payload.orderId);
  const base = siteBaseUrl();
  const trackingUrl =
    payload.trackingToken && base
      ? `${base}/pedidos/seguimiento/${encodeURIComponent(payload.trackingToken)}`
      : null;
  const adminUrl = base
    ? `${base}/admin/orders/${payload.orderId}`
    : null;

  const itemLines = payload.lines.map((l) => {
    const variant = l.variantLabel?.trim();
    const label = variant ? `${l.name} (${variant})` : l.name;
    const lineTotal = l.unitPriceCents * l.quantity;
    return `• ${label} × ${l.quantity} — ${formatCop(lineTotal)}`;
  });

  const subtotal =
    payload.subtotalCents ??
    payload.lines.reduce(
      (acc, l) => acc + l.unitPriceCents * l.quantity,
      0,
    );
  const shipping =
    payload.shippingCents ?? Math.max(0, payload.totalCents - subtotal);

  const text = [
    `Hola ${payload.customerName.trim() || "hola"},`,
    "",
    `Recibimos tu pedido #${orderRef} en ${storeBrand}.`,
    "",
    "Resumen:",
    ...itemLines,
    "",
    `Subtotal: ${formatCop(subtotal)}`,
    `Envío: ${shipping > 0 ? formatCop(shipping) : "Incluido"}`,
    `Total: ${formatCop(payload.totalCents)}`,
    `Pago: ${paymentLabel(payload.paymentMethod)}`,
    "",
    payload.paymentMethod === "bank_transfer"
      ? "Si elegiste transferencia, subí el comprobante desde el enlace de seguimiento cuando lo tengas."
      : "Si elegiste pago en línea, completá el pago en la ventana de Wompi (o desde el enlace que te mostramos al finalizar).",
    trackingUrl ? `Seguimiento: ${trackingUrl}` : null,
    "",
    "Gracias por confiar en nosotros.",
    "",
    storeEmailFooterText(),
  ]
    .filter((x) => x != null)
    .join("\n");

  const itemsHtml = payload.lines
    .map((l) => {
      const variant = l.variantLabel?.trim();
      const label = variant ? `${l.name} (${variant})` : l.name;
      const lineTotal = l.unitPriceCents * l.quantity;
      return `<li style="margin:0 0 6px">${escapeHtml(label)} × ${l.quantity} — <strong>${escapeHtml(formatCop(lineTotal))}</strong></li>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f5f4;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e7e5e4;padding:28px 24px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#78716c">${escapeHtml(storeBrand)}</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase">Pedido recibido</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#44403c">
      Hola <strong>${escapeHtml(payload.customerName.trim() || "hola")}</strong>,
      recibimos tu pedido <strong>#${escapeHtml(orderRef)}</strong>.
    </p>
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c">Resumen</p>
    <ul style="margin:0 0 16px;padding-left:18px;font-size:14px;color:#292524">${itemsHtml}</ul>
    <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="padding:4px 0;color:#78716c">Subtotal</td><td style="padding:4px 0;text-align:right">${escapeHtml(formatCop(subtotal))}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c">Envío</td><td style="padding:4px 0;text-align:right">${escapeHtml(shipping > 0 ? formatCop(shipping) : "Incluido")}</td></tr>
      <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid #e7e5e4">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:700;border-top:1px solid #e7e5e4">${escapeHtml(formatCop(payload.totalCents))}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c">Pago</td><td style="padding:4px 0;text-align:right">${escapeHtml(paymentLabel(payload.paymentMethod))}</td></tr>
    </table>
    ${
      trackingUrl
        ? `<p style="margin:0 0 16px"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 18px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600">Ver seguimiento</a></p>`
        : ""
    }
    <p style="margin:0;font-size:12px;line-height:1.5;color:#78716c;white-space:pre-line">${escapeHtml(storeEmailFooterText())}</p>
    ${
      adminUrl
        ? `<p style="margin:16px 0 0;font-size:11px;color:#a8a29e">Copia tienda · <a href="${escapeHtml(adminUrl)}" style="color:#78716c">Abrir en el panel</a></p>`
        : ""
    }
  </div>
</body>
</html>`.trim();

  return {
    subject: `${storeBrand} · Pedido #${orderRef} recibido`,
    text,
    html,
    orderRef,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Correo al comprador + BCC a la tienda (copia).
 * Si no hay email del cliente, solo avisa a la tienda.
 */
export async function sendOrderReceivedEmails(
  payload: OrderReceivedEmailPayload,
): Promise<void> {
  if (!isStoreEmailConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[order-email] Omitido: configurá GMAIL_USER y GMAIL_APP_PASSWORD",
      );
    }
    return;
  }

  const { subject, text, html, orderRef } = buildBodies(payload);
  const copyTo = orderNotifyCopyTo();
  const customerEmail = payload.customerEmail.trim().toLowerCase();

  if (customerEmail && customerEmail.includes("@")) {
    await sendStoreEmail({
      to: customerEmail,
      bcc: copyTo && copyTo.toLowerCase() !== customerEmail ? copyTo : undefined,
      subject,
      text,
      html,
    });
    return;
  }

  // Sin email del cliente: aviso solo a la tienda
  if (copyTo) {
    await sendStoreEmail({
      to: copyTo,
      subject: `[Sin email cliente] ${storeBrand} · Pedido #${orderRef}`,
      text: `El pedido #${orderRef} se creó sin email de cliente.\n\n${text}`,
      html,
    });
  }
}
