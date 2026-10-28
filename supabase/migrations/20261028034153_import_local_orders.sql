-- Import all local orders in one transaction, so a bad row cannot leave a
-- partly imported batch. The client keeps its original browser copy.
create or replace function public.workspace_import(p_token uuid, p_orders jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_order jsonb;
declare v_item jsonb;
declare v_id uuid;
declare v_name text;
declare v_code text;
declare v_quantity bigint;
declare v_count integer := 0;
begin
  if not exists (select 1 from public.workspace_access where token = p_token) then
    raise exception 'Enlace inválido' using errcode = '42501';
  end if;
  if p_orders is null or jsonb_typeof(p_orders) <> 'array' or jsonb_array_length(p_orders) > 500 then
    raise exception 'Respaldo inválido';
  end if;
  for v_order in select value from jsonb_array_elements(p_orders) loop
    v_name := upper(btrim(v_order->>'name'));
    if v_name is null or length(v_name) not between 1 and 120 or
       jsonb_typeof(v_order->'items') <> 'array' or jsonb_array_length(v_order->'items') > 10000 then
      raise exception 'Pedido inválido en el respaldo';
    end if;
    insert into public.orders (name) values (v_name) returning id into v_id;
    for v_item in select value from jsonb_array_elements(v_order->'items') loop
      v_code := upper(btrim(v_item->>'codigo'));
      v_quantity := (v_item->>'cantidad')::bigint;
      if v_code is null or length(v_code) not between 1 and 120 or
         v_quantity is null or v_quantity not between 1 and 9007199254740991 then
        raise exception 'Código o cantidad inválidos en el respaldo';
      end if;
      insert into public.order_items (order_id, code, quantity)
        values (v_id, v_code, v_quantity)
        on conflict (order_id, code) do update
          set quantity = public.order_items.quantity + excluded.quantity
          where public.order_items.quantity <= 9007199254740991 - excluded.quantity;
      if not found then raise exception 'La cantidad total supera el límite permitido'; end if;
    end loop;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.workspace_import(uuid, jsonb) from public;
grant execute on function public.workspace_import(uuid, jsonb) to anon, authenticated;
