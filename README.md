# Tiendas (plantilla)

Plantilla para **tiendas virtuales** con **Next.js**, **Tailwind CSS**, **Supabase** (Postgres, Auth, Storage) y pagos **Wompi** (enlace de pago). Cada cliente = un fork + un proyecto Supabase + un despliegue (por ejemplo Vercel).

## Requisitos

- Node 20+
- Proyecto en [Supabase](https://supabase.com)
- Cuenta [Wompi](https://wompi.co) (sandbox o producción)

## Configuración rápida

1. Cloná o forkeá el repo para el cliente.
2. `cp .env.example .env.local` y completá variables (Supabase, `NEXT_PUBLIC_SITE_URL`, Wompi).
3. En Supabase → **SQL Editor**, ejecutá las migraciones en orden (o `supabase db push`): [`20260505190000_init.sql`](supabase/migrations/20260505190000_init.sql), luego envíos, categorías y **stock bodega/local** ([`20260508130000_product_stock_split.sql`](supabase/migrations/20260508130000_product_stock_split.sql)) para inventario en dos ubicaciones.
4. **Auth**: en Supabase → **Authentication → Users** creá un usuario (email y contraseña que vos elijas). **No hay usuario precargado** en la plantilla.
5. **Admin**: copiá el **UUID** de ese usuario (columna *User UID*) y en **SQL Editor** enlazalo al panel:

   ```sql
   insert into public.profiles (id, role)
   values ('UUID_DEL_USUARIO_AUTH', 'admin');
   ```

   Iniciá sesión en `/admin/login` con el **mismo email y contraseña** que definiste en el paso 4.

6. **Wompi**: en el dashboard de Wompi configurá la URL de eventos (webhook) apuntando a:

   `https://TU_DOMINIO/api/webhooks/wompi`

7. `npm install` y `npm run dev`.

## Flujo

- **Tienda**: `/`, `/products`, carrito en cookie, `/checkout` crea el pedido y redirige al **link de pago** Wompi.
- **Retorno**: `/checkout/return?order_id=...` muestra el estado (el definitivo llega por webhook).
- **Admin**: `/admin` (Supabase Auth + fila en `profiles`).

## Checklist por nuevo cliente

- [ ] Nuevo proyecto Supabase + migración aplicada.
- [ ] Bucket `product-images` creado por la migración; revisá políticas si algo falla.
- [ ] Usuario admin + `profiles`.
- [ ] Variables en Vercel (o hosting): Supabase, `NEXT_PUBLIC_SITE_URL`, claves Wompi.
- [ ] Webhook Wompi a `/api/webhooks/wompi`.
- [ ] `NEXT_PUBLIC_STORE_NAME` y tema (Tailwind / `globals.css`).

## Notas

- El campo `price_cents` en base de datos guarda **pesos COP enteros** (sin decimales).
- Si la verificación de firma del webhook falla, dejá `WOMPI_INTEGRITY_SECRET` vacío en desarrollo o ajustá la lógica según la documentación actual de Wompi.
- La página de retorno del checkout usa la **service role** en servidor solo para leer el pedido por `order_id`; en un hardening futuro podrías firmar un token o usar sesión de comprador.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — producción
- `npm run lint` — ESLint
