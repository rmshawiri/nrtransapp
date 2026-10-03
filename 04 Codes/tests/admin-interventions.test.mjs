import test from 'node:test';import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';import {initialState} from '../server/platform.mjs';
const millis=value=>new Date(value).getTime();
test('administrative interventions preserve history and enforce suspension',async t=>{
 const remote=process.env.NR_TEST_REMOTE==='1',db=remote?await(await import('../scripts/remote-test-database.mjs')).remoteTestDatabase():new PGlite();const [owner,other,admin,org,request]=Array.from({length:5},()=>crypto.randomUUID());
 try{
 if(!remote){await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");const dir=new URL('../supabase/migrations/',import.meta.url);for(const file of(await readdir(dir)).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));}
 await db.query('insert into auth.users(id) values($1),($2),($3)',[owner,other,admin]);await db.query('insert into nr_admins(user_id) values($1)',[admin]);await db.query("insert into nr_organizations(id,owner_id,name) values($1,$2,'Admin fixture')",[org,owner]);await db.query("insert into nr_members values($1,$2,'owner',true,true)",[org,owner]);await db.query("insert into nr_subscriptions(org_id,plan_id,starts_at,ends_at) values($1,'gratuit',now()-interval '1 day',now()+interval '6 days')",[org]);
 const rpc=async(sql,args)=>{await db.exec('set role service_role');try{return(await db.query(sql,args)).rows[0]?.result;}finally{await db.exec('reset role');}};
 const intervene=(action,data,id=crypto.randomUUID(),actor=admin,reason='Correction administrative de recette')=>rpc('select nr_admin_intervene($1,$2,$3,$4,$5,$6) result',[actor,org,id,action,data,reason]);
 const state=initialState(org);await rpc('select nr_sync_apply($1,$2,$3,$4,0,$5) result',[org,owner,crypto.randomUUID(),'initial',state]);const original=(await db.query('select * from nr_subscriptions where org_id=$1',[org])).rows[0];
 await t.test('server rejects non-admin, malformed input and direct browser RPC',async()=>{
  await assert.rejects(()=>intervene('write_status',{suspended:true},crypto.randomUUID(),owner),/access_denied/);await assert.rejects(()=>intervene('write_status',{suspended:true},crypto.randomUUID(),other),/access_denied/);
  await assert.rejects(()=>intervene('subscription',{plan:'vip',months:2}),/invalid_intervention/);await assert.rejects(()=>intervene('write_status',{suspended:'true'}),/invalid_intervention/);await assert.rejects(()=>intervene('write_status',{suspended:true},crypto.randomUUID(),admin,'x'),/invalid_intervention/);
  for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(()=>db.query("select nr_admin_intervene($1,$2,$3,'write_status','{}','reason')",[admin,org,request]),/permission denied/);}finally{await db.exec('reset role');}}
 });
 let added;
 await t.test('period appended without truncating acquired history; audit and replay',async()=>{
  added=await intervene('subscription',{plan:'avance',months:1},request);assert.equal(millis(added.startsAt),millis(original.ends_at));assert.equal((await intervene('subscription',{plan:'avance',months:1},request)).replayed,true);
  await assert.rejects(()=>intervene('subscription',{plan:'avance',months:3},request),/idempotency_key_reused/);
  const history=(await db.query('select * from nr_subscriptions where org_id=$1',[org])).rows;assert.equal(history.length,2);assert.equal(millis(history.find(s=>s.id===original.id).ends_at),millis(original.ends_at));
  const audits=(await db.query('select * from nr_audit where entity_id=$1',[request])).rows;assert.equal(audits.length,1);assert.equal(audits[0].actor_id,admin);assert.ok(audits[0].created_at);assert.ok(audits[0].details.request.reason);assert.equal(audits[0].details.result.subscriptionId,added.subscriptionId);
 });
 await t.test('plan change requires the configured policy; no invented prorata',async()=>{
  await rpc('select nr_admin_configure($1,$2)',[admin,{planChange:null}]);await assert.rejects(()=>intervene('subscription',{plan:'vip',months:1}),/plan_change_policy_required/);
  await rpc('select nr_admin_configure($1,$2)',[admin,{planChange:'at_expiry'}]);const vip=await intervene('subscription',{plan:'vip',months:1});assert.equal(millis(vip.startsAt),millis(added.endsAt));
 });
 await t.test('suspension atomically blocks writes, preserves reads, dates and records; restoration works',async()=>{
  const before=(await db.query('select payload from nr_records where org_id=$1 order by id',[org])).rows;
  const id=crypto.randomUUID();const result=await intervene('write_status',{suspended:true},id);assert.equal(result.before,false);assert.equal(result.after,true);assert.equal((await intervene('write_status',{suspended:true},id)).replayed,true);
  const changed=structuredClone(state);changed.vehicles[0].name='must not persist';await assert.rejects(()=>rpc('select nr_sync_apply($1,$2,$3,$4,1,$5) result',[org,owner,crypto.randomUUID(),'suspended',changed]),/account_suspended/);
  assert.deepEqual((await db.query('select payload from nr_records where org_id=$1 order by id',[org])).rows,before);
  await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);try{assert.ok((await db.query('select nr_snapshot($1) s',[org])).rows[0].s);}finally{await db.exec('reset role');}
  assert.equal(millis((await db.query('select ends_at from nr_subscriptions where id=$1',[original.id])).rows[0].ends_at),millis(original.ends_at));
  await intervene('write_status',{suspended:false});assert.equal((await rpc('select nr_sync_apply($1,$2,$3,$4,1,$5) result',[org,owner,crypto.randomUUID(),'restored',state])).version,2);
 });
 await t.test('existing order, promotion, renewal and lifecycle rules remain operational',async()=>{
  const code='ADMIN'+crypto.randomUUID().replaceAll('-','');await rpc('select nr_promotion_save($1,$2) result',[admin,{name:'Fixture',code,type:'fixed',value:500,active:true,plans:[],months:[]}]);const latest=(await db.query('select max(ends_at) d from nr_subscriptions where org_id=$1',[org])).rows[0].d;
  const order=await rpc("select nr_order_create($1,$2,'vip',1,$3,'cash',$4) result",[org,owner,code,crypto.randomUUID()]);assert.equal(order.total,4500);await rpc('select nr_payment_declare($1,$2,$3,$4,null) result',[org,owner,order.id,'Fixture']);const decision=await rpc('select nr_order_decide($1,$2,true,$3) result',[admin,order.id,'Verification']);assert.equal(millis(decision.startsAt),millis(latest));assert.equal((await rpc('select nr_order_decide($1,$2,true,$3) result',[admin,order.id,'Verification'])).replayed,true);assert.equal(await rpc('select nr_subscription_notices($1,$2) result',[owner,org]),0);
 });
 }finally{await db.close();}
});
