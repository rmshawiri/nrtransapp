import {readFile,writeFile,unlink} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {credentials} from './credentials.mjs';
import {databaseClient} from './database-client.mjs';
const c=credentials(),base=new URL(c['API URL']).origin,options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(base,c['Secret keys'],options),file=new URL('../.private/browser-fixture-owner.json',import.meta.url),statefile=new URL('../.private/browser-fixture-state.json',import.meta.url);
if(process.argv[2]==='create'){
 try{await readFile(file);throw new Error('Existing fixture must be cleaned first');}catch(e){if(e.code!=='ENOENT')throw e;}
 const email='nr-trans-browser-'+crypto.randomUUID()+'@example.com',password=crypto.randomUUID()+'Aa!';
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Recette navigateur',business_name:'Parc de recette'}});if(error)throw new Error('Auth fixture failed');
 await writeFile(file,JSON.stringify({id:data.user.id}),{mode:0o600});
 const client=createClient(base,c['Publishable key'],options),login=await client.auth.signInWithPassword({email,password});if(login.error)throw new Error('Login fixture failed');
 await writeFile(file,JSON.stringify({id:data.user.id,token:login.data.session.access_token}),{mode:0o600});
 await writeFile(statefile,JSON.stringify({cookies:[],origins:[{origin:'http://127.0.0.1:4173',localStorage:[{name:'sb-dffmdfueoihfcrkjabaz-auth-token',value:JSON.stringify(login.data.session)}]}]}),{mode:0o600});
 console.log('Temporary browser fixture ready. Private state saved without displaying credentials.');
}else if(process.argv[2]==='verify-offline'){
 const fixture=JSON.parse(await readFile(file)),db=databaseClient();try{await db.connect();const r=(await db.query("select count(*)::int n,sum((r.payload->>'actual')::numeric)::int total from nr_records r join nr_organizations o on o.id=r.org_id where o.owner_id=$1 and r.kind='days' and r.deleted_at is null",[fixture.id])).rows[0];if(r.n!==1||r.total!==4500)throw new Error('Offline mutation not synchronized exactly once');console.log('Offline browser entry verified in remote PostgreSQL: exactly one day, 4500 KMF.');}finally{await db.end();}
}else if(process.argv[2]==='cleanup'){
 const fixture=JSON.parse(await readFile(file));if(fixture.token)await admin.auth.admin.signOut(fixture.token,'global');
 const db=databaseClient();try{await db.connect();await db.query('begin');const orgs=(await db.query('select id from nr_organizations where owner_id=$1',[fixture.id])).rows.map(x=>x.id);
 for(const t of ['nr_subscriptions','nr_payments','nr_orders','nr_reviews','nr_notifications','nr_audit','nr_sync_receipts','nr_member_vehicles','nr_loan_allocations','nr_records','nr_members'])await db.query('delete from '+t+' where org_id=any($1::uuid[])',[orgs]);
 await db.query('delete from nr_organizations where id=any($1::uuid[])',[orgs]);await db.query('delete from nr_profiles where id=$1',[fixture.id]);await db.query('commit');}finally{await db.end();}
 const {error}=await admin.auth.admin.deleteUser(fixture.id);if(error)throw new Error('Auth cleanup failed');await unlink(file);await unlink(statefile);console.log('Temporary browser fixture removed.');
}else throw new Error('Use create or cleanup');
