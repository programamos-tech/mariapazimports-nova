-- Transferencia bancaria en checkout + comprobante + seguimiento de pedido

do $$ begin
  create type public.order_fulfillment_status as enum (
    'awaiting_payment',
    'payment_submitted',
    'accepted',
    'preparing',
    'shipped',
    'delivered',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists fulfillment_status public.order_fulfillment_status,
  add column if not exists tracking_token text,
  add column if not exists payment_method text;

create unique index if not exists orders_tracking_token_key
  on public.orders (tracking_token)
  where tracking_token is not null;

comment on column public.orders.payment_method is 'wompi | bank_transfer';
comment on column public.orders.tracking_token is 'Token secreto para /pedidos/seguimiento/[token]';
comment on column public.orders.fulfillment_status is 'Estado logístico del pedido (independiente del cobro)';

update public.orders
set fulfillment_status = case
  when status = 'paid' then 'accepted'::public.order_fulfillment_status
  when status = 'cancelled' then 'cancelled'::public.order_fulfillment_status
  else 'awaiting_payment'::public.order_fulfillment_status
end
where fulfillment_status is null;

update public.orders
set payment_method = case
  when wompi_reference like 'ONLINE:transfer' then 'bank_transfer'
  when wompi_reference like 'POS:%' then null
  when wompi_payment_link_id is not null or wompi_reference is not null then 'wompi'
  else 'wompi'
end
where payment_method is null;

create table if not exists public.order_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

create index if not exists order_payment_proofs_order_id_idx
  on public.order_payment_proofs (order_id);

alter table public.order_payment_proofs enable row level security;

drop policy if exists "order_payment_proofs_select_admin" on public.order_payment_proofs;
create policy "order_payment_proofs_select_admin"
on public.order_payment_proofs for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "order_payment_proofs_delete_admin" on public.order_payment_proofs;
create policy "order_payment_proofs_delete_admin"
on public.order_payment_proofs for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- Inserciones vía service role (checkout / acción pública con token)

insert into storage.buckets (id, name, public)
values ('order-payment-proofs', 'order-payment-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "order_payment_proofs_admin_read" on storage.objects;
create policy "order_payment_proofs_admin_read"
on storage.objects for select to authenticated
using (
  bucket_id = 'order-payment-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid())
);

drop policy if exists "order_payment_proofs_admin_delete" on storage.objects;
create policy "order_payment_proofs_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'order-payment-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid())
);
