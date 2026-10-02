begin;
create function public.nr_subscription_current(p_org uuid,p_actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select to_jsonb(s) from public.nr_subscriptions s where s.org_id=p_org and s.starts_at<=now() and s.ends_at>now()
 and exists(select 1 from public.nr_members m where m.org_id=p_org and m.user_id=p_actor and m.active)
 order by s.starts_at desc limit 1
$$;
revoke all on function public.nr_subscription_current(uuid,uuid) from public,anon,authenticated;
grant execute on function public.nr_subscription_current(uuid,uuid) to service_role;
commit;
