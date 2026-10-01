import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {demo,validateFleet} from '../src/domain/fleet.js';
const ids=Array.from({length:9},()=>crypto.randomUUID());
const [ownerA,ownerB,viewer,admin,orgA,orgB]=ids;

test('PostgreSQL : RLS réelle, isolation, lecture seule, RPC et idempotence',async t=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261001151646_platform_foundation.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3),($4)',[ownerA,ownerB,viewer,admin]);
 await db.query('insert into nr_organizations(id,owner_id,name) values($1,$2,$3),($4,$5,$6)',[orgA,ownerA,'A',orgB,ownerB,'B']);
 await db.query("insert into nr_members values($1,$2,'owner',true,true),($3,$4,'owner',true,true),($1,$5,'viewer',false,true)",[orgA,ownerA,orgB,ownerB,viewer]);
 await db.query('insert into nr_admins(user_id) values($1)',[admin]);
 await db.query("insert into nr_subscriptions(org_id,plan_id,starts_at,ends_at) values($1,'vip',now()-interval '1 day',now()+interval '7 days'),($2,'avance',now()-interval '1 day',now()+interval '7 days')",[orgA,orgB]);
 const state=demo();state.demo=false;
 const vehicle=state.vehicles[0].id;
 state.vehicles.push({...state.vehicles[0],id:crypto.randomUUID(),name:'Véhicule privé',initialKm:0});
 validateFleet(state);
 const as=async(user,fn)=>{await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);try{return await fn();}finally{await db.exec('reset role');}};
 const sync=async(mutation,hash,expected,s=state,actor=ownerA)=>{await db.exec('set role service_role');try{return (await db.query('select nr_sync_apply($1,$2,$3,$4,$5,$6) result',[orgA,actor,mutation,hash,expected,s])).rows[0].result;}finally{await db.exec('reset role');}};
 const mutation=crypto.randomUUID();
 await t.test('mutation atomique et replay sans doublon',async()=>{
  assert.equal((await sync(mutation,'hash-a',0)).version,1);
  const count=(await db.query('select count(*)::int n from nr_records')).rows[0].n;
  assert.equal((await sync(mutation,'hash-a',0)).replayed,true);
  assert.equal((await db.query('select count(*)::int n from nr_records')).rows[0].n,count);
  await assert.rejects(()=>sync(mutation,'hash-changed',0),/idempotency_key_reused/);
 });
 await t.test('version concurrente devient conflit sans écrasement',async()=>{
  const result=await sync(crypto.randomUUID(),'hash-b',0);assert.equal(result.conflict,true);
  assert.equal((await db.query('select version from nr_organizations where id=$1',[orgA])).rows[0].version,1);
 });
 await t.test('client B ne voit aucune ligne du client A',async()=>{
  const result=await as(ownerB,()=>db.query('select * from nr_records'));assert.equal(result.rows.length,0);
 });
 await t.test('viewer voit seulement son véhicule, ne modifie pas et ne s’élève pas',async()=>{
  await db.query('insert into nr_member_vehicles values($1,$2,$3)',[orgA,viewer,vehicle]);
  const result=await as(viewer,()=>db.query("select id from nr_records where kind='vehicles'"));assert.deepEqual(result.rows.map(x=>x.id),[vehicle]);
  await as(viewer,async()=>{
   await assert.rejects(()=>db.query("update nr_records set payload='{}'"),/permission denied/);
   await assert.rejects(()=>db.query("update nr_members set role='owner'"),/permission denied/);
   await assert.rejects(()=>db.query('insert into nr_admins(user_id) values($1)',[viewer]),/permission denied/);
   await assert.rejects(()=>db.query('select nr_sync_apply($1,$2,$3,$4,$5,$6)',[orgA,viewer,crypto.randomUUID(),'x',1,state]),/permission denied/);
  });
  await assert.rejects(()=>sync(crypto.randomUUID(),'x',1,state,viewer),/access_denied/);
 });
 await t.test('admin commercial sans accès universel aux finances',async()=>{
  assert.equal((await as(admin,()=>db.query('select * from nr_records'))).rows.length,0);
  assert.equal((await as(admin,()=>db.query('select * from nr_subscriptions'))).rows.length,2);
 });
 await t.test('contrainte multi-tenant empêche référence à un autre compte',async()=>{
  const other=crypto.randomUUID();await db.query("insert into nr_records(org_id,id,kind,payload,version) values($1,$2,'vehicles',$3,1)",[orgB,other,{id:other}]);
  await assert.rejects(()=>db.query('insert into nr_loan_allocations values($1,$2,$3,$4,100)',[orgA,crypto.randomUUID(),state.loans[0].id,other]),/foreign key/);
 });
 await t.test('expiration conserve les lignes et interdit nouvelles mutations',async()=>{
  await db.query("update nr_subscriptions set ends_at=now()-interval '1 second' where org_id=$1",[orgA]);
  await assert.rejects(()=>sync(crypto.randomUUID(),'expired',1),/subscription_expired/);
  assert.ok((await as(ownerA,()=>db.query('select * from nr_records'))).rows.length>0);
 });
 await t.test('anonyme : tarifs exacts visibles, finances interdites',async()=>{
  await db.exec('set role anon');
  try{assert.equal((await db.query('select * from nr_prices')).rows.length,8);await assert.rejects(()=>db.query('select * from nr_records'),/permission denied/);}finally{await db.exec('reset role');}
 });
 await db.close();
});
