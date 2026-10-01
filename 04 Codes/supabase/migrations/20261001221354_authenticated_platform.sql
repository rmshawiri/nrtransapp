begin;
alter policy own_org on public.nr_organizations using (
 exists(select 1 from public.nr_members m where m.org_id=id and m.user_id=auth.uid() and m.active)
);

-- One database statement gives the client a coherent version and financial snapshot.
-- Invoker security applies the same RLS as direct client queries, including vehicle scope.
create function public.nr_snapshot(p_org uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('organization',to_jsonb(o),
 'records',coalesce((select jsonb_agg(jsonb_build_object('kind',r.kind,'payload',r.payload)) from public.nr_records r where r.org_id=o.id and r.deleted_at is null),'[]'::jsonb),
 'allocations',coalesce((select jsonb_agg(to_jsonb(a)-'org_id') from public.nr_loan_allocations a where a.org_id=o.id),'[]'::jsonb))
 from public.nr_organizations o where o.id=p_org
$$;
revoke all on function public.nr_snapshot(uuid) from public,anon;
grant execute on function public.nr_snapshot(uuid) to authenticated;

grant usage on schema auth to service_role;
grant select(id,user_id,not_after) on auth.sessions to service_role;
create function public.nr_session_active(p_actor uuid,p_session uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and (not_after is null or not_after>now()))
$$;
revoke all on function public.nr_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.nr_session_active(uuid,uuid) to service_role;
commit;
