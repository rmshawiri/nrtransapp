-- NR-TRANS v2. Additive migration. Never drops existing schemas or user data.
begin;
create schema if not exists nr_private;
revoke all on schema nr_private from public;
grant usage on schema nr_private to authenticated, service_role;

create table public.nr_profiles (
 id uuid primary key references auth.users(id), display_name text not null default '',
 phone text not null default '', created_at timestamptz not null default now()
);
create table public.nr_admins (user_id uuid primary key references auth.users(id), created_at timestamptz not null default now());
create table public.nr_organizations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id),
 name text not null check(length(name) between 1 and 160), settings jsonb not null default '{}',
 version bigint not null default 0 check(version>=0), created_at timestamptz not null default now()
);
create table public.nr_members (
 org_id uuid not null references public.nr_organizations(id), user_id uuid not null references auth.users(id),
 role text not null check(role in ('owner','viewer')), all_vehicles boolean not null default false,
 active boolean not null default true, primary key(org_id,user_id)
);
-- Financial sources are stored once, as versioned typed records. Payload preserves historical terms.
create table public.nr_records (
 org_id uuid not null references public.nr_organizations(id), id uuid not null,
 kind text not null check(kind in ('vehicles','drivers','owners','days','expenses','maintenance','loans','loanPayments','wages','driverPayments','movements')),
 vehicle_id uuid, driver_id uuid, loan_id uuid, owner_id uuid,
 occurred_on date, payload jsonb not null check(jsonb_typeof(payload)='object'),
 version bigint not null check(version>0), deleted_at timestamptz,
 primary key(org_id,id), unique(org_id,kind,id),
 check(payload->>'id'=id::text),
 foreign key(org_id,vehicle_id) references public.nr_records(org_id,id) deferrable initially deferred,
 foreign key(org_id,driver_id) references public.nr_records(org_id,id) deferrable initially deferred,
 foreign key(org_id,loan_id) references public.nr_records(org_id,id) deferrable initially deferred,
 foreign key(org_id,owner_id) references public.nr_records(org_id,id) deferrable initially deferred
);
create index nr_records_org_kind on public.nr_records(org_id,kind) where deleted_at is null;
create index nr_records_vehicle on public.nr_records(org_id,vehicle_id) where deleted_at is null;
create unique index nr_one_day_per_vehicle on public.nr_records(org_id,vehicle_id,occurred_on) where kind='days' and deleted_at is null;
create table public.nr_loan_allocations (
 org_id uuid not null, id uuid not null, loan_id uuid not null, vehicle_id uuid not null,
 amount numeric(16,2) not null check(amount>=0), primary key(org_id,id), unique(org_id,loan_id,vehicle_id),
 foreign key(org_id,loan_id) references public.nr_records(org_id,id) deferrable initially deferred,
 foreign key(org_id,vehicle_id) references public.nr_records(org_id,id) deferrable initially deferred
);
create table public.nr_member_vehicles (
 org_id uuid not null, user_id uuid not null, vehicle_id uuid not null, primary key(org_id,user_id,vehicle_id),
 foreign key(org_id,user_id) references public.nr_members(org_id,user_id),
 foreign key(org_id,vehicle_id) references public.nr_records(org_id,id)
);
create table public.nr_plans (
 id text primary key check(id in ('gratuit','avance','vip')), vehicle_limit integer check(vehicle_limit>0),
 secondary_user_limit integer check(secondary_user_limit>=0), active boolean not null default true
);
insert into public.nr_plans(id,vehicle_limit) values ('gratuit',1),('avance',1),('vip',null);
create table public.nr_prices (
 plan_id text not null references public.nr_plans(id), months integer not null check(months in(1,3,6,12)),
 amount integer not null check(amount>=0),primary key(plan_id,months)
);
insert into public.nr_prices values ('avance',1,2500),('avance',3,6000),('avance',6,12000),('avance',12,18000),('vip',1,5000),('vip',3,13500),('vip',6,27000),('vip',12,48000);
create table public.nr_subscriptions (
 id uuid primary key default gen_random_uuid(),org_id uuid not null references public.nr_organizations(id),
 plan_id text not null references public.nr_plans(id),starts_at timestamptz not null,ends_at timestamptz not null,
 order_id uuid unique,check(ends_at>starts_at)
);
create index nr_subscriptions_org_period on public.nr_subscriptions(org_id,ends_at);
create unique index nr_one_trial on public.nr_subscriptions(org_id) where plan_id='gratuit';
create table public.nr_payment_methods (
 id text primary key,name text not null,status text not null check(status in('active','soon','disabled')),instructions text not null
);
insert into public.nr_payment_methods values
 ('mvola','MVOLA','active','430 63 06 — Mohamed Rachade. Indiquez la référence de votre commande.'),
 ('holo','HOLO','active','430 63 06 — Rachade Houmaydat Mohamed. Indiquez la référence de votre commande.'),
 ('wakati','WAKATI','soon','351 63 06 — Mohamed Rachade. Bientôt disponible.'),
 ('bank','Virement bancaire','disabled','Coordonnées à configurer par MORA Shawiri.'),
 ('cheque','Chèque','active','Contactez MORA Shawiri au +269 430 63 06 avant de remettre votre chèque.'),
 ('cash','Espèces','active','Remise auprès de MORA Shawiri, Moroni Oasis, route les puffins. Demandez votre reçu.'),
 ('paypal','PayPal','active','morapro.entrepreneur@gmail.com — Vérification manuelle de la transaction.'),
 ('card','Carte bancaire','soon','Prochainement.');
create table public.nr_promotions (
 id uuid primary key default gen_random_uuid(),code text not null unique check(code=upper(code) and length(code) between 3 and 50),name text not null,
 type text not null check(type in('fixed','percent')),value numeric(12,2) not null check(value>=0),active boolean not null default true,
 starts_at timestamptz,ends_at timestamptz,max_uses integer check(max_uses>=0),max_per_client integer check(max_per_client>=0),
 plans text[] not null default '{}',months integer[] not null default '{}',minimum integer not null default 0 check(minimum>=0),
 check(type<>'percent' or value<=100),check(ends_at is null or starts_at is null or ends_at>starts_at)
);
create table public.nr_orders (
 id uuid primary key default gen_random_uuid(),org_id uuid not null references public.nr_organizations(id),
 reference text not null unique,plan_id text not null,months integer not null,subtotal integer not null check(subtotal>=0),
 discount integer not null check(discount>=0 and discount<=subtotal),total integer not null check(total=subtotal-discount),
 promotion_id uuid references public.nr_promotions(id),method text not null references public.nr_payment_methods(id),
 status text not null default 'awaiting_payment' check(status in('awaiting_payment','declared','reviewing','approved','rejected','cancelled','expired')),
 idempotency_key uuid not null,created_at timestamptz not null default now(),reviewed_by uuid references auth.users(id),reviewed_at timestamptz,
 unique(org_id,idempotency_key),foreign key(plan_id,months) references public.nr_prices(plan_id,months)
);
alter table public.nr_subscriptions add foreign key(order_id) references public.nr_orders(id);
create table public.nr_payments (
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.nr_orders(id),
 org_id uuid not null references public.nr_organizations(id),reference text not null check(length(reference) between 1 and 160),
 proof_path text,created_at timestamptz not null default now()
);
create table public.nr_reviews (
 id uuid primary key default gen_random_uuid(),org_id uuid not null unique references public.nr_organizations(id),
 author_name text not null,rating integer not null check(rating between 1 and 5),comment text not null check(length(comment) between 1 and 2000),
 status text not null default 'pending' check(status in('pending','approved','rejected','hidden')),created_at timestamptz not null default now()
);
create table public.nr_notifications (
 id uuid primary key default gen_random_uuid(),org_id uuid not null references public.nr_organizations(id),
 title text not null,message text not null,read_at timestamptz,created_at timestamptz not null default now()
);
create table public.nr_audit (
 id bigint generated always as identity primary key,org_id uuid references public.nr_organizations(id),actor_id uuid references auth.users(id),
 action text not null,entity_id uuid,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create table public.nr_sync_receipts (
 org_id uuid not null references public.nr_organizations(id),mutation_id uuid not null,
 actor_id uuid not null references auth.users(id),request_hash text not null,version bigint not null,
 created_at timestamptz not null default now(),primary key(org_id,mutation_id)
);
create table public.nr_commercial_settings (id boolean primary key default true check(id),plan_change text check(plan_change in('at_expiry')),updated_at timestamptz not null default now());
insert into public.nr_commercial_settings(id) values(true);

-- Helpers live outside the exposed API schema, with fixed search_path and explicit identity checks.
create function nr_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.nr_admins where user_id=auth.uid())
$$;
create function nr_private.is_owner(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.nr_members where org_id=org and user_id=auth.uid() and role='owner' and active)
$$;
create function nr_private.can_read_vehicle(org uuid,vehicle uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.nr_members m where m.org_id=org and m.user_id=auth.uid() and m.active and
 (m.role='owner' or m.all_vehicles or (vehicle is not null and exists(select 1 from public.nr_member_vehicles v where v.org_id=org and v.user_id=auth.uid() and v.vehicle_id=vehicle))))
$$;
create function nr_private.can_read_record(org uuid,record uuid,record_kind text,vehicle uuid,driver uuid,loan uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 nr_private.can_read_vehicle(org,case when record_kind='vehicles' then record else vehicle end)
 or (record_kind='drivers' and exists(select 1 from public.nr_records d where d.org_id=org and d.driver_id=record and d.deleted_at is null and nr_private.can_read_vehicle(org,d.vehicle_id)))
 or (record_kind in('loans','loanPayments') and exists(select 1 from public.nr_loan_allocations a where a.org_id=org and a.loan_id=case when record_kind='loans' then record else loan end)
 and not exists(select 1 from public.nr_loan_allocations a where a.org_id=org and a.loan_id=case when record_kind='loans' then record else loan end and not nr_private.can_read_vehicle(org,a.vehicle_id))))
$$;
revoke all on all functions in schema nr_private from public;
grant execute on all functions in schema nr_private to authenticated,service_role;

do $$ declare t text; begin
 foreach t in array array['nr_profiles','nr_admins','nr_organizations','nr_members','nr_records','nr_loan_allocations','nr_member_vehicles','nr_plans','nr_prices','nr_subscriptions','nr_payment_methods','nr_promotions','nr_orders','nr_payments','nr_reviews','nr_notifications','nr_audit','nr_sync_receipts','nr_commercial_settings'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.nr_audit_id_seq to service_role;
grant select on public.nr_plans,public.nr_prices,public.nr_payment_methods to anon;
create policy own_profile on public.nr_profiles for select to authenticated using(id=auth.uid() or nr_private.is_admin());
create policy self_admin on public.nr_admins for select to authenticated using(user_id=auth.uid());
create policy own_org on public.nr_organizations for select to authenticated using(nr_private.can_read_vehicle(id,null) or nr_private.is_owner(id));
create policy own_members on public.nr_members for select to authenticated using(user_id=auth.uid() or nr_private.is_owner(org_id));
create policy fleet_scope on public.nr_records for select to authenticated using(deleted_at is null and nr_private.can_read_record(org_id,id,kind,vehicle_id,driver_id,loan_id));
create policy allocation_scope on public.nr_loan_allocations for select to authenticated using(nr_private.can_read_vehicle(org_id,vehicle_id));
create policy member_vehicle_scope on public.nr_member_vehicles for select to authenticated using(user_id=auth.uid() or nr_private.is_owner(org_id));
create policy public_plans on public.nr_plans for select to anon,authenticated using(active);
create policy public_prices on public.nr_prices for select to anon,authenticated using(true);
create policy public_methods on public.nr_payment_methods for select to anon,authenticated using(status<>'disabled');
create policy commercial_subscriptions on public.nr_subscriptions for select to authenticated using(nr_private.is_owner(org_id) or nr_private.is_admin());
create policy commercial_orders on public.nr_orders for select to authenticated using(nr_private.is_owner(org_id) or nr_private.is_admin());
create policy commercial_payments on public.nr_payments for select to authenticated using(nr_private.is_owner(org_id) or nr_private.is_admin());
create policy promotions_admin on public.nr_promotions for select to authenticated using(nr_private.is_admin());
create policy private_reviews on public.nr_reviews for select to authenticated using(nr_private.is_owner(org_id) or nr_private.is_admin());
create policy own_notifications on public.nr_notifications for select to authenticated using(nr_private.is_owner(org_id));
create policy audit_admin on public.nr_audit for select to authenticated using(nr_private.is_admin());
create policy own_receipts on public.nr_sync_receipts for select to authenticated using(nr_private.is_owner(org_id));
create policy settings_admin on public.nr_commercial_settings for select to authenticated using(nr_private.is_admin());
-- No browser role has INSERT/UPDATE/DELETE rights. Mutations pass through the authenticated server.

create function public.nr_sync_apply(p_org uuid,p_actor uuid,p_mutation uuid,p_hash text,p_expected bigint,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare org public.nr_organizations; receipt public.nr_sync_receipts; current_plan text; vehicle_limit integer; k text; record jsonb; seen uuid[]='{}'; next_version bigint;
begin
 select * into org from public.nr_organizations where id=p_org for update;
 if not found or not exists(select 1 from public.nr_members where org_id=p_org and user_id=p_actor and role='owner' and active) then raise exception 'access_denied';end if;
 select * into receipt from public.nr_sync_receipts where org_id=p_org and mutation_id=p_mutation;
 if found then
  if receipt.request_hash<>p_hash or receipt.actor_id<>p_actor then raise exception 'idempotency_key_reused';end if;
  return jsonb_build_object('version',receipt.version,'replayed',true);
 end if;
 if org.version<>p_expected then return jsonb_build_object('conflict',true,'version',org.version);end if;
 select s.plan_id into current_plan from public.nr_subscriptions s where s.org_id=p_org and s.starts_at<=now() and s.ends_at>now() order by s.starts_at desc limit 1;
 if current_plan is null then raise exception 'subscription_expired';end if;
 select p.vehicle_limit into vehicle_limit from public.nr_plans p where p.id=current_plan;
 if vehicle_limit is not null and (select count(*) from jsonb_array_elements(p_state->'vehicles') v where not exists(select 1 from public.nr_records r where r.org_id=p_org and r.id=(v->>'id')::uuid and r.kind='vehicles' and r.deleted_at is null))>0
 and jsonb_array_length(p_state->'vehicles')>vehicle_limit then raise exception 'upgrade_required';end if;
 if (p_state->>'schemaVersion')::integer<>2 or coalesce((p_state->>'demo')::boolean,true) then raise exception 'invalid_state';end if;
 next_version=org.version+1;
 -- Tombstone first avoids uniqueness collisions during a validated full import.
 update public.nr_records set deleted_at=now(),version=next_version where org_id=p_org and deleted_at is null;
 foreach k in array array['vehicles','drivers','owners','days','expenses','maintenance','loans','loanPayments','wages','driverPayments','movements'] loop
  for record in select * from jsonb_array_elements(p_state->k) loop
   if (record->>'id')::uuid=any(seen) then raise exception 'duplicate_record_id';end if;
   seen=array_append(seen,(record->>'id')::uuid);
   insert into public.nr_records(org_id,id,kind,vehicle_id,driver_id,loan_id,owner_id,occurred_on,payload,version,deleted_at)
   values(p_org,(record->>'id')::uuid,k,nullif(record->>'vehicleId','')::uuid,nullif(record->>'driverId','')::uuid,nullif(record->>'loanId','')::uuid,nullif(record->>'ownerId','')::uuid,nullif(record->>'date','')::date,record,next_version,null)
   on conflict(org_id,id) do update set kind=excluded.kind,vehicle_id=excluded.vehicle_id,driver_id=excluded.driver_id,loan_id=excluded.loan_id,owner_id=excluded.owner_id,occurred_on=excluded.occurred_on,payload=excluded.payload,version=excluded.version,deleted_at=null;
  end loop;
 end loop;
 delete from public.nr_loan_allocations where org_id=p_org;
 insert into public.nr_loan_allocations(org_id,id,loan_id,vehicle_id,amount)
 select p_org,(x->>'id')::uuid,(x->>'loanId')::uuid,(x->>'vehicleId')::uuid,(x->>'amount')::numeric from jsonb_array_elements(p_state->'loanVehicles') x;
 update public.nr_organizations set version=next_version,settings=p_state->'settings' where id=p_org;
 insert into public.nr_sync_receipts values(p_org,p_mutation,p_actor,p_hash,next_version,now());
 return jsonb_build_object('version',next_version,'replayed',false);
end $$;
revoke all on function public.nr_sync_apply(uuid,uuid,uuid,text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.nr_sync_apply(uuid,uuid,uuid,text,bigint,jsonb) to service_role;
commit;
