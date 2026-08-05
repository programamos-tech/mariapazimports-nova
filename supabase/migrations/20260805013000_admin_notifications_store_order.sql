-- Amplía kinds de notificaciones del panel: nuevo pedido tienda.
alter table public.admin_notifications
  drop constraint if exists admin_notifications_kind_check;

alter table public.admin_notifications
  add constraint admin_notifications_kind_check
  check (kind in ('store_customer_registered', 'store_order_created'));
