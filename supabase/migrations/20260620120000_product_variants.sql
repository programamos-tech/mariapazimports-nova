-- Variantes de producto: precio/stock/imagen por presentación (fragancia, tamaño, tono, color).

alter table public.products
  add column if not exists variant_axis text not null default 'none';

alter table public.products
  drop constraint if exists products_variant_axis_check;

alter table public.products
  add constraint products_variant_axis_check
  check (variant_axis in ('none', 'fragrance', 'size', 'tone', 'color'));

comment on column public.products.variant_axis is
  'Eje único de variantes: none | fragrance | size | tone | color. Si no es none, el cliente elige una fila de product_variants.';

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  price_cents integer not null check (price_cents >= 0),
  stock_warehouse integer not null default 0 check (stock_warehouse >= 0),
  stock_local integer not null default 0 check (stock_local >= 0),
  image_paths jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, label)
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create index if not exists product_variants_product_sort_idx
  on public.product_variants (product_id, sort_order);

comment on table public.product_variants is
  'Presentaciones vendibles de un producto (fragancia, tamaño, tono, color) con precio y stock propios.';

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null;

alter table public.order_items
  add column if not exists variant_label_snapshot text;

-- updated_at trigger
drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- RLS (mismo patrón que products: lectura pública vía anon para publicados)
alter table public.product_variants enable row level security;

drop policy if exists "product_variants_select_public" on public.product_variants;
create policy "product_variants_select_public"
  on public.product_variants
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and p.is_published = true
    )
  );

drop policy if exists "product_variants_all_admin" on public.product_variants;
create policy "product_variants_all_admin"
  on public.product_variants
  for all
  to authenticated
  using (public.user_has_admin_profile())
  with check (public.user_has_admin_profile());

-- Migración idempotente desde fragrance_options / size_options (solo si aún no hay variantes)
do $$
declare
  r record;
  lbl text;
  imgs jsonb;
  img_arr jsonb;
  i int;
  sz jsonb;
  sz_label text;
  sz_val numeric;
  sz_unit text;
  stock_wh int;
  stock_loc int;
begin
  for r in
    select p.*
    from public.products p
    where not exists (
      select 1 from public.product_variants pv where pv.product_id = p.id
    )
  loop
    stock_wh := coalesce(r.stock_warehouse, 0);
    stock_loc := coalesce(r.stock_local, 0);

    if coalesce(array_length(r.fragrance_options, 1), 0) > 0 then
      update public.products set variant_axis = 'fragrance' where id = r.id;
      imgs := coalesce(r.fragrance_option_images, '{}'::jsonb);
      i := 0;
      foreach lbl in array r.fragrance_options loop
        lbl := trim(lbl);
        if lbl = '' then continue; end if;
        img_arr := imgs -> lbl;
        if img_arr is null then
          img_arr := imgs -> lower(lbl);
        end if;
        insert into public.product_variants (
          product_id, label, price_cents, stock_warehouse, stock_local, image_paths, sort_order
        ) values (
          r.id,
          lbl,
          coalesce(r.price_cents, 0),
          case when i = 0 then stock_wh else 0 end,
          case when i = 0 then stock_loc else 0 end,
          case
            when img_arr is not null and jsonb_typeof(img_arr) = 'array' then img_arr
            when img_arr is not null and jsonb_typeof(img_arr) = 'string' then jsonb_build_array(img_arr)
            when coalesce(jsonb_array_length(r.image_paths), 0) > 0 then r.image_paths
            when r.image_path is not null and r.image_path <> '' then jsonb_build_array(r.image_path)
            else '[]'::jsonb
          end,
          i
        )
        on conflict (product_id, label) do nothing;
        i := i + 1;
      end loop;

    elsif coalesce(jsonb_array_length(r.size_options), 0) > 1 then
      update public.products set variant_axis = 'size' where id = r.id;
      i := 0;
      for sz in select * from jsonb_array_elements(r.size_options) loop
        sz_val := (sz ->> 'value')::numeric;
        sz_unit := trim(coalesce(sz ->> 'unit', ''));
        if sz_val is null or sz_val <= 0 or sz_unit = '' then continue; end if;
        sz_label := trim(trailing '.' from trim(trailing '0' from sz_val::text)) || ' ' || sz_unit;
        insert into public.product_variants (
          product_id, label, price_cents, stock_warehouse, stock_local, image_paths, sort_order
        ) values (
          r.id,
          sz_label,
          coalesce(r.price_cents, 0),
          case when i = 0 then stock_wh else 0 end,
          case when i = 0 then stock_loc else 0 end,
          case
            when coalesce(jsonb_array_length(r.image_paths), 0) > 0 then r.image_paths
            when r.image_path is not null and r.image_path <> '' then jsonb_build_array(r.image_path)
            else '[]'::jsonb
          end,
          i
        )
        on conflict (product_id, label) do nothing;
        i := i + 1;
      end loop;

    elsif coalesce(array_length(r.fragrance_options, 1), 0) = 1 then
      update public.products set variant_axis = 'fragrance' where id = r.id;
      lbl := trim(r.fragrance_options[1]);
      imgs := coalesce(r.fragrance_option_images, '{}'::jsonb);
      img_arr := coalesce(imgs -> lbl, imgs -> lower(lbl));
      insert into public.product_variants (
        product_id, label, price_cents, stock_warehouse, stock_local, image_paths, sort_order
      ) values (
        r.id,
        lbl,
        coalesce(r.price_cents, 0),
        stock_wh,
        stock_loc,
        case
          when img_arr is not null and jsonb_typeof(img_arr) = 'array' then img_arr
          when img_arr is not null and jsonb_typeof(img_arr) = 'string' then jsonb_build_array(img_arr)
          when coalesce(jsonb_array_length(r.image_paths), 0) > 0 then r.image_paths
          when r.image_path is not null and r.image_path <> '' then jsonb_build_array(r.image_path)
          else '[]'::jsonb
        end,
        0
      )
      on conflict (product_id, label) do nothing;

    else
      update public.products set variant_axis = 'none' where id = r.id;
    end if;
  end loop;
end $$;
