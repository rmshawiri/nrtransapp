import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createClient} from '@supabase/supabase-js';
import {credentials} from './credentials.mjs';
import * as Core from '../src/domain/core.js';
const c=credentials(),base=new URL(c['API URL']).origin,origin='http://127.0.0.1:4173';
const admin=createClient(base,c['Secret keys'],{auth:{persistSession:false,autoRefreshToken:false}});
const fixtureFile=new URL('../.private/browser-fixture-owner.json',import.meta.url),fixture=JSON.parse(await readFile(fixtureFile));
const user=await admin.auth.admin.getUserById(fixture.id);if(user.error||!/^nr-trans-browser-[a-f0-9-]+@example\.com$/.test(user.data.user.email))throw new Error('Unexpected fixture');
const password=crypto.randomUUID()+'Aa7';if((await admin.auth.admin.updateUserById(fixture.id,{password})).error)throw new Error('Fixture login setup failed');
const browser=await chromium.launchPersistentContext(fileURLToPath(new URL('../.private/roundtrip-playwright',import.meta.url)),{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});
const page=browser.pages()[0]||await browser.newPage();page.setDefaultTimeout(60000);
const observeCode=await readFile(new URL('./browser-observe.js',import.meta.url),'utf8');
const observe=()=>page.evaluate(observeCode);
let token;
async function api(action,body){const r=await fetch(origin+'/api/platform?action='+action,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,200,`API ${action} must succeed`);return data;}
const totals=state=>{const s=Core.stats(state);return {received:s.revenue,commission:s.wage,profit:s.profit};};
const expected={received:4500,commission:900,profit:3600};
try{
 await page.goto(origin+'/connexion');await page.locator('input[name=email]').fill(user.data.user.email);await page.locator('input[name=password]').fill(password);await page.locator('#auth-form button').click();await page.waitForURL('**/client');
 await page.goto(origin+'/app');await page.getByRole('button',{name:'Synchronisé',exact:true}).waitFor();
 token=await page.evaluate(()=>JSON.parse(localStorage.getItem('sb-dffmdfueoihfcrkjabaz-auth-token')).access_token);
 await writeFile(fixtureFile,JSON.stringify({id:fixture.id,token}),{mode:0o600});
 await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
 let local=await observe(),remote=(await api('snapshot')).state;
 assert.equal(local.pending.length,0);assert.equal(local.state.days.length,1);assert.deepEqual(local.state.days,remote.days);assert.deepEqual(totals(local.state),expected);assert.deepEqual(totals(remote),expected);
 const dayId=local.state.days[0].id;
 console.log('Existing offline day: same identifier, payload and financial totals in IndexedDB and Supabase; queue empty.');

 const operation={id:crypto.randomUUID(),baseVersion:remote.serverVersion,state:structuredClone(remote)};operation.state.vehicles[0].name='Véhicule synchronisé depuis le serveur';
 const first=await api('sync',operation),retry=await api('sync',operation);assert.equal(retry.replayed,true);assert.equal(retry.version,first.version);
 await page.locator('#sync-state').click();await page.waitForFunction(name=>document.body.innerText.includes(name),operation.state.vehicles[0].name);await page.getByRole('button',{name:'Synchronisé',exact:true}).waitFor();
 local=await observe();remote=(await api('snapshot')).state;assert.equal(local.state.serverVersion,first.version);assert.equal(local.state.days[0].id,dayId);assert.deepEqual(local.state.days,remote.days);assert.deepEqual(totals(local.state),expected);
 console.log('Authorized server change recovered by the device; identical retry replayed without a second financial record.');

 // The real request commits to Supabase. Only its response is deliberately lost.
 await page.evaluate(()=>{const original=window.fetch;window.fetch=async(...args)=>{const response=await original(...args);if(String(args[0]).includes('/api/platform?action=sync')&&response.ok){window.fetch=original;window.__nrLostReply=await response.clone().json();throw new TypeError('Simulated connection loss after commit');}return response;};});
 await page.locator('[data-page="settings"]').click();await page.locator('[name=v_notes]').fill('Modification locale après réponse perdue');await page.locator('#settings-form button[type=submit]').click();
 await page.waitForFunction(()=>window.__nrLostReply?.version>0);await page.waitForFunction(()=>document.querySelector('#sync-state')?.textContent.includes('En attente'));
 const queued=await observe();assert.equal(queued.pending.length,1);const mutationId=queued.pending[0].id;
 remote=(await api('snapshot')).state;assert.equal(remote.vehicles[0].notes,'Modification locale après réponse perdue');assert.equal(remote.days.length,1);assert.deepEqual(totals(remote),expected);
 await browser.setOffline(true);await page.reload();await page.getByRole('button',{name:'Hors ligne · Saisies conservées'}).waitFor();
 assert.equal((await observe()).pending[0].id,mutationId);
 await browser.setOffline(false);await page.getByRole('button',{name:'Synchronisé',exact:true}).waitFor();
 local=await observe();assert.equal(local.pending.length,0);assert.equal(local.state.days[0].id,dayId);assert.deepEqual(totals(local.state),expected);
 remote=(await api('snapshot')).state;assert.equal(remote.serverVersion,local.state.serverVersion);assert.deepEqual(local.state.days,remote.days);
 const replay=await api('sync',queued.pending[0]);assert.equal(replay.replayed,true);assert.equal(replay.version,remote.serverVersion);
 await page.reload();await page.getByRole('button',{name:'Synchronisé',exact:true}).waitFor();assert.equal((await observe()).state.days[0].id,dayId);
 await page.screenshot({path:fileURLToPath(new URL('../.private/offline-roundtrip-verified.png',import.meta.url)),fullPage:true});
 await writeFile(new URL('../.private/roundtrip-result.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),dayId,totals:expected,pending:0,serverVersion:remote.serverVersion,responseLostRetry:true,serverToDevice:true}));
 console.log('Lost response after commit → offline reload → reconnection → replay: queue drained, one day only, exact totals, reload persistent.');
}catch(e){await page.screenshot({path:fileURLToPath(new URL('../.private/roundtrip-failure.png',import.meta.url))}).catch(()=>{});console.log(JSON.stringify({test:'browser-roundtrip',error:e.name,message:e instanceof assert.AssertionError?e.message:String(e.message).replace(/Bearer\s+\S+/g,'Bearer [redacted]')}));process.exitCode=1;}
finally{await browser.close();}
