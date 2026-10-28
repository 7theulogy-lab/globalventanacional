-- The project intentionally uses one public workspace. The browser needs only
-- the site's normal URL; anonymous visitors can read and change its orders.
-- Direct table access stays blocked by RLS and missing grants.
revoke execute on function public.workspace_snapshot(uuid) from anon, authenticated;
revoke execute on function public.workspace_mutate(uuid, text, jsonb) from anon, authenticated;
revoke execute on function public.workspace_import(uuid, jsonb) from anon, authenticated;

create or replace function public.shared_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.workspace_snapshot((select token from public.workspace_access where singleton = true));
$$;

create or replace function public.shared_mutate(p_action text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.workspace_mutate(
    (select token from public.workspace_access where singleton = true),
    p_action,
    p_payload
  );
end;
$$;

create or replace function public.shared_import(p_orders jsonb)
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.workspace_import(
    (select token from public.workspace_access where singleton = true),
    p_orders
  );
$$;

revoke all on function public.shared_snapshot() from public;
revoke all on function public.shared_mutate(text, jsonb) from public;
revoke all on function public.shared_import(jsonb) from public;
grant execute on function public.shared_snapshot() to anon;
grant execute on function public.shared_mutate(text, jsonb) to anon;
grant execute on function public.shared_import(jsonb) to anon;
