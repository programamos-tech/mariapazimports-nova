-- Idempotente: asegura la RPC que usa el middleware de Next para detectar staff
-- sin depender solo del SELECT a public.profiles bajo RLS.

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
