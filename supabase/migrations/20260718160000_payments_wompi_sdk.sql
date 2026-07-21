-- SDK de pagos Wompi: payments + payment_events (idempotencia) + RPC de transición.

do $$ begin
  create type public.payment_status as enum (
    'PENDING',
    'APPROVED',
    'DECLINED',
    'VOIDED',
    'ERROR',
    'FAILED'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- payments
-- Campos fijos del SDK. Comentarios marcan extensiones por dominio.
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  -- Este proyecto: FK a orders.
  -- En otro proyecto podrían usarse: reserva_id, gimnasio_id, subscription_id, invoice_id
  -- (columnas nullable adicionales) o solo metadata jsonb.
  order_id uuid references public.orders(id) on delete set null,

  provider text not null default 'wompi'
    check (provider in ('wompi', 'bank_transfer')),
  provider_transaction_id text,
  provider_link_id text,
  reference text not null,
  -- Centavos Wompi (COP × 100). No confundir con orders.total_cents (pesos enteros).
  amount_in_cents integer not null check (amount_in_cents > 0),
  currency text not null default 'COP',
  status public.payment_status not null default 'PENDING',
  payment_method_type text,
  status_message text,
  customer_email text not null,
  customer_name text not null,
  environment text not null default 'sandbox'
    check (environment in ('sandbox', 'production')),
  raw_response jsonb,
  -- Metadatos de negocio: productId, userId, reservaId, etc.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  failed_at timestamptz
);

create unique index if not exists payments_reference_key
  on public.payments (reference);

create unique index if not exists payments_provider_transaction_id_key
  on public.payments (provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists payments_order_id_idx
  on public.payments (order_id);

create index if not exists payments_status_idx
  on public.payments (status);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

comment on table public.payments is
  'Pagos del SDK Wompi/transfer. Copiar a otros proyectos; adaptar order_id / metadata.';
comment on column public.payments.order_id is
  'Dominio tiendas: pedido. Otros: reservaId/subscriptionId vía columna o metadata.';
comment on column public.payments.amount_in_cents is
  'Centavos Wompi (= pesos dominio × 100 en este proyecto).';
comment on column public.payments.metadata is
  'Campos de negocio variables: productId, userId, reservaId, gimnasioId, etc.';

-- ---------------------------------------------------------------------------
-- payment_events — ledger para idempotencia / auditoría
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null default 'wompi',
  event_id text,
  checksum text not null,
  event_type text,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists payment_events_checksum_key
  on public.payment_events (checksum);

create unique index if not exists payment_events_event_id_key
  on public.payment_events (event_id)
  where event_id is not null;

create index if not exists payment_events_payment_id_idx
  on public.payment_events (payment_id);

-- ---------------------------------------------------------------------------
-- RPC: transición atómica payment → order (stock lo aplica el servicio TS)
-- ---------------------------------------------------------------------------
create or replace function public.apply_wompi_payment_transition(
  p_payment_id uuid,
  p_new_status public.payment_status,
  p_provider_transaction_id text,
  p_payment_method_type text,
  p_status_message text,
  p_raw_response jsonb
)
returns table (
  applied boolean,
  previous_status public.payment_status,
  order_id uuid,
  stock_should_deduct boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_order_status text;
begin
  select * into v_pay
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return query select false, null::public.payment_status, null::uuid, false;
    return;
  end if;

  -- Idempotente: mismo estado final + misma txn
  if v_pay.status = p_new_status
     and v_pay.provider_transaction_id is not distinct from p_provider_transaction_id then
    return query select false, v_pay.status, v_pay.order_id, false;
    return;
  end if;

  -- Nunca degradar APPROVED
  if v_pay.status = 'APPROVED' and p_new_status is distinct from 'APPROVED' then
    return query select false, v_pay.status, v_pay.order_id, false;
    return;
  end if;

  update public.payments
  set
    status = p_new_status,
    provider_transaction_id = coalesce(p_provider_transaction_id, provider_transaction_id),
    payment_method_type = coalesce(p_payment_method_type, payment_method_type),
    status_message = coalesce(p_status_message, status_message),
    raw_response = coalesce(p_raw_response, raw_response),
    approved_at = case
      when p_new_status = 'APPROVED' then coalesce(approved_at, now())
      else approved_at
    end,
    failed_at = case
      when p_new_status in ('DECLINED', 'VOIDED', 'ERROR', 'FAILED')
        then coalesce(failed_at, now())
      else failed_at
    end,
    updated_at = now()
  where id = p_payment_id;

  if v_pay.order_id is not null then
    select o.status into v_order_status
    from public.orders o
    where o.id = v_pay.order_id
    for update;

    if p_new_status = 'APPROVED' and v_order_status is distinct from 'paid' then
      update public.orders
      set
        status = 'paid',
        wompi_transaction_id = coalesce(p_provider_transaction_id, wompi_transaction_id),
        wompi_reference = coalesce(v_pay.reference, wompi_reference),
        payment_method = 'wompi',
        updated_at = now()
      where id = v_pay.order_id;

      return query select true, v_pay.status, v_pay.order_id, true;
      return;
    elsif p_new_status in ('DECLINED', 'VOIDED', 'ERROR', 'FAILED')
          and v_order_status = 'pending' then
      update public.orders
      set
        status = 'failed',
        wompi_transaction_id = coalesce(p_provider_transaction_id, wompi_transaction_id),
        wompi_reference = coalesce(v_pay.reference, wompi_reference),
        updated_at = now()
      where id = v_pay.order_id;
    end if;
  end if;

  return query select true, v_pay.status, v_pay.order_id, false;
end;
$$;

revoke all on function public.apply_wompi_payment_transition(
  uuid, public.payment_status, text, text, text, jsonb
) from public;
grant execute on function public.apply_wompi_payment_transition(
  uuid, public.payment_status, text, text, text, jsonb
) to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "payments_select_admin" on public.payments;
create policy "payments_select_admin"
on public.payments for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "payments_select_store_owner" on public.payments;
create policy "payments_select_store_owner"
on public.payments for select to authenticated
using (
  order_id is not null
  and exists (
    select 1
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = payments.order_id
      and c.auth_user_id = auth.uid()
      and not exists (select 1 from public.profiles p where p.id = auth.uid())
  )
);

-- Escrituras solo service_role (bypass RLS). Sin policies de insert/update para authenticated.
drop policy if exists "payment_events_select_admin" on public.payment_events;
create policy "payment_events_select_admin"
on public.payment_events for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));
