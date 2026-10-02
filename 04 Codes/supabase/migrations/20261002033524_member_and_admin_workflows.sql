begin;
alter table public.nr_plans add column secondary_users_unlimited boolean not null default false;
alter table public.nr_plans add check(not(secondary_users_unlimited and secondary_user_limit is not null));
create table public.nr_invitations(
 id uuid primary key default gen_random_uuid(),org_id uuid not null references public.nr_organizations(id),
 email text not null check(email=lower(trim(email))),token uuid not null unique default gen_random_uuid(),
 all_vehicles boolean not null default false,vehicle_ids uuid[] not null default '{}',
 status text not null default 'pending' check(status in('pending','accepted','cancelled')),
 created_by uuid not null references auth.users(id),accepted_by uuid references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days',created_at timestamptz not null default now()
);
create index nr_invitations_org on public.nr_invitations(org_id,status);
create unique index nr_pending_invitation on public.nr_invitations(org_id,email) where status='pending';
alter table public.nr_invitations enable row level security;
revoke all on public.nr_invitations from public,anon,authenticated;
grant select on public.nr_invitations to authenticated;
grant all on public.nr_invitations to service_role;
create policy invitations_owner on public.nr_invitations for select to authenticated using(nr_private.is_owner(org_id));
grant select(id,email,email_confirmed_at) on auth.users to service_role;

create function nr_private.member_capacity(p_org uuid,p_user uuid default null,p_invitation uuid default null) returns void language plpgsql security invoker set search_path='' as $$
declare allowance integer; unlimited boolean; occupied integer;
begin
 select p.secondary_user_limit,p.secondary_users_unlimited into allowance,unlimited from public.nr_subscriptions s join public.nr_plans p on p.id=s.plan_id
 where s.org_id=p_org and s.starts_at<=now() and s.ends_at>now() order by s.starts_at desc limit 1;
 if not found then raise exception 'subscription_expired';end if;
 if unlimited then return;end if;
 if allowance is null then raise exception 'secondary_user_policy_required';end if;
 select (select count(*) from public.nr_members where org_id=p_org and role='viewer' and active and user_id is distinct from p_user)
 +(select count(*) from public.nr_invitations where org_id=p_org and status='pending' and expires_at>now() and id is distinct from p_invitation) into occupied;
 if occupied>=allowance then raise exception 'secondary_user_limit';end if;
end $$;
revoke all on function nr_private.member_capacity(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function nr_private.member_capacity(uuid,uuid,uuid) to service_role;

create function public.nr_invitation_create(p_org uuid,p_actor uuid,p_email text,p_all boolean,p_vehicles uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare invitation public.nr_invitations; email_normal text=lower(trim(p_email));
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 perform 1 from public.nr_organizations where id=p_org for update;
 if email_normal !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email';end if;
 if exists(select 1 from unnest(p_vehicles) v where not exists(select 1 from public.nr_records where org_id=p_org and id=v and kind='vehicles' and deleted_at is null)) then raise exception 'invalid_vehicle_scope';end if;
 select * into invitation from public.nr_invitations where org_id=p_org and email=email_normal and status='pending';
 if found and invitation.expires_at>now() then return to_jsonb(invitation);end if;
 if found then update public.nr_invitations set status='cancelled' where id=invitation.id;end if;
 perform nr_private.member_capacity(p_org);
 insert into public.nr_invitations(org_id,email,all_vehicles,vehicle_ids,created_by) values(p_org,email_normal,p_all,coalesce(p_vehicles,'{}'),p_actor) returning * into invitation;
 insert into public.nr_audit(org_id,actor_id,action,entity_id) values(p_org,p_actor,'member_invited',invitation.id);
 return to_jsonb(invitation);
end $$;

create function public.nr_invitation_cancel(p_org uuid,p_actor uuid,p_invitation uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 perform 1 from public.nr_organizations where id=p_org for update;
 update public.nr_invitations set status='cancelled' where id=p_invitation and org_id=p_org and status='pending';
 if found then insert into public.nr_audit(org_id,actor_id,action,entity_id) values(p_org,p_actor,'invitation_cancelled',p_invitation);end if;
end $$;

create function public.nr_invitation_accept(p_actor uuid,p_token uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation public.nr_invitations; target uuid; verified_email text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
 select org_id into target from public.nr_invitations where token=p_token;
 if not found then raise exception 'invitation_invalid';end if;
 perform 1 from public.nr_organizations where id=target for update;
 select * into invitation from public.nr_invitations where token=p_token for update;
 if invitation.status='accepted' and invitation.accepted_by=p_actor then return target;end if;
 if invitation.status<>'pending' or invitation.expires_at<=now() then raise exception 'invitation_invalid';end if;
 select lower(email) into verified_email from auth.users where id=p_actor and email_confirmed_at is not null;
 if verified_email is distinct from invitation.email then raise exception 'invitation_email_mismatch';end if;
 if exists(select 1 from public.nr_members where user_id=p_actor and org_id<>target) then raise exception 'account_already_attached';end if;
 if exists(select 1 from public.nr_members where user_id=p_actor and org_id=target and role='owner') then raise exception 'access_denied';end if;
 perform nr_private.member_capacity(target,p_actor,invitation.id);
 insert into public.nr_members values(target,p_actor,'viewer',invitation.all_vehicles,true)
 on conflict(org_id,user_id) do update set role='viewer',all_vehicles=excluded.all_vehicles,active=true;
 delete from public.nr_member_vehicles where org_id=target and user_id=p_actor;
 insert into public.nr_member_vehicles select distinct target,p_actor,v from unnest(invitation.vehicle_ids) v join public.nr_records r on r.org_id=target and r.id=v and r.kind='vehicles' and r.deleted_at is null;
 update public.nr_invitations set status='accepted',accepted_by=p_actor where id=invitation.id;
 insert into public.nr_audit(org_id,actor_id,action,entity_id) values(target,p_actor,'invitation_accepted',invitation.id);
 return target;
end $$;

create function public.nr_member_change(p_org uuid,p_actor uuid,p_user uuid,p_active boolean,p_all boolean,p_vehicles uuid[]) returns void language plpgsql security invoker set search_path='' as $$
declare member public.nr_members;
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 perform 1 from public.nr_organizations where id=p_org for update;
 select * into member from public.nr_members where org_id=p_org and user_id=p_user and role='viewer';
 if not found then raise exception 'member_missing';end if;
 if p_active and not member.active then perform nr_private.member_capacity(p_org,p_user);end if;
 if exists(select 1 from unnest(p_vehicles) v where not exists(select 1 from public.nr_records where org_id=p_org and id=v and kind='vehicles' and deleted_at is null)) then raise exception 'invalid_vehicle_scope';end if;
 update public.nr_members set active=p_active,all_vehicles=p_all where org_id=p_org and user_id=p_user;
 delete from public.nr_member_vehicles where org_id=p_org and user_id=p_user;
 insert into public.nr_member_vehicles select distinct p_org,p_user,v from unnest(coalesce(p_vehicles,'{}')) v;
 insert into public.nr_audit(org_id,actor_id,action,entity_id,details) values(p_org,p_actor,'member_access_changed',p_user,jsonb_build_object('active',p_active,'allVehicles',p_all));
end $$;

-- Revoking a member must not silently open a new trial organization on the next request.
create or replace function public.nr_onboard(p_actor uuid,p_name text) returns uuid language plpgsql security invoker set search_path='' as $$
declare org uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
 select id into org from public.nr_organizations where owner_id=p_actor;
 if found then return org;end if;
 select org_id into org from public.nr_members where user_id=p_actor order by active desc limit 1;
 if found then return org;end if;
 insert into public.nr_organizations(owner_id,name) values(p_actor,p_name) returning id into org;
 insert into public.nr_members values(org,p_actor,'owner',true,true);
 insert into public.nr_subscriptions(org_id,plan_id,starts_at,ends_at) values(org,'gratuit',now(),now()+interval '7 days');
 insert into public.nr_notifications(org_id,title,message) values(org,'Bienvenue dans NR-TRANS','Votre essai gratuit de 7 jours a commencé.');
 return org;
end $$;

create function public.nr_admin_configure(p_actor uuid,p_data jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare plan jsonb; unlimited boolean; allowance integer; policy text;
begin
 if not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if p_data ? 'planChange' then
  policy=p_data->>'planChange';if policy is not null and policy<>'at_expiry' then raise exception 'invalid_policy';end if;
  update public.nr_commercial_settings set plan_change=policy where id=true;
 end if;
 for plan in select * from jsonb_array_elements(coalesce(p_data->'plans','[]')) loop
  unlimited=coalesce((plan->>'unlimited')::boolean,false);allowance=case when unlimited then null else (plan->>'limit')::integer end;
  if allowance<0 or allowance>10000 then raise exception 'invalid_limit';end if;
  update public.nr_plans set secondary_user_limit=allowance,secondary_users_unlimited=unlimited where id=plan->>'id';
  if not found then raise exception 'invalid_offer';end if;
 end loop;
 insert into public.nr_audit(actor_id,action,details) values(p_actor,'commercial_settings_changed',p_data);
end $$;

create function public.nr_promotion_save(p_actor uuid,p_data jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare promo uuid=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());
begin
 if not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if p_data->>'type' not in('fixed','percent') or length(trim(p_data->>'name'))=0 then raise exception 'invalid_promotion';end if;
 insert into public.nr_promotions(id,code,name,type,value,active,starts_at,ends_at,max_uses,max_per_client,plans,months,minimum)
 values(promo,upper(trim(p_data->>'code')),p_data->>'name',p_data->>'type',(p_data->>'value')::numeric,coalesce((p_data->>'active')::boolean,true),nullif(p_data->>'startsAt','')::timestamptz,nullif(p_data->>'endsAt','')::timestamptz,(p_data->>'maxUses')::integer,(p_data->>'maxPerClient')::integer,
 array(select jsonb_array_elements_text(coalesce(p_data->'plans','[]'))),array(select jsonb_array_elements_text(coalesce(p_data->'months','[]'))::integer),coalesce((p_data->>'minimum')::integer,0))
 on conflict(id) do update set code=excluded.code,name=excluded.name,type=excluded.type,value=excluded.value,active=excluded.active,starts_at=excluded.starts_at,ends_at=excluded.ends_at,max_uses=excluded.max_uses,max_per_client=excluded.max_per_client,plans=excluded.plans,months=excluded.months,minimum=excluded.minimum;
 insert into public.nr_audit(actor_id,action,entity_id) values(p_actor,'promotion_saved',promo);
 return promo;
end $$;

create function public.nr_review_moderate(p_actor uuid,p_review uuid,p_status text) returns void language plpgsql security invoker set search_path='' as $$
declare org uuid;
begin
 if not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if p_status not in('approved','rejected','hidden') then raise exception 'invalid_transition';end if;
 update public.nr_reviews set status=p_status where id=p_review returning org_id into org;
 if not found then raise exception 'review_missing';end if;
 insert into public.nr_audit(org_id,actor_id,action,entity_id,details) values(org,p_actor,'review_moderated',p_review,jsonb_build_object('status',p_status));
end $$;

do $$ declare signature regprocedure;begin
 for signature in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('nr_invitation_create','nr_invitation_cancel','nr_invitation_accept','nr_member_change','nr_admin_configure','nr_promotion_save','nr_review_moderate') loop
 execute format('revoke all on function %s from public,anon,authenticated',signature);
 execute format('grant execute on function %s to service_role',signature);
 end loop;
end $$;
commit;
