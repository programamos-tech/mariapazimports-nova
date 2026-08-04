-- Origen de importación del producto (USA por defecto; algunos vienen de Europa u otros).
alter table public.products
  add column if not exists import_origin text not null default 'US';

do $$ begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_import_origin_check'
  ) then
    alter table public.products
      add constraint products_import_origin_check
      check (import_origin in ('US', 'EU', 'OTHER'));
  end if;
end $$;

comment on column public.products.import_origin is
  'Origen de importación: US (Estados Unidos), EU (Europa), OTHER.';
