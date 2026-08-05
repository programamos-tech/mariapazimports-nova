import {
  storeBrand,
  storeSupportEmail,
  storeSupportPhone,
  storeTagline,
  storeWelcomeDiscountCode,
  storeWelcomeDiscountMessage,
} from "@/lib/brand";
import {
  isStoreEmailConfigured,
  sendStoreEmail,
  storeEmailFooterText,
} from "@/lib/store-email";

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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Correo de bienvenida al registrarse en la tienda.
 * No lanza: si falla SMTP solo loguea.
 */
export async function sendWelcomeEmail(input: {
  name: string;
  email: string;
}): Promise<void> {
  if (!isStoreEmailConfigured()) return;

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return;

  const name = input.name.trim() || "hola";
  const firstName = name.split(/\s+/)[0] || name;
  const base = siteBaseUrl();
  const logoUrl = base ? `${base}/logo-maria-paz-imports-sm.png` : "";
  const shopUrl = base || "#";
  const accountUrl = base ? `${base}/cuenta` : shopUrl;
  const productsUrl = base ? `${base}/products` : shopUrl;
  const code = storeWelcomeDiscountCode.trim();
  const welcomeMsg = storeWelcomeDiscountMessage.trim();

  const text = [
    `Hola ${firstName},`,
    "",
    `¡Bienvenida a ${storeBrand}!`,
    "",
    "Tu cuenta ya está lista. Desde ahí podés seguir tus pedidos, guardar direcciones y comprar más rápido.",
    welcomeMsg ? `\n${welcomeMsg}` : null,
    code ? `Tu código: ${code}` : null,
    "",
    productsUrl !== "#" ? `Explorar la tienda: ${productsUrl}` : null,
    accountUrl !== "#" ? `Mi cuenta: ${accountUrl}` : null,
    "",
    "Gracias por sumarte.",
    "",
    storeEmailFooterText(),
  ]
    .filter((x) => x != null)
    .join("\n");

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
  <title>Bienvenida · ${escapeHtml(storeBrand)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Georgia,'Times New Roman',serif;color:#1c1917">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    ¡Bienvenida a ${escapeHtml(storeBrand)}! Tu cuenta ya está lista.
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
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#78716c">Bienvenida</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:0.02em;color:#1c1917">¡Qué bueno tenerte!</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#44403c">
                Hola <strong>${escapeHtml(firstName)}</strong>,
                tu cuenta en <strong>${escapeHtml(storeBrand)}</strong> ya está lista.
                Desde ahí podés seguir pedidos, guardar direcciones y comprar más fácil.
              </p>

              ${
                code
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#fffbeb;border:1px solid #fde68a">
                      <tr>
                        <td style="padding:16px 18px;text-align:center">
                          <p style="margin:0 0 6px;font-size:12px;color:#92400e">${escapeHtml(welcomeMsg || "Beneficio de bienvenida")}</p>
                          <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.12em;color:#1c1917">${escapeHtml(code)}</p>
                        </td>
                      </tr>
                    </table>`
                  : ""
              }

              <p style="margin:0 0 8px;text-align:center">
                <a href="${escapeHtml(productsUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:14px 22px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600">Explorar la tienda</a>
              </p>
              <p style="margin:12px 0 0;text-align:center">
                <a href="${escapeHtml(accountUrl)}" style="font-size:12px;color:#78716c;text-decoration:underline">Ir a mi cuenta</a>
              </p>
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
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const result = await sendStoreEmail({
    to: email,
    subject: `¡Bienvenida a ${storeBrand}!`,
    text,
    html,
  });

  if (!result.ok) {
    console.error("[welcome-email]", result.error);
  }
}
