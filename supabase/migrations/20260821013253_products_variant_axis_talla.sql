-- Eje de variantes para ropa / moda (tallas de vestir).
-- Distinto de `size` (ml/g/oz de presentación).

alter table public.products
  drop constraint if exists products_variant_axis_check;

alter table public.products
  add constraint products_variant_axis_check
  check (
    variant_axis in (
      'none',
      'fragrance',
      'size',
      'tone',
      'color',
      'talla'
    )
  );

comment on column public.products.variant_axis is
  'none | fragrance | size (contenido ml/g) | tone | color | talla (ropa)';
