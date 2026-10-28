-- This application has one shared, passwordless workspace. Possession of the
-- random URL token grants access; no table is exposed directly to anon.
drop function public.get_shared_order(uuid);
drop function public.add_order_item(uuid, text, bigint);
drop function public.edit_order_item(uuid, text, bigint);

drop policy "Members can read orders" on public.orders;
drop policy "Operators can insert orders" on public.orders;
drop policy "Operators can update orders" on public.orders;
drop policy "Operators can delete orders" on public.orders;
drop policy "Members can read items" on public.order_items;
drop policy "Operators can insert items" on public.order_items;
drop policy "Operators can update items" on public.order_items;
drop policy "Operators can delete items" on public.order_items;
drop table public.app_members;

revoke all on public.orders, public.order_items from authenticated;
alter table public.orders drop column created_by;
alter table public.orders drop column share_token;

create table public.workspace_access (
  singleton boolean primary key default true check (singleton),
  token uuid not null unique default gen_random_uuid()
);
alter table public.workspace_access enable row level security;
insert into public.workspace_access (singleton) values (true);
revoke all on public.workspace_access from public, anon, authenticated;

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
      ), '[]'::jsonb)
    ) order by o.created_at desc
  ), '[]'::jsonb)) into result from public.orders o;
  return result;
end;
$$;

create or replace function public.workspace_mutate(p_token uuid, p_action text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_order uuid;
declare v_item uuid;
declare v_name text;
declare v_code text;
declare v_quantity bigint;
declare v_source public.order_items;
declare v_target public.order_items;
begin
  if not exists (select 1 from public.workspace_access where token = p_token) then
    raise exception 'Enlace inválido' using errcode = '42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Datos inválidos';
  end if;

  if p_action = 'create_order' then
    v_name := upper(btrim(p_payload->>'name'));
    insert into public.orders (name) values (v_name);
  elsif p_action = 'rename_order' then
    v_order := (p_payload->>'order_id')::uuid;
    v_name := upper(btrim(p_payload->>'name'));
    update public.orders set name = v_name where id = v_order;
    if not found then raise exception 'El pedido ya no existe'; end if;
  elsif p_action = 'delete_order' then
    v_order := (p_payload->>'order_id')::uuid;
    delete from public.orders where id = v_order;
    if not found then raise exception 'El pedido ya no existe'; end if;
  elsif p_action in ('add_item', 'edit_item') then
    v_code := upper(btrim(p_payload->>'code'));
    v_quantity := (p_payload->>'quantity')::bigint;
    if v_code is null or length(v_code) not between 1 and 120 or
       v_quantity is null or v_quantity not between 1 and 9007199254740991 then
      raise exception 'Código o cantidad inválidos';
    end if;

    if p_action = 'add_item' then
      v_order := (p_payload->>'order_id')::uuid;
    else
      v_item := (p_payload->>'item_id')::uuid;
      select * into v_source from public.order_items where id = v_item;
      if not found then raise exception 'El código ya no existe'; end if;
      v_order := v_source.order_id;
    end if;
    perform 1 from public.orders where id = v_order for update;
    if not found then raise exception 'El pedido ya no existe'; end if;

    if p_action = 'add_item' then
      insert into public.order_items (order_id, code, quantity)
        values (v_order, v_code, v_quantity)
        on conflict (order_id, code) do update
          set quantity = public.order_items.quantity + excluded.quantity
          where public.order_items.quantity <= 9007199254740991 - excluded.quantity;
      if not found then raise exception 'La cantidad total supera el límite permitido'; end if;
    else
      select * into v_source from public.order_items where id = v_item for update;
      if not found then raise exception 'El código ya no existe'; end if;
      if v_source.code = v_code then
        update public.order_items set quantity = v_quantity where id = v_item;
      else
        select * into v_target from public.order_items
          where order_id = v_order and code = v_code for update;
        if found then
          if v_target.quantity > 9007199254740991 - v_quantity then
            raise exception 'La cantidad total supera el límite permitido';
          end if;
          update public.order_items set quantity = quantity + v_quantity where id = v_target.id;
          delete from public.order_items where id = v_item;
        else
          update public.order_items set code = v_code, quantity = v_quantity where id = v_item;
        end if;
      end if;
    end if;
  elsif p_action = 'delete_item' then
    v_item := (p_payload->>'item_id')::uuid;
    select order_id into v_order from public.order_items where id = v_item;
    if not found then raise exception 'El código ya no existe'; end if;
    perform 1 from public.orders where id = v_order for update;
    delete from public.order_items where id = v_item;
    if not found then raise exception 'El código ya no existe'; end if;
  elsif p_action = 'clear_items' then
    v_order := (p_payload->>'order_id')::uuid;
    perform 1 from public.orders where id = v_order for update;
    if not found then raise exception 'El pedido ya no existe'; end if;
    delete from public.order_items where order_id = v_order;
  else
    raise exception 'Operación inválida';
  end if;
end;
$$;

revoke all on function public.workspace_snapshot(uuid) from public;
revoke all on function public.workspace_mutate(uuid, text, jsonb) from public;
grant execute on function public.workspace_snapshot(uuid) to anon, authenticated;
grant execute on function public.workspace_mutate(uuid, text, jsonb) to anon, authenticated;
