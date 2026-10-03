begin;
create function public.nr_payment_method_save(p_actor uuid,p_id text,p_status text,p_instructions text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.nr_admins where user_id=p_actor) then raise exception 'access_denied';end if;
 if p_status is null or p_status not in('active','disabled','soon') or p_instructions is null or length(trim(p_instructions)) not between 1 and 4000 then raise exception 'invalid_payment_method';end if;
 if p_id in('card','wakati') and p_status='active' then raise exception 'payment_integration_unavailable';end if;
 if p_id='bank' and p_status='active' and trim(p_instructions)='Coordonnées à configurer par MORA Shawiri.' then raise exception 'payment_instructions_required';end if;
 update public.nr_payment_methods set status=p_status,instructions=trim(p_instructions) where id=p_id;
 if not found then raise exception 'payment_method_unavailable';end if;
 insert into public.nr_audit(actor_id,action,details) values(p_actor,'payment_method_changed',jsonb_build_object('method',p_id,'status',p_status));
end $$;
revoke all on function public.nr_payment_method_save(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.nr_payment_method_save(uuid,text,text,text) to service_role;
commit;
