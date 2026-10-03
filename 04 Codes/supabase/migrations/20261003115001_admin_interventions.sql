begin;
alter table public.nr_organizations add column write_suspended boolean not null default false;
create function nr_private.guard_suspended_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.write_suspended and new.version<>old.version then raise exception 'account_suspended';end if;
 return new;
end $$;
create trigger nr_guard_suspended_version before update of version on public.nr_organizations for each row execute function nr_private.guard_suspended_version();
revoke all on function nr_private.guard_suspended_version() from public,anon,authenticated;
create unique index nr_admin_intervention_once on public.nr_audit(entity_id) where action in('admin_subscription_added','admin_write_status');

create function public.nr_admin_intervene(p_actor uuid,p_org uuid,p_request uuid,p_action text,p_data jsonb,p_reason text) returns jsonb
language plpgsql security invoker set search_path='' set timezone='UTC' as $$
declare previous public.nr_audit; organization public.nr_organizations; latest public.nr_subscriptions; added public.nr_subscriptions; request jsonb; outcome jsonb; start_at timestamptz; policy text; suspended boolean;
begin
 if not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if p_request is null or p_reason is null or length(trim(p_reason)) not between 5 and 2000 or p_action is null or p_action not in('subscription','write_status') or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'invalid_intervention';end if;
 request=jsonb_build_object('org',p_org,'action',p_action,'data',p_data,'reason',trim(p_reason));
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,31));
 select * into previous from public.nr_audit where entity_id=p_request and action in('admin_subscription_added','admin_write_status');
 if found then
  if previous.actor_id<>p_actor or previous.details->'request'<>request then raise exception 'idempotency_key_reused';end if;
  return previous.details->'result'||jsonb_build_object('replayed',true);
 end if;
 select * into organization from public.nr_organizations where id=p_org for update;
 if not found then raise exception 'organization_missing';end if;
 if p_action='subscription' then
  if p_data-array['plan','months']<>'{}'::jsonb or coalesce(p_data->>'plan','') not in('avance','vip') or jsonb_typeof(p_data->'months') is distinct from 'number' or coalesce(p_data->>'months','') not in('1','3','6','12') then raise exception 'invalid_intervention';end if;
  select * into latest from public.nr_subscriptions where org_id=p_org and ends_at>now() order by ends_at desc,id limit 1;
  start_at=now();
  if found then
   start_at=latest.ends_at;
   if latest.plan_id<>'gratuit' and latest.plan_id<>p_data->>'plan' then
    select plan_change into policy from public.nr_commercial_settings where id=true;
    if policy is distinct from 'at_expiry' then raise exception 'plan_change_policy_required';end if;
   end if;
  end if;
  insert into public.nr_subscriptions(org_id,plan_id,starts_at,ends_at) values(p_org,p_data->>'plan',start_at,start_at+make_interval(months=>(p_data->>'months')::integer)) returning * into added;
  outcome=jsonb_build_object('subscriptionId',added.id,'plan',added.plan_id,'startsAt',added.starts_at,'endsAt',added.ends_at,'previousPeriod',case when latest.id is not null then to_jsonb(latest) else null end);
 else
  if p_data-'suspended'<>'{}'::jsonb or jsonb_typeof(p_data->'suspended') is distinct from 'boolean' then raise exception 'invalid_intervention';end if;
  suspended=(p_data->>'suspended')::boolean;
  update public.nr_organizations set write_suspended=suspended where id=p_org;
  outcome=jsonb_build_object('before',organization.write_suspended,'after',suspended,'changed',organization.write_suspended<>suspended);
 end if;
 insert into public.nr_audit(org_id,actor_id,action,entity_id,details) values(p_org,p_actor,case when p_action='subscription' then 'admin_subscription_added' else 'admin_write_status' end,p_request,jsonb_build_object('request',request,'result',outcome));
 insert into public.nr_notifications(org_id,title,message,event_key) values(p_org,case when p_action='subscription' then 'Période d’abonnement ajoutée' when suspended then 'Nouvelles écritures suspendues' else 'Nouvelles écritures rétablies' end,case when p_action='subscription' then 'Une période administrative a été ajoutée sans réduire vos droits déjà acquis. Consultez votre historique d’abonnement.' else 'La consultation et les données restent conservées. Les dates d’abonnement sont inchangées.' end||' Motif : '||trim(p_reason),'admin:'||p_request::text);
 return outcome||jsonb_build_object('replayed',false);
end $$;
revoke all on function public.nr_admin_intervene(uuid,uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.nr_admin_intervene(uuid,uuid,uuid,text,jsonb,text) to service_role;
commit;
