-- Conteos de productos publicados por categoría (menú Shop / header).
-- Evita SELECT de todas las filas de products solo para contar.

create or replace function public.store_category_product_counts()
returns table (category_id uuid, product_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select p.category_id, count(*)::bigint as product_count
  from public.products p
  where p.is_published = true
    and p.category_id is not null
  group by p.category_id;
$$;

comment on function public.store_category_product_counts() is
  'Conteo de productos publicados por categoría para menú de tienda.';

grant execute on function public.store_category_product_counts() to anon, authenticated, service_role;
