# Pagos Wompi (Widget Checkout SDK)

Integración reutilizable: Widget in-site + webhook firmado + ledger `payments`.

## Arquitectura

```
Checkout UI → createWompiCheckoutSession (pedido + payment PENDING)
           → WidgetCheckout.open() (firma integrity)
           → usuario paga
Webhook X-Event-Checksum → PaymentService.applyProviderTransaction
                        → RPC apply_wompi_payment_transition
                        → orders.status=paid + stock
Return page → lee payments (no confía en ?widget=)
```

Fuente de verdad del cobro: tabla `payments` + webhook. El redirect del navegador solo muestra estado.

## Convención de montos (crítica)

En este proyecto `orders.total_cents` guarda **pesos enteros** (289900 = $289.900).

Wompi exige `amount_in_cents` = pesos × 100 → `28990000`.

Ver `lib/payments/amount.ts` (`domainAmountToWompiCents`).

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Widget (cliente) |
| `WOMPI_INTEGRITY_SECRET` | Firma SHA256 del Widget |
| `WOMPI_EVENTS_SECRET` | Checksum webhooks (`X-Event-Checksum`) |
| `WOMPI_PRIVATE_KEY` | API reconcile / Payment Links legacy |
| `WOMPI_ENV` | `sandbox` \| `production` |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_BASE_URL` | `redirectUrl` del widget |

**No mezclar** integrity y events secret.

Webhook en dashboard Wompi: `{SITE_URL}/api/webhooks/wompi`

## Flujo usuario

1. Elige “Pago en línea (Wompi)” y finaliza compra.
2. Server action crea `orders` (pending) + `payments` (PENDING) con monto ×100.
3. Se abre el Widget en la misma página.
4. Tras el widget, redirect a `/checkout/return?order_id=&reference=`.
5. La página hace poll a `/api/payments/wompi/status` hasta APPROVED/DECLINED.

## Flujo webhook

1. Wompi POST con body + `X-Event-Checksum`.
2. `verifyEventChecksum` (properties + timestamp + events secret, anti-replay ~10 min).
3. Insert idempotente en `payment_events` (unique checksum).
4. Valida monto/moneda vs `payments`.
5. RPC actualiza payment + order; TS descuenta stock si APPROVED nuevo.

## Instalación / configuración

1. Copiar vars de `.env.example`.
2. Aplicar migración `supabase/migrations/20260718160000_payments_wompi_sdk.sql`.
3. En Wompi: activar Events, pegar URL del webhook, copiar events secret.
4. Copiar public key + integrity secret del comercio.
5. Redeploy si cambias `NEXT_PUBLIC_*`.

## Reutilizar en otro proyecto

Copiar:

- `config/payments.ts`
- `types/payment.ts`, `types/wompi.ts`
- `lib/payments/*`
- `services/payment.service.ts`
- `components/payments/*`
- migración SQL (adaptar `order_id` / RLS)

Punto de extensión de monto: `domainAmountToWompiCents` si tu dominio ya guarda centavos reales.

Metadatos de negocio: columna `payments.metadata` (jsonb) o columnas nullable (`reserva_id`, etc.).

## Sandbox vs producción

- `WOMPI_ENV=sandbox` + llaves `*_test_*`
- Producción: `WOMPI_ENV=production` + llaves `*_prod_*` + webhook HTTPS público

## Errores comunes

| Síntoma | Causa |
|---------|--------|
| Widget “firma inválida” | Integrity secret incorrecto o amount sin ×100 |
| Webhook 401 | Events secret incorrecto / sin timestamp |
| Pedido forever pending | Webhook no llega (URL, secret, firewall) |
| Undercharge ×100 | Pasar pesos como `amount_in_cents` sin multiplicar |

## Checklist pre-producción

- [ ] Public + integrity + events + private keys en Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` = dominio real
- [ ] Webhook Events apuntando a `/api/webhooks/wompi`
- [ ] Migración `payments` aplicada
- [ ] Pago sandbox APPROVED → `orders.status=paid` + stock
- [ ] Transferencia bancaria sigue funcionando
- [ ] POS/admin intactos

## API rápida

- Server action: `createWompiCheckoutSession(formData)`
- Webhook: `POST /api/webhooks/wompi`
- Status: `GET /api/payments/wompi/status?reference=&transactionId=`
- UI: `WompiCheckout` / `openWompiWidgetCheckout`
