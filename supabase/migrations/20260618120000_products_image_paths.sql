-- Galería de catálogo (hasta 5 rutas). `image_path` sigue siendo la portada (primera imagen).
alter table public.products
  add column if not exists image_paths jsonb not null default '[]'::jsonb;

update public.products
set image_paths = jsonb_build_array(image_path)
where coalesce(trim(image_path), '') <> ''
  and (image_paths is null or image_paths = '[]'::jsonb);
