alter table public.orders add column share_token uuid not null default gen_random_uuid() unique;
create index orders_created_by_idx on public.orders (created_by);

-- Anonymous visitors can read one order only when they know its random share token.
-- The function returns no user IDs or other orders.
create or replace function public.get_shared_order(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'code', i.code, 'quantity', i.quantity
      ) order by i.created_at desc)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.share_token = p_token;
$$;

revoke all on function public.get_shared_order(uuid) from public;
grant execute on function public.get_shared_order(uuid) to anon, authenticated;
