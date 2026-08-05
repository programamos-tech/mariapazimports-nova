import {
  storeBrand,
  storeSupportEmail,
  storeSupportPhone,
  storeTagline,
} from "@/lib/brand";
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
  customerPhone?: string | null;
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  paymentMethod: "bank_transfer" | "wompi" | string;
  lines: OrderReceivedEmailLine[];
  trackingToken?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
};

function siteBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) return base;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    "",
  );
  if (vercelHost) return `https://${vercelHost}`;
  return "";
}

function paymentLabel(method: string) {
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "wompi") return "Pago en línea (Wompi)";
  return method;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBodies(
  payload: OrderReceivedEmailPayload,
  opts?: { includeAdminLink?: boolean },
) {
  const orderRef = ventaNumeroReferencia(payload.orderId);
  const base = siteBaseUrl();
  const logoUrl = base
    ? `${base}/logo-maria-paz-imports-sm.png`
    : "";
  const shopUrl = base || "#";
  const trackingUrl =
    payload.trackingToken && base
      ? `${base}/pedidos/seguimiento/${encodeURIComponent(payload.trackingToken)}`
      : null;
  const adminUrl =
    opts?.includeAdminLink && base
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

  const isBankTransfer = payload.paymentMethod === "bank_transfer";
  const paymentHint = isBankTransfer
    ? "Estamos validando tu pago. Una vez lo confirmemos, procedemos al despacho."
    : "Si elegiste pago en línea, completá el pago en la ventana de Wompi (o desde el enlace que te mostramos al finalizar).";

  const statusLine = isBankTransfer
    ? "Estado: Estamos validando tu pago"
    : null;

  const text = [
    `Hola ${payload.customerName.trim() || "hola"},`,
    "",
    `Recibimos tu pedido #${orderRef} en ${storeBrand}.`,
    statusLine,
    "",
    "Resumen:",
    ...itemLines,
    "",
    `Subtotal: ${formatCop(subtotal)}`,
    `Envío: ${shipping > 0 ? formatCop(shipping) : "Incluido"}`,
    `Total: ${formatCop(payload.totalCents)}`,
    `Pago: ${paymentLabel(payload.paymentMethod)}`,
    "",
    paymentHint,
    trackingUrl ? `Seguimiento: ${trackingUrl}` : null,
    "",
    "Gracias por confiar en nosotros.",
    "",
    storeEmailFooterText(),
  ]
    .filter((x) => x != null)
    .join("\n");

  const itemRows = payload.lines
    .map((l) => {
      const variant = l.variantLabel?.trim();
      const label = variant ? `${l.name} (${variant})` : l.name;
      const lineTotal = l.unitPriceCents * l.quantity;
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#292524;vertical-align:top">
            ${escapeHtml(label)}
            <div style="margin-top:4px;font-size:12px;color:#78716c">Cant. ${l.quantity}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#1c1917;text-align:right;white-space:nowrap;vertical-align:top;font-weight:600">
            ${escapeHtml(formatCop(lineTotal))}
          </td>
        </tr>`;
    })
    .join("");

  const logoBlock = logoUrl
    ? `<a href="${escapeHtml(shopUrl)}" style="text-decoration:none">
        <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(storeBrand)}" width="180" height="57" style="display:block;margin:0 auto;width:180px;height:auto;border:0;outline:none" />
      </a>`
    : `<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1c1917">${escapeHtml(storeBrand)}</p>`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(storeBrand)} · Pedido #${escapeHtml(orderRef)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Georgia,'Times New Roman',serif;color:#1c1917">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    Pedido #${escapeHtml(orderRef)} · Total ${escapeHtml(formatCop(payload.totalCents))}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e7e5e4">
          <tr>
            <td style="padding:28px 28px 20px;text-align:center;border-bottom:1px solid #e7e5e4;background:#fafaf9">
              ${logoBlock}
              <p style="margin:12px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c">
                ${escapeHtml(storeTagline)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#78716c">Confirmación de pedido</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:0.02em;color:#1c1917">Pedido recibido</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#44403c">
                Hola <strong>${escapeHtml(payload.customerName.trim() || "hola")}</strong>,
                registramos tu pedido
                <strong style="letter-spacing:0.04em">#${escapeHtml(orderRef)}</strong>.
              </p>

              ${
                isBankTransfer
                  ? `<p style="margin:0 0 20px;padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;font-size:13px;line-height:1.45;color:#92400e">
                      <strong>Estado:</strong> Estamos validando tu pago. Una vez lo confirmemos, procedemos al despacho.
                    </p>`
                  : ""
              }

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#fafaf9;border:1px solid #e7e5e4">
                <tr>
                  <td style="padding:14px 16px;font-size:12px;color:#78716c;width:50%">
                    N.º de pedido<br />
                    <strong style="display:inline-block;margin-top:4px;font-size:15px;color:#1c1917;letter-spacing:0.06em">#${escapeHtml(orderRef)}</strong>
                  </td>
                  <td style="padding:14px 16px;font-size:12px;color:#78716c;width:50%;text-align:right;border-left:1px solid #e7e5e4">
                    Total<br />
                    <strong style="display:inline-block;margin-top:4px;font-size:18px;color:#1c1917">${escapeHtml(formatCop(payload.totalCents))}</strong>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c">Detalle</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">
                ${itemRows}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 24px;font-size:14px">
                <tr>
                  <td style="padding:6px 0;color:#78716c">Subtotal</td>
                  <td style="padding:6px 0;text-align:right;color:#292524">${escapeHtml(formatCop(subtotal))}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78716c">Envío</td>
                  <td style="padding:6px 0;text-align:right;color:#292524">${escapeHtml(shipping > 0 ? formatCop(shipping) : "Incluido")}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78716c">Pago</td>
                  <td style="padding:6px 0;text-align:right;color:#292524">${escapeHtml(paymentLabel(payload.paymentMethod))}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;border-top:1px solid #1c1917;font-weight:700;font-size:15px">Total</td>
                  <td style="padding:12px 0 0;border-top:1px solid #1c1917;text-align:right;font-weight:700;font-size:15px">${escapeHtml(formatCop(payload.totalCents))}</td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#57534e">${escapeHtml(paymentHint)}</p>

              ${
                trackingUrl
                  ? `<p style="margin:0 0 8px;text-align:center">
                      <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:14px 22px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">Ver seguimiento del pedido</a>
                    </p>`
                  : ""
              }
              ${
                base
                  ? `<p style="margin:12px 0 0;text-align:center">
                      <a href="${escapeHtml(shopUrl)}" style="font-size:12px;color:#78716c;text-decoration:underline">Ir a la tienda</a>
                    </p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;border-top:1px solid #e7e5e4;background:#fafaf9;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#1c1917">${escapeHtml(storeBrand)}</p>
              ${
                storeSupportPhone
                  ? `<p style="margin:0 0 2px;font-size:12px;color:#78716c">${escapeHtml(storeSupportPhone)}</p>`
                  : ""
              }
              ${
                storeSupportEmail
                  ? `<p style="margin:0;font-size:12px;color:#78716c"><a href="mailto:${escapeHtml(storeSupportEmail)}" style="color:#78716c;text-decoration:none">${escapeHtml(storeSupportEmail)}</a></p>`
                  : ""
              }
              ${
                adminUrl
                  ? `<p style="margin:16px 0 0;font-size:11px;color:#a8a29e">Copia tienda · <a href="${escapeHtml(adminUrl)}" style="color:#78716c">Abrir en el panel</a></p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return {
    subject: isBankTransfer
      ? `${storeBrand} · Pedido #${orderRef} · Pendiente de aprobación`
      : `${storeBrand} · Pedido #${orderRef} recibido`,
    text,
    html,
    orderRef,
  };
}

/** Aviso interno de venta para la tienda (resumen + dirección + link admin). */
function buildStoreSaleNotifyBodies(payload: OrderReceivedEmailPayload) {
  const orderRef = ventaNumeroReferencia(payload.orderId);
  const base = siteBaseUrl();
  const adminUrl = base ? `${base}/admin/orders/${payload.orderId}` : null;
  const isBankTransfer = payload.paymentMethod === "bank_transfer";

  const subtotal =
    payload.subtotalCents ??
    payload.lines.reduce(
      (acc, l) => acc + l.unitPriceCents * l.quantity,
      0,
    );
  const shipping =
    payload.shippingCents ?? Math.max(0, payload.totalCents - subtotal);

  const itemLines = payload.lines.map((l) => {
    const variant = l.variantLabel?.trim();
    const label = variant ? `${l.name} (${variant})` : l.name;
    return `• ${label} × ${l.quantity} — ${formatCop(l.unitPriceCents * l.quantity)}`;
  });

  const addressParts = [
    payload.shippingAddress?.trim(),
    payload.shippingCity?.trim(),
    payload.shippingPostalCode?.trim()
      ? `CP ${payload.shippingPostalCode.trim()}`
      : null,
  ].filter(Boolean);
  const addressBlock =
    addressParts.length > 0 ? addressParts.join(", ") : "Sin dirección";

  const phone = payload.customerPhone?.trim() || "—";
  const email = payload.customerEmail.trim() || "—";
  const name = payload.customerName.trim() || "Cliente";

  const statusNote = isBankTransfer
    ? "Pago por comprobante — pendiente de validación en el panel."
    : "Pago en línea (Wompi) confirmado.";

  const text = [
    `Nueva venta · Pedido #${orderRef}`,
    statusNote,
    "",
    `Cliente: ${name}`,
    `Email: ${email}`,
    `Teléfono: ${phone}`,
    `Dirección: ${addressBlock}`,
    "",
    "Resumen:",
    ...itemLines,
    "",
    `Subtotal: ${formatCop(subtotal)}`,
    `Envío: ${shipping > 0 ? formatCop(shipping) : "Incluido"}`,
    `Total venta: ${formatCop(payload.totalCents)}`,
    `Método: ${paymentLabel(payload.paymentMethod)}`,
    adminUrl ? `\nVer en el panel: ${adminUrl}` : null,
  ]
    .filter((x) => x != null)
    .join("\n");

  const itemRows = payload.lines
    .map((l) => {
      const variant = l.variantLabel?.trim();
      const label = variant ? `${l.name} (${variant})` : l.name;
      const lineTotal = l.unitPriceCents * l.quantity;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;color:#292524">${escapeHtml(label)} <span style="color:#78716c">× ${l.quantity}</span></td>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5e4;font-size:14px;text-align:right;font-weight:600">${escapeHtml(formatCop(lineTotal))}</td>
        </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>Nueva venta #${escapeHtml(orderRef)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e7e5e4">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e7e5e4;background:#1c1917;color:#ffffff">
            <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.75">Aviso de venta</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700">Pedido #${escapeHtml(orderRef)}</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.9">${escapeHtml(statusNote)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Cliente</p>
            <p style="margin:0 0 4px;font-size:15px;font-weight:600">${escapeHtml(name)}</p>
            <p style="margin:0 0 2px;font-size:13px;color:#57534e">${escapeHtml(email)}</p>
            <p style="margin:0 0 16px;font-size:13px;color:#57534e">${escapeHtml(phone)}</p>

            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Dirección de envío</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#292524">${escapeHtml(addressBlock)}</p>

            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Resumen</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px">
              <tr>
                <td style="padding:6px 0;color:#78716c">Subtotal</td>
                <td style="padding:6px 0;text-align:right">${escapeHtml(formatCop(subtotal))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#78716c">Envío</td>
                <td style="padding:6px 0;text-align:right">${escapeHtml(shipping > 0 ? formatCop(shipping) : "Incluido")}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#78716c">Pago</td>
                <td style="padding:6px 0;text-align:right">${escapeHtml(paymentLabel(payload.paymentMethod))}</td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;border-top:1px solid #1c1917;font-weight:700;font-size:16px">Total venta</td>
                <td style="padding:12px 0 0;border-top:1px solid #1c1917;text-align:right;font-weight:700;font-size:16px">${escapeHtml(formatCop(payload.totalCents))}</td>
              </tr>
            </table>

            ${
              adminUrl
                ? `<p style="margin:24px 0 0;text-align:center">
                    <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:14px 22px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600">${isBankTransfer ? "Verificar venta en el panel" : "Abrir pedido en el panel"}</a>
                  </p>`
                : ""
            }
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  return {
    subject: isBankTransfer
      ? `[Venta · Comprobante] ${storeBrand} · #${orderRef} · ${formatCop(payload.totalCents)}`
      : `[Nueva venta] ${storeBrand} · #${orderRef} · ${formatCop(payload.totalCents)}`,
    text,
    html,
    orderRef,
  };
}

/**
 * Correo al comprador + aviso de venta a la tienda (en paralelo).
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

  const customerEmail = payload.customerEmail.trim().toLowerCase();
  const copyTo = orderNotifyCopyTo()?.trim().toLowerCase() || "";
  const hasCustomer = Boolean(customerEmail && customerEmail.includes("@"));

  const jobs: Promise<unknown>[] = [];

  if (hasCustomer) {
    const { subject, text, html } = buildBodies(payload);
    jobs.push(
      sendStoreEmail({
        to: customerEmail,
        subject,
        text,
        html,
      }),
    );
  }

  if (copyTo) {
    const { subject, text, html } = buildStoreSaleNotifyBodies(payload);
    jobs.push(
      sendStoreEmail({
        to: copyTo,
        subject,
        text,
        html,
      }),
    );
  } else {
    console.warn(
      "[order-email] Sin ORDER_NOTIFY_TO / NEXT_PUBLIC_STORE_EMAIL: no se avisó a la tienda",
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[order-email] envío falló", r.reason);
    }
  }
}

/**
 * Carga el pedido + ítems y envía la confirmación (p. ej. tras APPROVED de Wompi).
 */
export async function sendOrderReceivedEmailsForOrderId(
  orderId: string,
): Promise<void> {
  if (!orderId.trim() || !isStoreEmailConfigured()) return;

  const { createSupabaseServiceClient } = await import(
    "@/lib/supabase/service"
  );
  const sb = createSupabaseServiceClient();

  const { data: order, error } = await sb
    .from("orders")
    .select(
      "id, customer_name, customer_email, total_cents, subtotal_cents, shipping_cents, payment_method, tracking_token, shipping_address, shipping_city, shipping_postal_code, shipping_phone",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[order-email] pedido no encontrado", orderId, error?.message);
    return;
  }

  const { data: items } = await sb
    .from("order_items")
    .select(
      "product_name_snapshot, quantity, unit_price_cents, variant_label_snapshot",
    )
    .eq("order_id", orderId);

  await sendOrderReceivedEmails({
    orderId: order.id,
    customerName: String(order.customer_name ?? ""),
    customerEmail: String(order.customer_email ?? ""),
    customerPhone:
      order.shipping_phone != null ? String(order.shipping_phone) : null,
    totalCents: Number(order.total_cents) || 0,
    subtotalCents:
      order.subtotal_cents != null ? Number(order.subtotal_cents) : undefined,
    shippingCents:
      order.shipping_cents != null ? Number(order.shipping_cents) : undefined,
    paymentMethod: String(order.payment_method ?? "wompi"),
    trackingToken:
      order.tracking_token != null ? String(order.tracking_token) : null,
    shippingAddress:
      order.shipping_address != null ? String(order.shipping_address) : null,
    shippingCity:
      order.shipping_city != null ? String(order.shipping_city) : null,
    shippingPostalCode:
      order.shipping_postal_code != null
        ? String(order.shipping_postal_code)
        : null,
    lines: (items ?? []).map((l) => ({
      name: String(l.product_name_snapshot ?? "Producto"),
      quantity: Number(l.quantity) || 0,
      unitPriceCents: Number(l.unit_price_cents) || 0,
      variantLabel:
        l.variant_label_snapshot != null
          ? String(l.variant_label_snapshot)
          : null,
    })),
  });
}
