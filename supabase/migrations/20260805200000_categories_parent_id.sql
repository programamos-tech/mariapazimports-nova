-- Categorías jerárquicas (máx. 2 niveles: categoría → subcategoría).

alter table public.categories
  add column if not exists parent_id uuid
    references public.categories (id)
    on delete cascade;

create index if not exists categories_parent_id_idx
  on public.categories (parent_id);

comment on column public.categories.parent_id is
  'Si es null, es categoría raíz. Si apunta a otra, es subcategoría (solo 1 nivel de anidación).';

-- Impide auto-referencia y profundidad > 2 (solo raíces como padres).
create or replace function public.categories_enforce_parent_depth()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'Una categoría no puede ser padre de sí misma';
  end if;

  select c.parent_id into parent_parent
  from public.categories c
  where c.id = new.parent_id;

  if not found then
    raise exception 'La categoría padre no existe';
  end if;

  if parent_parent is not null then
    raise exception 'Solo se permiten subcategorías bajo categorías raíz (máximo 2 niveles)';
  end if;

  return new;
end;
$$;

drop trigger if exists categories_enforce_parent_depth on public.categories;
create trigger categories_enforce_parent_depth
  before insert or update of parent_id
  on public.categories
  for each row
  execute function public.categories_enforce_parent_depth();
