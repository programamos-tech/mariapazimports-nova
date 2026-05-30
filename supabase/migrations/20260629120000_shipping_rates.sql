-- Tarifas de envío por municipio (DIVIPOLA DANE) + campos en pedidos.

create table public.shipping_departments (
  code text primary key check (code ~ '^\d{2}$'),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.shipping_municipalities (
  code text primary key check (code ~ '^\d{5}$'),
  department_code text not null references public.shipping_departments (code) on delete cascade,
  name text not null,
  cost_cents integer not null default 0 check (cost_cents >= 0),
  is_delivery_enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index shipping_municipalities_department_idx
  on public.shipping_municipalities (department_code, sort_order, name);

drop trigger if exists shipping_municipalities_set_updated_at on public.shipping_municipalities;
create trigger shipping_municipalities_set_updated_at
before update on public.shipping_municipalities
for each row execute function public.set_updated_at();

alter table public.shipping_departments enable row level security;
alter table public.shipping_municipalities enable row level security;

-- Catálogo público: municipios habilitados (checkout / cotización).
drop policy if exists "shipping_departments_select_public" on public.shipping_departments;
create policy "shipping_departments_select_public"
on public.shipping_departments
for select
to anon, authenticated
using (true);

drop policy if exists "shipping_municipalities_select_public" on public.shipping_municipalities;
create policy "shipping_municipalities_select_public"
on public.shipping_municipalities
for select
to anon, authenticated
using (is_delivery_enabled = true);

drop policy if exists "shipping_departments_select_admin" on public.shipping_departments;
create policy "shipping_departments_select_admin"
on public.shipping_departments
for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "shipping_municipalities_select_admin" on public.shipping_municipalities;
create policy "shipping_municipalities_select_admin"
on public.shipping_municipalities
for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "shipping_municipalities_update_admin" on public.shipping_municipalities;
create policy "shipping_municipalities_update_admin"
on public.shipping_municipalities
for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- Pedidos: costo y destino estructurado.
alter table public.orders
  add column if not exists subtotal_cents integer,
  add column if not exists shipping_cents integer not null default 0,
  add column if not exists shipping_department_code text,
  add column if not exists shipping_municipality_code text,
  add column if not exists shipping_method text not null default 'delivery'
    check (shipping_method in ('delivery', 'pickup'));
