-- Notificaciones del panel (p. ej. nuevo registro en la tienda).
create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null
    check (kind in ('store_customer_registered')),
  title text not null,
  body text not null default '',
  href text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

create table public.admin_notification_reads (
  notification_id uuid not null
    references public.admin_notifications (id) on delete cascade,
  profile_id uuid not null
    references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, profile_id)
);

create index admin_notification_reads_profile_idx
  on public.admin_notification_reads (profile_id, read_at desc);

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;

-- Equipo con perfil: leer notificaciones
drop policy if exists "admin_notifications_select_team" on public.admin_notifications;
create policy "admin_notifications_select_team"
on public.admin_notifications
for select
to authenticated
using (exists (select 1 from public.profiles me where me.id = auth.uid()));

-- Lecturas: cada colaborador gestiona las suyas
drop policy if exists "admin_notification_reads_select_own" on public.admin_notification_reads;
create policy "admin_notification_reads_select_own"
on public.admin_notification_reads
for select
to authenticated
using (
  profile_id = auth.uid()
  and exists (select 1 from public.profiles me where me.id = auth.uid())
);

drop policy if exists "admin_notification_reads_insert_own" on public.admin_notification_reads;
create policy "admin_notification_reads_insert_own"
on public.admin_notification_reads
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and exists (select 1 from public.profiles me where me.id = auth.uid())
);

-- Inserts desde service role (registro tienda); sin policy insert para authenticated.
