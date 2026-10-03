import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Invitations : capacité explicite, identité vérifiée, révocation et isolation',async t=>{
 const remote=process.env.NR_TEST_REMOTE==='1';
 const db=remote?await (await import('../scripts/remote-test-database.mjs')).remoteTestDatabase():new PGlite();
 const [owner,other,reader,admin,org,vehicle]=Array.from({length:6},()=>crypto.randomUUID());
 try{
 if(!remote){
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");
 const dir=new URL('../supabase/migrations/',import.meta.url);
 for(const file of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
 }
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'owner@example.test',now()),($2,'other@example.test',now()),($3,'reader@example.test',now()),($4,'admin@example.test',now())",[owner,other,reader,admin]);
 await db.query("insert into nr_organizations(id,owner_id,name) values($1,$2,'Invitation test')",[org,owner]);
 await db.query("insert into nr_members values($1,$2,'owner',true,true)",[org,owner]);
 await db.query("insert into nr_admins(user_id) values($1)",[admin]);
 await db.query("insert into nr_subscriptions(org_id,plan_id,starts_at,ends_at) values($1,'gratuit',now(),now()+interval '7 days')",[org]);
 await db.query("insert into nr_records(org_id,id,kind,payload,version) values($1,$2,'vehicles',$3,1)",[org,vehicle,{id:vehicle}]);
 const rpc=async(sql,args)=>{await db.exec('set role service_role');try{return (await db.query(sql,args)).rows[0]?.result;}finally{await db.exec('reset role');}};
 const invite=()=>rpc('select nr_invitation_create($1,$2,$3,$4,$5) result',[org,owner,'reader@example.test',false,[vehicle,vehicle]]);
 let invitation;
 await t.test('aucune limite inventée et configuration réservée administrateur',async()=>{
 await assert.rejects(invite,/secondary_user_policy_required/);
 await assert.rejects(()=>rpc('select nr_admin_configure($1,$2)',[owner,{plans:[{id:'gratuit',limit:1}]}]),/access_denied/);
 await rpc('select nr_admin_configure($1,$2)',[admin,{plans:[{id:'gratuit',limit:1}]}]);
 invitation=await invite();assert.equal((await invite()).id,invitation.id);
 await assert.rejects(()=>rpc('select nr_invitation_create($1,$2,$3,true,array[]::uuid[])',[org,owner,'extra@example.test']),/secondary_user_limit/);
 });
 await t.test('identité différente et jeton invalide refusés',async()=>{
 await assert.rejects(()=>rpc('select nr_invitation_accept($1,$2)',[other,invitation.token]),/invitation_email_mismatch/);
 await assert.rejects(()=>rpc('select nr_invitation_accept($1,$2)',[reader,crypto.randomUUID()]),/invitation_invalid/);
 });
 await t.test('expiration, annulation et réinvitation',async()=>{
 await db.query("update nr_invitations set expires_at=now()-interval '1 second' where id=$1",[invitation.id]);
 await assert.rejects(()=>rpc('select nr_invitation_accept($1,$2)',[reader,invitation.token]),/invitation_invalid/);
 invitation=await invite();
 await assert.rejects(()=>rpc('select nr_invitation_cancel($1,$2,$3)',[org,other,invitation.id]),/access_denied/);
 await rpc('select nr_invitation_cancel($1,$2,$3)',[org,owner,invitation.id]);
 await assert.rejects(()=>rpc('select nr_invitation_accept($1,$2)',[reader,invitation.token]),/invitation_invalid/);
 invitation=await invite();
 });
 await t.test('acceptation idempotente, accès véhicule et aucune promotion possible',async()=>{
 assert.equal(await rpc('select nr_invitation_accept($1,$2) result',[reader,invitation.token]),org);
 assert.equal(await rpc('select nr_invitation_accept($1,$2) result',[reader,invitation.token]),org);
 assert.equal((await db.query('select count(*)::int n from nr_member_vehicles where user_id=$1',[reader])).rows[0].n,1);
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[reader]);
 try{
 assert.equal((await db.query('select id from nr_records')).rows.length,1);
 assert.equal((await db.query('select id from nr_invitations')).rows.length,0);
 await assert.rejects(()=>db.query("update nr_members set role='owner'"),/permission denied/);
 await assert.rejects(()=>db.query('insert into nr_admins(user_id) values($1)',[reader]),/permission denied/);
 await assert.rejects(()=>db.query('select nr_invitation_accept($1,$2)',[reader,invitation.token]),/permission denied/);
 }finally{await db.exec('reset role');}
 });
 await t.test('révocation conserve le rattachement sans nouvel essai',async()=>{
 await rpc('select nr_member_change($1,$2,$3,false,false,array[]::uuid[])',[org,owner,reader]);
 assert.equal(await rpc('select nr_onboard($1,$2) result',[reader,'must not create']),org);
 await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[reader]);
 try{assert.equal((await db.query('select id from nr_records')).rows.length,0);}finally{await db.exec('reset role');}
 assert.equal((await db.query('select count(*)::int n from nr_organizations')).rows[0].n,1);
 });
 await t.test('administration : promotion et modération réservées au rôle base',async()=>{
 const promo={name:'Temporary verification',code:'TEST'+crypto.randomUUID().replaceAll('-',''),type:'percent',value:100,plans:[],months:[]};
 await assert.rejects(()=>rpc('select nr_promotion_save($1,$2)',[reader,promo]),/access_denied/);
 const id=await rpc('select nr_promotion_save($1,$2) result',[admin,promo]);
 assert.equal((await db.query('select value::int value from nr_promotions where id=$1',[id])).rows[0].value,100);
 const review=(await db.query("insert into nr_reviews(org_id,author_name,rating,comment) values($1,'Test',5,'Temporary test') returning id",[org])).rows[0].id;
 await assert.rejects(()=>rpc('select nr_review_moderate($1,$2,$3)',[owner,review,'approved']),/access_denied/);
 await rpc('select nr_review_moderate($1,$2,$3)',[admin,review,'approved']);
 assert.equal((await db.query('select status from nr_reviews where id=$1',[review])).rows[0].status,'approved');
 });
 await t.test('notifications : envoi admin idempotent et lecture propriétaire isolée',async()=>{
 const id=crypto.randomUUID(),args=[admin,org,id,'Information','Message de test'];
 await assert.rejects(()=>rpc('select nr_notification_send($1,$2,$3,$4,$5)',[reader,...args.slice(1)]),/access_denied/);
 await rpc('select nr_notification_send($1,$2,$3,$4,$5)',args);await rpc('select nr_notification_send($1,$2,$3,$4,$5)',args);
 assert.equal((await db.query('select count(*)::int n from nr_audit where entity_id=$1',[id])).rows[0].n,1);
 await assert.rejects(()=>rpc('select nr_notification_read($1,$2)',[other,id]),/access_denied/);
 await assert.rejects(()=>rpc('select nr_notification_read($1,$2)',[reader,id]),/access_denied/);
 await rpc('select nr_notification_read($1,$2)',[owner,id]);assert.ok((await db.query('select read_at from nr_notifications where id=$1',[id])).rows[0].read_at);
 });
 await t.test('moyens manuels : rôle admin, instructions et intégrations indisponibles',async()=>{
 await assert.rejects(()=>rpc('select nr_payment_method_save($1,$2,$3,$4)',[owner,'cash','disabled','Test']),/access_denied/);
 await assert.rejects(()=>rpc('select nr_payment_method_save($1,$2,$3,$4)',[admin,'card','active','Test']),/payment_integration_unavailable/);
 await assert.rejects(()=>rpc('select nr_payment_method_save($1,$2,$3,$4)',[admin,'bank','active','Coordonnées à configurer par MORA Shawiri.']),/payment_instructions_required/);
 await rpc('select nr_payment_method_save($1,$2,$3,$4)',[admin,'cash','disabled','Consignes temporaires']);assert.equal((await db.query("select status from nr_payment_methods where id='cash'")).rows[0].status,'disabled');
 });
 }finally{await db.close();}
});
