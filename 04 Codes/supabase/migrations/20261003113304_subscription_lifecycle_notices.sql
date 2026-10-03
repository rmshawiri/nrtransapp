begin;
alter table public.nr_notifications add column event_key text;
create unique index nr_notification_event_once on public.nr_notifications(org_id,event_key) where event_key is not null;

create function public.nr_subscription_notices(p_actor uuid,p_org uuid) returns integer
language plpgsql security invoker set search_path='' as $$
declare period public.nr_subscriptions; phase text; title text; message text; inserted integer;
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 perform 1 from public.nr_organizations where id=p_org for update;
 select * into period from public.nr_subscriptions where org_id=p_org and starts_at<=now() and ends_at>now() order by ends_at desc,id limit 1;
 if found then
  if period.ends_at>now()+interval '3 days' or exists(select 1 from public.nr_subscriptions s where s.org_id=p_org and s.id<>period.id and s.starts_at<=period.ends_at and s.ends_at>period.ends_at) then return 0;end if;
  phase:='expiring';title:='Votre abonnement arrive à expiration';
  message:='Votre formule '||period.plan_id||' se termine le '||to_char(period.ends_at at time zone 'Indian/Comoro','DD/MM/YYYY HH24:MI')||' (Comores). Renouvelez depuis votre espace Client. Vos données restent conservées.';
 else
  select * into period from public.nr_subscriptions where org_id=p_org and ends_at<=now() order by ends_at desc,id limit 1;
  if not found then return 0;end if;
  phase:='expired';title:='Votre abonnement a expiré';
  message:='Votre formule '||period.plan_id||' est arrivée à échéance. Vos données restent conservées et consultables. Renouvelez depuis votre espace Client pour reprendre les nouvelles opérations.';
 end if;
 insert into public.nr_notifications(org_id,title,message,event_key) values(p_org,title,message,'subscription:'||period.id::text||':'||phase)
 on conflict(org_id,event_key) where event_key is not null do nothing;
 get diagnostics inserted=row_count;
 return inserted;
end $$;
revoke all on function public.nr_subscription_notices(uuid,uuid) from public,anon,authenticated;
grant execute on function public.nr_subscription_notices(uuid,uuid) to service_role;
commit;
