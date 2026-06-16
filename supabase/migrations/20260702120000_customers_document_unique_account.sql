-- Una cédula normalizada solo puede tener una cuenta de tienda vinculada (auth_user_id).

create or replace function public.document_has_registered_account(p_normalized text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.customers c
    where public.normalize_document_id(c.document_id) = p_normalized
      and p_normalized is not null
      and length(p_normalized) >= 6
      and c.auth_user_id is not null
  );
$$;

comment on function public.document_has_registered_account(text) is
  'True si algún cliente ya tiene esta cédula (normalizada) vinculada a una cuenta Auth.';

revoke all on function public.document_has_registered_account(text) from public;
grant execute on function public.document_has_registered_account(text) to service_role;

create unique index if not exists customers_document_normalized_linked_unique
  on public.customers (public.normalize_document_id(document_id))
  where auth_user_id is not null
    and public.normalize_document_id(document_id) is not null;
