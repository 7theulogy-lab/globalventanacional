create table public.app_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operator', 'viewer')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  code text not null check (code = upper(btrim(code)) and length(code) between 1 and 120),
  quantity bigint not null check (quantity between 1 and 9007199254740991),
  created_at timestamptz not null default now(),
  unique (order_id, code)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index orders_created_at_idx on public.orders (created_at desc);

alter table public.app_members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Members can read own role" on public.app_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Members can read orders" on public.orders
  for select to authenticated using (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Operators can insert orders" on public.orders
  for insert to authenticated with check (
    created_by = (select auth.uid()) and
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  );
create policy "Operators can update orders" on public.orders
  for update to authenticated using (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  ) with check (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  );
create policy "Operators can delete orders" on public.orders
  for delete to authenticated using (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  );

create policy "Members can read items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Operators can insert items" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  );
create policy "Operators can update items" on public.order_items
  for update to authenticated using (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  ) with check (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  );
create policy "Operators can delete items" on public.order_items
  for delete to authenticated using (
    exists (select 1 from public.app_members m where m.user_id = (select auth.uid()) and m.role in ('admin', 'operator'))
  );

revoke all on public.app_members, public.orders, public.order_items from anon;
grant select on public.app_members to authenticated;
grant select, insert, update, delete on public.orders, public.order_items to authenticated;

create or replace function public.add_order_item(p_order_id uuid, p_code text, p_quantity bigint)
returns public.order_items
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.order_items;
begin
  if p_code is null or length(btrim(p_code)) not between 1 and 120 or
     p_quantity is null or p_quantity not between 1 and 9007199254740991 then
    raise exception 'Código o cantidad inválidos';
  end if;
  perform 1 from public.orders where id = p_order_id for update;
  if not found then raise exception 'Pedido no disponible'; end if;
  insert into public.order_items (order_id, code, quantity)
    values (p_order_id, upper(btrim(p_code)), p_quantity)
    on conflict (order_id, code) do update
      set quantity = public.order_items.quantity + excluded.quantity
      where public.order_items.quantity <= 9007199254740991 - excluded.quantity
    returning * into result;
  if result.id is null then raise exception 'La cantidad total supera el límite permitido'; end if;
  return result;
end;
$$;

create or replace function public.edit_order_item(p_item_id uuid, p_code text, p_quantity bigint)
returns public.order_items
language plpgsql
security invoker
set search_path = ''
as $$
declare source public.order_items;
declare result public.order_items;
begin
  if p_code is null or length(btrim(p_code)) not between 1 and 120 or
     p_quantity is null or p_quantity not between 1 and 9007199254740991 then
    raise exception 'Código o cantidad inválidos';
  end if;
  select * into source from public.order_items where id = p_item_id;
  if not found then raise exception 'El código ya no existe'; end if;
  perform 1 from public.orders where id = source.order_id for update;
  if not found then raise exception 'Pedido no disponible'; end if;
  select * into source from public.order_items where id = p_item_id for update;
  if not found then raise exception 'El código ya no existe'; end if;
  if source.code = upper(btrim(p_code)) then
    update public.order_items set quantity = p_quantity where id = p_item_id returning * into result;
  else
    select * into result from public.order_items
      where order_id = source.order_id and code = upper(btrim(p_code)) for update;
    if found then
      if result.quantity > 9007199254740991 - p_quantity then
        raise exception 'La cantidad total supera el límite permitido';
      end if;
      update public.order_items set quantity = quantity + p_quantity
        where id = result.id returning * into result;
      delete from public.order_items where id = p_item_id;
    else
      update public.order_items set code = upper(btrim(p_code)), quantity = p_quantity
        where id = p_item_id returning * into result;
    end if;
  end if;
  return result;
end;
$$;

revoke all on function public.add_order_item(uuid, text, bigint) from public, anon;
revoke all on function public.edit_order_item(uuid, text, bigint) from public, anon;
grant execute on function public.add_order_item(uuid, text, bigint) to authenticated;
grant execute on function public.edit_order_item(uuid, text, bigint) to authenticated;

alter publication supabase_realtime add table public.orders, public.order_items;
