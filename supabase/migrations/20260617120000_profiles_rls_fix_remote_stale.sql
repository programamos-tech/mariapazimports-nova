-- Proyectos creados o migrados sin 20260611130000: siguen con profiles_select_team
-- recursiva (EXISTS sobre public.profiles) → el middleware / PostgREST no ve la fila propia.
-- Idempotente: reemplaza SELECT/UPDATE de equipo por políticas que usan user_has_admin_profile().

create or replace function public.user_has_admin_profile()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid()
  );
$$;

comment on function public.user_has_admin_profile() is
  'Comprueba si existe fila en profiles para auth.uid(); sin recursión RLS.';

grant execute on function public.user_has_admin_profile() to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_team" on public.profiles;
drop policy if exists "profiles_select_access" on public.profiles;
drop policy if exists "profiles_update_team" on public.profiles;

create policy "profiles_select_access"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.user_has_admin_profile()
);

create policy "profiles_update_team"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.user_has_admin_profile()
)
with check (
  auth.uid() = id
  or public.user_has_admin_profile()
);
