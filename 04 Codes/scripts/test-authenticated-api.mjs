import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {credentials} from './credentials.mjs';
import {databaseClient} from './database-client.mjs';
const c=credentials(),base=new URL(c['API URL']).origin;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(base,c['Secret keys'],options),fixtures=[],orgs=[];
const origin=process.env.NR_TEST_ORIGIN||'http://127.0.0.1:5173';
async function call(action,token,body){const response=await fetch(origin+'/api/platform?action='+action,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+(token||''),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
async function fixture(){
 const email='nr-trans-test-'+crypto.randomUUID()+'@example.com',password=crypto.randomUUID()+'Aa!';
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{business_name:'Recette temporaire NR-TRANS'}});
 if(created.error)throw new Error('Fixture Auth creation failed');
 const item={id:created.data.user.id,client:createClient(base,c['Publishable key'],options)};fixtures.push(item);
 const login=await item.client.auth.signInWithPassword({email,password});if(login.error)throw new Error('Fixture Auth login failed');item.token=login.data.session.access_token;return item;
}
try{
 assert.equal((await call('context')).status,401);
 const a=await fixture(),b=await fixture();
 const ca=await call('context',a.token),cb=await call('context',b.token);
 assert.equal(ca.status,200);assert.equal(cb.status,200);orgs.push(ca.data.organizationId,cb.data.organizationId);
 assert.notEqual(orgs[0],orgs[1]);assert.equal(ca.data.subscription.plan,'gratuit');
 const state=ca.data.initialState;state.vehicles[0].name='Véhicule recette privée';
 const operation={id:crypto.randomUUID(),baseVersion:0,state};
 assert.equal((await call('sync',a.token,operation)).data.version,1);
 assert.equal((await call('sync',a.token,operation)).data.replayed,true);
 assert.equal((await call('sync',a.token,{...operation,id:crypto.randomUUID()})).data.conflict,true);
 assert.equal((await call('sync',b.token,{...operation,organizationId:orgs[0]})).status,403);
 const forbidden=await b.client.rpc('nr_snapshot',{p_org:orgs[0]});assert.equal(forbidden.data,null);
 assert.equal((await call('admin',a.token)).status,403);
 for(const action of ['commercial-settings','promotion','moderate-review'])assert.equal((await call(action,a.token,{})).status,403);
 const quote=await call('quote',a.token,{plan:'avance',months:1,code:''});assert.equal(quote.data.total,2500);
 const order=await call('order',a.token,{plan:'avance',months:1,code:'',method:'mvola',idempotencyKey:crypto.randomUUID(),total:1});assert.equal(order.data.total,2500);
 assert.equal((await call('declare-payment',b.token,{orderId:order.data.id,reference:'forbidden'})).status,404);
 assert.equal((await call('order-detail',b.token,{id:order.data.id})).status,404);
 const detail=await call('order-detail',a.token,{id:order.data.id});assert.equal(detail.data.order.total,2500);assert.equal(detail.data.method.id,'mvola');
 assert.equal((await call('decision',a.token,{orderId:order.data.id,approve:true})).status,403);
 const uploaded=await call('proof-upload',a.token,{orderId:order.data.id,type:'application/pdf'});assert.equal(uploaded.status,200);
 const upload=await a.client.storage.from('payment-proofs').uploadToSignedUrl(uploaded.data.path,uploaded.data.token,new Blob(['%PDF-1.4\n% NR-TRANS integration fixture\n%%EOF'],{type:'application/pdf'}));assert.equal(upload.error,null);a.proof=uploaded.data.path;
 assert.equal((await b.client.storage.from('payment-proofs').download(a.proof)).data,null);
 assert.equal((await call('declare-payment',a.token,{orderId:order.data.id,reference:'RECETTE',proof:a.proof})).status,200);
 assert.equal((await call('profile',a.token,{name:'Recette NR-TRANS',phone:''})).status,200);
 assert.equal((await call('review',a.token,{rating:5,comment:'Avis de recette temporaire.'})).status,200);
 assert.equal((await call('client',a.token)).data.profile.display_name,'Recette NR-TRANS');
 const rights=databaseClient();try{await rights.connect();await rights.query('begin');await rights.query('update nr_members set active=false where org_id=$1 and user_id=$2',[orgs[1],b.id]);await rights.query("insert into nr_members values($1,$2,'viewer',false,true)",[orgs[0],b.id]);await rights.query('insert into nr_member_vehicles values($1,$2,$3)',[orgs[0],b.id,state.vehicles[0].id]);await rights.query('commit');}finally{await rights.end();}
 await b.client.auth.updateUser({data:{role:'owner',isAdmin:true,organizationId:orgs[0]}});
 assert.equal((await call('context',b.token)).data.role,'viewer');
 assert.equal((await call('sync',b.token,{...operation,organizationId:orgs[0],canWrite:true,role:'owner'})).status,403);
 assert.equal((await call('admin',b.token)).status,403);
 assert.equal((await call('snapshot',a.token)).data.state.serverVersion,1);
 const oldToken=a.token;await a.client.auth.signOut({scope:'global'});assert.equal((await call('context',oldToken)).status,401);
 console.log('Authenticated HTTP integration passed: Auth login, real sessions, organizations, sync/replay/conflict, RLS snapshot, server pricing, private proof, role checks, revoked session.');
}catch(e){console.log(JSON.stringify({test:'authenticated-api',error:e.code||e.name,message:e instanceof assert.AssertionError?'Assertion failed at '+e.stack.split('\n').find(x=>x.includes('test-authenticated-api')):e.message}));process.exitCode=1;}
finally{
 for(const f of fixtures){if(f.proof)await admin.storage.from('payment-proofs').remove([f.proof]);if(f.token)await admin.auth.admin.signOut(f.token,'global');}
 const db=databaseClient();
 try{await db.connect();await db.query('begin');
  const ids=fixtures.map(f=>f.id);
  // Restrict cleanup to organizations owned by accounts created in this exact run.
  const owned=(await db.query('select id from nr_organizations where owner_id=any($1::uuid[])',[ids])).rows.map(x=>x.id);
  for(const table of ['nr_subscriptions','nr_payments','nr_orders','nr_reviews','nr_notifications','nr_audit','nr_sync_receipts','nr_member_vehicles','nr_loan_allocations','nr_records','nr_members'])await db.query('delete from '+table+' where org_id=any($1::uuid[])',[owned]);
  await db.query('delete from nr_organizations where id=any($1::uuid[])',[owned]);await db.query('delete from nr_profiles where id=any($1::uuid[])',[ids]);await db.query('commit');
 }catch{await db.query('rollback').catch(()=>{});console.log('Fixture database cleanup requires attention.');process.exitCode=1;}finally{await db.end().catch(()=>{});}
 for(const f of fixtures){const {error}=await admin.auth.admin.deleteUser(f.id);if(error){console.log('Fixture Auth cleanup requires attention.');process.exitCode=1;}}
}
