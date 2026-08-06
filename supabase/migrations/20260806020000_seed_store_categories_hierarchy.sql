-- Catálogo según lista de la tienda.
-- "Todos los productos" es enlace de UI (no categoría en DB).

do $$
declare
  belleza_id uuid;
begin
  if exists (select 1 from public.categories) then
    raise notice 'categories already populated; skip seed';
    return;
  end if;

  insert into public.categories (name, sort_order, icon_key, parent_id)
  values ('Belleza y Cuidado', 0, 'sparkles', null)
  returning id into belleza_id;

  insert into public.categories (name, sort_order, icon_key, parent_id)
  values
    ('Cuidado Corporal', 0, 'hand-heart', belleza_id),
    ('Skincare', 1, 'sparkles', belleza_id),
    ('Cuidado Capilar', 2, 'sparkles', belleza_id),
    ('Cuidado Bucal', 3, 'tag', belleza_id),
    ('Fragancias', 4, 'sparkles', belleza_id),
    ('Maquillaje', 5, 'paintbrush', belleza_id);

  insert into public.categories (name, sort_order, icon_key, parent_id)
  values
    ('Vitaminas y Suplementos', 1, 'pill', null),
    ('Termos', 2, 'thermometer', null),
    ('Moda', 3, 'shirt', null),
    ('Marcas', 4, 'tag', null);
end $$;
