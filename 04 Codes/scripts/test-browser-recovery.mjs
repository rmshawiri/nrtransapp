import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import * as Core from '../src/domain/core.js';
const profileURL=new URL('../.private/roundtrip-playwright',import.meta.url),profile=fileURLToPath(profileURL);
const browser=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});
const page=browser.pages()[0]||await browser.newPage();
try{
 await browser.setOffline(true);await page.goto('http://127.0.0.1:4173/app',{waitUntil:'domcontentloaded'}).catch(()=>{});
 await page.waitForTimeout(2500);
 await page.getByRole('button',{name:'Hors ligne · Saisies conservées',exact:true}).waitFor({timeout:60000});
 await page.screenshot({path:fileURLToPath(new URL('../.private/recovery-diagnostic.png',import.meta.url))});
 const code=await readFile(new URL('./browser-observe.js',import.meta.url),'utf8');
 const observed=await page.evaluate(code);await writeFile(new URL('../.private/browser-observed.json',import.meta.url),JSON.stringify(observed));
 console.log(JSON.stringify({pending:observed.pending.length,version:observed.state.serverVersion,days:observed.state.days.length}));
 assert.equal(observed.pending.length,1);const operation=observed.pending[0],dayId=observed.state.days[0].id;
 const fixture=JSON.parse(await readFile(new URL('../.private/browser-fixture-owner.json',import.meta.url)));
 const api=async(action,body)=>{const r=await fetch('http://127.0.0.1:4173/api/platform?action='+action,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+fixture.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert.equal(r.status,200);return r.json();};
 const before=(await api('snapshot')).state;assert.equal(before.serverVersion,observed.state.serverVersion+1);assert.equal(before.days[0].id,dayId);
 await browser.setOffline(false);await page.getByRole('button',{name:'Synchronisé',exact:true}).waitFor({timeout:60000});
 const after=await page.evaluate(code),remote=(await api('snapshot')).state;
 assert.equal(after.pending.length,0);assert.equal(after.state.serverVersion,remote.serverVersion);assert.deepEqual(after.state.days,remote.days);assert.equal(remote.days.length,1);assert.equal(remote.days[0].id,dayId);
 const stats=Core.stats(remote);assert.equal(stats.revenue,4500);assert.equal(stats.wage,900);assert.equal(stats.profit,3600);
 const retry=await api('sync',operation);assert.equal(retry.replayed,true);assert.equal(retry.version,remote.serverVersion);
 await page.reload();await page.getByRole('button',{name:'Synchronisé',exact:true}).waitFor({timeout:60000});assert.equal((await page.evaluate(code)).pending.length,0);
 await writeFile(new URL('../.private/roundtrip-result.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),dayId,totals:{received:4500,commission:900,profit:3600},pending:0,serverVersion:remote.serverVersion,responseLostRetry:true,serverToDevice:true}));
 console.log('Response lost after real commit: offline pending operation retained; reconnection replayed, queue drained, retry deduplicated, financial totals exact after reload.');
}finally{await browser.close();}
