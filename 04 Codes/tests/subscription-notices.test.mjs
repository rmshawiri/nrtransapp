import test from 'node:test';import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('subscription lifecycle notices: isolation, renewal, expiry and idempotence',async t=>{
 const remote=process.env.NR_TEST_REMOTE==='1',db=remote?await(await import('../scripts/remote-test-database.mjs')).remoteTestDatabase():new PGlite();
 const [owner,other,reader,org,sub,record]=Array.from({length:6},()=>crypto.randomUUID());
 try{
  if(!remote){await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");const dir=new URL('../supabase/migrations/',import.meta.url);for(const file of(await readdir(dir)).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));}
  await db.query('insert into auth.users(id) values($1),($2),($3)',[owner,other,reader]);
  await db.query("insert into nr_organizations(id,owner_id,name) values($1,$2,'Lifecycle fixture')",[org,owner]);
  await db.query("insert into nr_members values($1,$2,'owner',true,true),($1,$3,'viewer',true,true)",[org,owner,reader]);
  await db.query("insert into nr_records(org_id,id,kind,payload,version) values($1,$2,'vehicles',$3,1)",[org,record,{id:record}]);
  await db.query("insert into nr_subscriptions(id,org_id,plan_id,starts_at,ends_at) values($1,$2,'gratuit',now()-interval '1 day',now()+interval '6 days')",[sub,org]);
  const run=async(actor=owner)=>{await db.exec('set role service_role');try{return(await db.query('select nr_subscription_notices($1,$2) n',[actor,org])).rows[0].n;}finally{await db.exec('reset role');}};
  await t.test('owner only, direct anonymous/authenticated execution denied',async()=>{
   await assert.rejects(()=>run(other),/access_denied/);await assert.rejects(()=>run(reader),/access_denied/);
   for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(()=>db.query('select nr_subscription_notices($1,$2)',[owner,org]),/permission denied/);}finally{await db.exec('reset role');}}
   assert.equal(await run(),0);
  });
  await t.test('renewal already covering the end suppresses imminent warning',async()=>{
   await db.query("update nr_subscriptions set ends_at=now()+interval '2 days' where id=$1",[sub]);
   const future=crypto.randomUUID();await db.query("insert into nr_subscriptions(id,org_id,plan_id,starts_at,ends_at) select $1,org_id,'avance',ends_at,ends_at+interval '30 days' from nr_subscriptions where id=$2",[future,sub]);
   assert.equal(await run(),0);await db.query('delete from nr_subscriptions where id=$1',[future]);
  });
  await t.test('imminent warning is unique and repeat preserves read status',async()=>{
   assert.equal(await run(),1);await db.query('update nr_notifications set read_at=now() where org_id=$1',[org]);assert.equal(await run(),0);
   const rows=(await db.query('select event_key,read_at from nr_notifications where org_id=$1',[org])).rows;assert.equal(rows.length,1);assert.ok(rows[0].event_key.endsWith(':expiring'));assert.ok(rows[0].read_at);
  });
  await t.test('expiration creates one new notice and never deletes business data',async()=>{
   await db.query("update nr_subscriptions set starts_at=now()-interval '8 days',ends_at=now()-interval '1 day' where id=$1",[sub]);assert.equal(await run(),1);assert.equal(await run(),0);
   assert.equal((await db.query('select count(*)::int n from nr_notifications where org_id=$1',[org])).rows[0].n,2);
   assert.equal((await db.query('select count(*)::int n from nr_records where org_id=$1',[org])).rows[0].n,1);
   await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);try{assert.equal((await db.query('select id from nr_notifications where org_id=$1',[org])).rows.length,0);}finally{await db.exec('reset role');}
  });
 }finally{await db.close();}
});
