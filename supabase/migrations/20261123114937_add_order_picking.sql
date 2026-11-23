create table public.order_picking (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  code text not null check (code = upper(btrim(code)) and length(code) between 1 and 120),
  quantity bigint not null check (quantity between 1 and 9007199254740991),
  created_at timestamptz not null default now(),
  unique (order_id, code)
);

create index order_picking_order_id_idx on public.order_picking (order_id);
alter table public.order_picking enable row level security;
revoke all on public.order_picking from public, anon, authenticated;

-- Keep table access private. The existing public workspace reads through this
-- controlled snapshot only.
create or replace function public.workspace_snapshot(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not exists (select 1 from public.workspace_access where token = p_token) then
    raise exception 'Enlace inválido' using errcode = '42501';
  end if;
  select jsonb_build_object('orders', coalesce(jsonb_agg(
    jsonb_build_object(
      'id', o.id, 'name', o.name, 'created_at', o.created_at,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', i.id, 'code', i.code, 'quantity', i.quantity
        ) order by i.created_at desc)
        from public.order_items i where i.order_id = o.id
      ), '[]'::jsonb),
      'picking', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', p.id, 'code', p.code, 'quantity', p.quantity
        ) order by p.created_at, p.code)
        from public.order_picking p where p.order_id = o.id
      ), '[]'::jsonb)
    ) order by o.created_at desc
  ), '[]'::jsonb)) into result from public.orders o;
  return result;
end;
$$;

create or replace function public.workspace_replace_picking(p_token uuid, p_order_id uuid, p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_item jsonb;
declare v_code text;
declare v_quantity bigint;
declare v_count integer := 0;
begin
  if not exists (select 1 from public.workspace_access where token = p_token) then
    raise exception 'Enlace inválido' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 10000 then
    raise exception 'Picking inválido';
  end if;
  perform 1 from public.orders where id = p_order_id for update;
  if not found then raise exception 'El pedido ya no existe'; end if;

  delete from public.order_picking where order_id = p_order_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_code := upper(btrim(v_item->>'code'));
    v_quantity := (v_item->>'quantity')::bigint;
    if v_code is null or length(v_code) not between 1 and 120 or
       v_quantity is null or v_quantity not between 1 and 9007199254740991 then
      raise exception 'Código o cantidad inválidos en el picking';
    end if;
    insert into public.order_picking (order_id, code, quantity)
      values (p_order_id, v_code, v_quantity)
      on conflict (order_id, code) do update
        set quantity = public.order_picking.quantity + excluded.quantity
        where public.order_picking.quantity <= 9007199254740991 - excluded.quantity;
    if not found then raise exception 'La cantidad total supera el límite permitido'; end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.workspace_replace_picking(uuid, uuid, jsonb) from public, anon, authenticated;

create or replace function public.shared_replace_picking(p_order_id uuid, p_items jsonb)
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.workspace_replace_picking(
    (select token from public.workspace_access where singleton = true),
    p_order_id,
    p_items
  );
$$;

revoke all on function public.shared_replace_picking(uuid, jsonb) from public;
grant execute on function public.shared_replace_picking(uuid, jsonb) to anon;

-- Preserve pickings when old local orders are incorporated into the shared
-- workspace. Older backups without a picking remain valid.
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
declare v_picking jsonb;
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
    v_picking := coalesce(v_order->'picking', '[]'::jsonb);
    if jsonb_typeof(v_picking) <> 'array' or jsonb_array_length(v_picking) > 10000 then
      raise exception 'Picking inválido en el respaldo';
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
    for v_item in select value from jsonb_array_elements(v_picking) loop
      v_code := upper(btrim(v_item->>'codigo'));
      v_quantity := (v_item->>'cantidad')::bigint;
      if v_code is null or length(v_code) not between 1 and 120 or
         v_quantity is null or v_quantity not between 1 and 9007199254740991 then
        raise exception 'Código o cantidad inválidos en el picking';
      end if;
      insert into public.order_picking (order_id, code, quantity)
        values (v_id, v_code, v_quantity)
        on conflict (order_id, code) do update
          set quantity = public.order_picking.quantity + excluded.quantity
          where public.order_picking.quantity <= 9007199254740991 - excluded.quantity;
      if not found then raise exception 'La cantidad total supera el límite permitido'; end if;
    end loop;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
