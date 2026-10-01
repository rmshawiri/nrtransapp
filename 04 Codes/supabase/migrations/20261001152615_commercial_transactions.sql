begin;
alter table public.nr_orders add column requested_promotion_code text not null default '';
create function public.nr_onboard(p_actor uuid,p_name text) returns uuid language plpgsql security invoker set search_path='' as $$
declare org uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
 select id into org from public.nr_organizations where owner_id=p_actor;
 if found then return org;end if;
 -- Existing invited members never get an implicit additional trial account.
 select org_id into org from public.nr_members where user_id=p_actor and active limit 1;
 if found then return org;end if;
 insert into public.nr_organizations(owner_id,name) values(p_actor,p_name) returning id into org;
 insert into public.nr_members values(org,p_actor,'owner',true,true);
 insert into public.nr_subscriptions(org_id,plan_id,starts_at,ends_at) values(org,'gratuit',now(),now()+interval '7 days');
 insert into public.nr_notifications(org_id,title,message) values(org,'Bienvenue dans NR-TRANS','Votre essai gratuit de 7 jours a commencé.');
 return org;
end $$;

create function public.nr_quote(p_org uuid,p_actor uuid,p_plan text,p_months integer,p_code text default '')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare base integer; discount integer=0; promo public.nr_promotions; uses integer; client_uses integer;
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 select amount into base from public.nr_prices join public.nr_plans on nr_plans.id=nr_prices.plan_id where plan_id=p_plan and months=p_months and active;
 if not found then raise exception 'invalid_offer';end if;
 if trim(coalesce(p_code,''))<>'' then
  select * into promo from public.nr_promotions where code=upper(trim(p_code)) for update;
  if not found or not promo.active or (promo.starts_at is not null and promo.starts_at>now()) or (promo.ends_at is not null and promo.ends_at<=now()) then raise exception 'invalid_promotion';end if;
  if (cardinality(promo.plans)>0 and not(p_plan=any(promo.plans))) or (cardinality(promo.months)>0 and not(p_months=any(promo.months))) or base<promo.minimum then raise exception 'promotion_not_applicable';end if;
  select count(*),count(*) filter(where org_id=p_org) into uses,client_uses from public.nr_orders where promotion_id=promo.id and status not in('cancelled','expired');
  if (promo.max_uses is not null and uses>=promo.max_uses) or (promo.max_per_client is not null and client_uses>=promo.max_per_client) then raise exception 'promotion_limit';end if;
  discount=least(base,case when promo.type='percent' then round(base*promo.value/100)::integer else round(promo.value)::integer end);
 end if;
 return jsonb_build_object('plan',p_plan,'months',p_months,'subtotal',base,'discount',discount,'total',base-discount,'promotionId',promo.id);
end $$;

create function public.nr_order_decide(p_actor uuid,p_order uuid,p_approve boolean,p_reason text default '')
returns jsonb language plpgsql security invoker set search_path='' set timezone='UTC' as $$
declare ord public.nr_orders; current_sub public.nr_subscriptions; start_at timestamptz; end_at timestamptz; policy text; automatic boolean;
begin
 select * into ord from public.nr_orders where id=p_order for update;
 if not found then raise exception 'order_missing';end if;
 automatic=ord.total=0 and p_approve and exists(select 1 from public.nr_members where org_id=ord.org_id and user_id=p_actor and role='owner' and active);
 if not automatic and not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if ord.status='approved' and p_approve then return jsonb_build_object('id',ord.id,'status','approved','replayed',true);end if;
 if ord.status not in('declared','reviewing') and not(automatic and ord.status='awaiting_payment') then raise exception 'invalid_transition';end if;
 -- Serializes simultaneous approvals/renewals for this organization.
 perform 1 from public.nr_organizations where id=ord.org_id for update;
 if not p_approve then
  if length(trim(p_reason))=0 then raise exception 'reason_required';end if;
  update public.nr_orders set status='rejected',reviewed_by=p_actor,reviewed_at=now() where id=p_order;
 else
  select * into current_sub from public.nr_subscriptions where org_id=ord.org_id and ends_at>now() order by ends_at desc limit 1;
  start_at=now();
  if found and current_sub.plan_id=ord.plan_id then start_at=current_sub.ends_at;
  elsif found and current_sub.plan_id<>'gratuit' then
   select plan_change into policy from public.nr_commercial_settings where id=true;
   if policy is distinct from 'at_expiry' then raise exception 'plan_change_policy_required';end if;
   start_at=current_sub.ends_at;
  end if;
  end_at=start_at+make_interval(months=>ord.months);
  insert into public.nr_subscriptions(org_id,plan_id,starts_at,ends_at,order_id) values(ord.org_id,ord.plan_id,start_at,end_at,ord.id);
  update public.nr_orders set status='approved',reviewed_by=p_actor,reviewed_at=now() where id=p_order;
 end if;
 insert into public.nr_audit(org_id,actor_id,action,entity_id,details) values(ord.org_id,p_actor,case when p_approve then 'payment_approved' else 'payment_rejected' end,p_order,jsonb_build_object('reason',left(p_reason,2000),'automatic',automatic));
 insert into public.nr_notifications(org_id,title,message) values(ord.org_id,case when p_approve then 'Abonnement validé' else 'Paiement refusé' end,case when p_approve then 'Votre commande '||ord.reference||' est validée.' else left(p_reason,2000) end);
 return jsonb_build_object('id',ord.id,'status',case when p_approve then 'approved' else 'rejected' end,'startsAt',start_at,'endsAt',end_at);
end $$;

create function public.nr_order_create(p_org uuid,p_actor uuid,p_plan text,p_months integer,p_code text,p_method text,p_key uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare ord public.nr_orders;q jsonb; instructions text; decision jsonb;
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 perform 1 from public.nr_organizations where id=p_org for update;
 select * into ord from public.nr_orders where org_id=p_org and idempotency_key=p_key;
 if found then
  if ord.plan_id<>p_plan or ord.months<>p_months or ord.method<>p_method or ord.requested_promotion_code<>upper(trim(coalesce(p_code,''))) then raise exception 'idempotency_key_reused';end if;
  select m.instructions into instructions from public.nr_payment_methods m where id=ord.method;
  return jsonb_build_object('id',ord.id,'reference',ord.reference,'total',ord.total,'status',ord.status,'instructions',instructions,'replayed',true);
 end if;
 select m.instructions into instructions from public.nr_payment_methods m where id=p_method and status='active';
 if not found then raise exception 'payment_method_unavailable';end if;
 q=public.nr_quote(p_org,p_actor,p_plan,p_months,p_code);
 insert into public.nr_orders(org_id,reference,plan_id,months,subtotal,discount,total,promotion_id,method,idempotency_key,requested_promotion_code)
 values(p_org,'NRT-'||to_char(now(),'YYYYMMDD')||'-'||upper(replace(gen_random_uuid()::text,'-','')),p_plan,p_months,(q->>'subtotal')::int,(q->>'discount')::int,(q->>'total')::int,(q->>'promotionId')::uuid,p_method,p_key,upper(trim(coalesce(p_code,'')))) returning * into ord;
 if ord.total=0 then decision=public.nr_order_decide(p_actor,ord.id,true,'Abonnement offert par code promotionnel');ord.status='approved';end if;
 insert into public.nr_audit(org_id,actor_id,action,entity_id) values(p_org,p_actor,'order_created',ord.id);
 return jsonb_build_object('id',ord.id,'reference',ord.reference,'total',ord.total,'status',ord.status,'instructions',instructions);
end $$;

create function public.nr_payment_declare(p_org uuid,p_actor uuid,p_order uuid,p_reference text,p_proof text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare ord public.nr_orders;
begin
 if not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 select * into ord from public.nr_orders where id=p_order and org_id=p_org for update;
 if not found then raise exception 'order_missing';end if;
 if ord.status not in('awaiting_payment','rejected','declared') then raise exception 'invalid_transition';end if;
 if p_proof is not null and p_proof not like p_org::text||'/'||p_order::text||'/%' then raise exception 'invalid_proof';end if;
 insert into public.nr_payments(order_id,org_id,reference,proof_path) values(p_order,p_org,p_reference,p_proof)
 on conflict(order_id) do update set reference=excluded.reference,proof_path=excluded.proof_path,created_at=now();
 update public.nr_orders set status='declared' where id=p_order;
 insert into public.nr_audit(org_id,actor_id,action,entity_id) values(p_org,p_actor,'payment_declared',p_order);
 return jsonb_build_object('status','declared');
end $$;

do $$ declare signature regprocedure; begin
 for signature in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('nr_onboard','nr_quote','nr_order_create','nr_order_decide','nr_payment_declare') loop
 execute format('revoke all on function %s from public,anon,authenticated',signature);
 execute format('grant execute on function %s to service_role',signature);
 end loop;
end $$;
commit;
