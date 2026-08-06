-- Al aprobar Wompi, el pedido debe pasar a fulfillment "accepted"
-- (igual que al aceptar una transferencia), no quedar sin estado / esperando comprobante.

create or replace function public.apply_wompi_payment_transition(
  p_payment_id uuid,
  p_new_status public.payment_status,
  p_provider_transaction_id text,
  p_payment_method_type text,
  p_status_message text,
  p_raw_response jsonb
)
returns table (
  applied boolean,
  previous_status public.payment_status,
  order_id uuid,
  stock_should_deduct boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_order_status text;
begin
  select * into v_pay
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return query select false, null::public.payment_status, null::uuid, false;
    return;
  end if;

  -- Idempotente: mismo estado final + misma txn
  if v_pay.status = p_new_status
     and v_pay.provider_transaction_id is not distinct from p_provider_transaction_id then
    return query select false, v_pay.status, v_pay.order_id, false;
    return;
  end if;

  -- Nunca degradar APPROVED
  if v_pay.status = 'APPROVED' and p_new_status is distinct from 'APPROVED' then
    return query select false, v_pay.status, v_pay.order_id, false;
    return;
  end if;

  update public.payments
  set
    status = p_new_status,
    provider_transaction_id = coalesce(p_provider_transaction_id, provider_transaction_id),
    payment_method_type = coalesce(p_payment_method_type, payment_method_type),
    status_message = coalesce(p_status_message, status_message),
    raw_response = coalesce(p_raw_response, raw_response),
    approved_at = case
      when p_new_status = 'APPROVED' then coalesce(approved_at, now())
      else approved_at
    end,
    failed_at = case
      when p_new_status in ('DECLINED', 'VOIDED', 'ERROR', 'FAILED')
        then coalesce(failed_at, now())
      else failed_at
    end,
    updated_at = now()
  where id = p_payment_id;

  if v_pay.order_id is not null then
    select o.status into v_order_status
    from public.orders o
    where o.id = v_pay.order_id
    for update;

    if p_new_status = 'APPROVED' and v_order_status is distinct from 'paid' then
      update public.orders
      set
        status = 'paid',
        fulfillment_status = 'accepted',
        wompi_transaction_id = coalesce(p_provider_transaction_id, wompi_transaction_id),
        wompi_reference = coalesce(v_pay.reference, wompi_reference),
        payment_method = 'wompi',
        updated_at = now()
      where id = v_pay.order_id;

      return query select true, v_pay.status, v_pay.order_id, true;
      return;
    elsif p_new_status = 'APPROVED' and v_order_status = 'paid' then
      -- Pedidos ya pagados sin fulfillment (pagos Wompi previos al fix)
      update public.orders
      set
        fulfillment_status = 'accepted',
        wompi_transaction_id = coalesce(p_provider_transaction_id, wompi_transaction_id),
        wompi_reference = coalesce(v_pay.reference, wompi_reference),
        payment_method = coalesce(payment_method, 'wompi'),
        updated_at = now()
      where id = v_pay.order_id
        and (
          fulfillment_status is null
          or fulfillment_status = 'awaiting_payment'
          or fulfillment_status = 'payment_submitted'
        );
    elsif p_new_status in ('DECLINED', 'VOIDED', 'ERROR', 'FAILED')
          and v_order_status = 'pending' then
      update public.orders
      set
        status = 'failed',
        wompi_transaction_id = coalesce(p_provider_transaction_id, wompi_transaction_id),
        wompi_reference = coalesce(v_pay.reference, wompi_reference),
        updated_at = now()
      where id = v_pay.order_id;
    end if;
  end if;

  return query select true, v_pay.status, v_pay.order_id, false;
end;
$$;

revoke all on function public.apply_wompi_payment_transition(
  uuid, public.payment_status, text, text, text, jsonb
) from public;
grant execute on function public.apply_wompi_payment_transition(
  uuid, public.payment_status, text, text, text, jsonb
) to service_role;

-- Pedidos ya cobrados que quedaron sin avance logístico
update public.orders
set fulfillment_status = 'accepted'
where status = 'paid'
  and (
    fulfillment_status is null
    or fulfillment_status = 'awaiting_payment'
    or fulfillment_status = 'payment_submitted'
  );
