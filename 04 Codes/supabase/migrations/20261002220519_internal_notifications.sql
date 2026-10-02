begin;
create function public.nr_notification_send(p_actor uuid,p_org uuid,p_id uuid,p_title text,p_message text) returns uuid language plpgsql security invoker set search_path='' as $$
declare existing public.nr_notifications;
begin
 if not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if p_title is null or length(trim(p_title)) not between 1 and 160 or p_message is null or length(trim(p_message)) not between 1 and 4000 then raise exception 'invalid_notification';end if;
 perform 1 from public.nr_organizations where id=p_org for update;
 if not found then raise exception 'organization_missing';end if;
 select * into existing from public.nr_notifications where id=p_id;
 if found then
  if existing.org_id<>p_org or existing.title<>trim(p_title) or existing.message<>trim(p_message) then raise exception 'idempotency_key_reused';end if;
  return existing.id;
 end if;
 insert into public.nr_notifications(id,org_id,title,message) values(p_id,p_org,trim(p_title),trim(p_message));
 insert into public.nr_audit(org_id,actor_id,action,entity_id) values(p_org,p_actor,'notification_sent',p_id);
 return p_id;
end $$;
create function public.nr_notification_read(p_actor uuid,p_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.nr_notifications n set read_at=coalesce(read_at,now()) where n.id=p_id and exists(select 1 from public.nr_members m where m.org_id=n.org_id and m.user_id=p_actor and m.role='owner' and m.active);
 if not found then raise exception 'access_denied';end if;
end $$;
revoke all on function public.nr_notification_send(uuid,uuid,uuid,text,text),public.nr_notification_read(uuid,uuid) from public,anon,authenticated;
grant execute on function public.nr_notification_send(uuid,uuid,uuid,text,text),public.nr_notification_read(uuid,uuid) to service_role;
commit;
