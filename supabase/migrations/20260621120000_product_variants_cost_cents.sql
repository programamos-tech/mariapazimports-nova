-- Costo de compra por variante (SKU), como en Shopify/WooCommerce.

alter table public.product_variants
  add column if not exists cost_cents integer not null default 0
    check (cost_cents >= 0);

comment on column public.product_variants.cost_cents is
  'Costo de compra de esta presentación (SKU).';

-- Heredar costo del producto padre en variantes existentes.
update public.product_variants pv
set cost_cents = coalesce(p.cost_cents, 0)
from public.products p
where p.id = pv.product_id
  and pv.cost_cents = 0
  and coalesce(p.cost_cents, 0) > 0;
