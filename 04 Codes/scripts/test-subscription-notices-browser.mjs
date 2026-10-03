import assert from 'node:assert/strict';import {chromium} from 'playwright';import {createClient} from '@supabase/supabase-js';import {credentials} from './credentials.mjs';import {databaseClient} from './database-client.mjs';
const c=credentials(),origin=process.env.NR_TEST_ORIGIN||'https://nr-trans.morashawiri.com',service=createClient(new URL(c['API URL']).origin,c['Secret keys'],{auth:{persistSession:false,autoRefreshToken:false}}),db=databaseClient();let userId,org,browser;
try{
 await db.connect();const email='nr-lifecycle-'+crypto.randomUUID()+'@example.com',password=crypto.randomUUID()+'Aa!';const created=await service.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);userId=created.data.user.id;
 browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(origin+'/connexion');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.locator('#auth-form button').click();await page.waitForURL('**/client');await page.locator('#account-content').waitFor();
 org=(await db.query('select id from nr_organizations where owner_id=$1',[userId])).rows[0].id;
 await db.query("update nr_subscriptions set ends_at=now()+interval '2 days' where org_id=$1",[org]);
 await page.reload();await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByText('Votre abonnement arrive à expiration',{exact:true}).waitFor();
 const notice=page.locator('.record-card').filter({hasText:'Votre abonnement arrive à expiration'});await notice.getByRole('button',{name:'Marquer comme lue',exact:true}).click();await notice.locator('small').filter({hasText:/ · Lue$/}).waitFor();
 await page.reload();await page.locator('#account-content').waitFor();assert.equal((await db.query('select count(*)::int n from nr_notifications where org_id=$1 and event_key is not null',[org])).rows[0].n,1);
 await db.query("update nr_subscriptions set starts_at=now()-interval '8 days',ends_at=now()-interval '1 day' where org_id=$1",[org]);
 await page.reload();await page.getByText('Expiré',{exact:true}).waitFor();await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByText('Votre abonnement a expiré',{exact:true}).waitFor();
 assert.equal((await db.query('select count(*)::int n from nr_notifications where org_id=$1 and event_key is not null',[org])).rows[0].n,2);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 console.log('Lifecycle browser passed: imminent, read, reload without duplicate, expiration and preserved account.');
}catch(e){console.error('Lifecycle browser failed: '+e.name);console.error(e.stack?.split('\n').filter(l=>l.includes('test-subscription-notices-browser.mjs')).join('\n'));process.exitCode=1;}
finally{
 await browser?.close();
 if(userId){try{await db.query('begin');const ids=(await db.query('select id from nr_organizations where owner_id=$1',[userId])).rows.map(r=>r.id);for(const table of ['nr_invitations','nr_subscriptions','nr_payments','nr_orders','nr_reviews','nr_notifications','nr_audit','nr_sync_receipts','nr_member_vehicles','nr_loan_allocations','nr_records','nr_members'])await db.query('delete from '+table+' where org_id=any($1::uuid[])',[ids]);await db.query('delete from nr_organizations where id=any($1::uuid[])',[ids]);await db.query('delete from nr_profiles where id=$1',[userId]);await db.query('commit');const deleted=await service.auth.admin.deleteUser(userId);assert.equal(deleted.error,null);}catch{await db.query('rollback').catch(()=>{});console.error('Lifecycle fixture cleanup requires attention.');process.exitCode=1;}}
 await db.end();
}
