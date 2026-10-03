import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.NR_TEST_ORIGIN||'https://nr-trans.morashawiri.com';
const browser=await chromium.launch({channel:'chrome'});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 await page.goto(origin+'/demo');await page.locator('#vehicle-scope').waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('#vehicle-scope').waitFor();
 const assets=await page.evaluate(async()=>{const names=await caches.keys();const cache=await caches.open(names.find(n=>n.startsWith('nr-trans-v2-')));return(await cache.keys()).map(r=>new URL(r.url).pathname);});
 const shell=await page.evaluate(async()=>{const names=await caches.keys(),cache=await caches.open(names.find(n=>n.startsWith('nr-trans-v2-'))),response=await cache.match('/shell');return response?{status:response.status,redirected:response.redirected}:null;});
 assert.deepEqual(shell,{status:200,redirected:false},'Offline navigation shell must not be a redirected response');
 assert.ok(assets.includes('/manifest.webmanifest'));assert.ok(assets.every(p=>!p.startsWith('/api/')));
 await context.setOffline(true);await page.reload();await page.locator('#vehicle-scope').waitFor();
 assert.equal(await page.evaluate(()=>navigator.onLine),false);
 await context.setOffline(false);await page.goto(origin);await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 const response=await context.request.get(origin+'/api/platform?action=public-reviews');assert.equal(response.status(),200);
 for(const review of (await response.json()).reviews)assert.deepEqual(Object.keys(review).sort(),['author_name','comment','created_at','rating']);
 console.log('PWA worker/cache, offline reload, online return and public reviews HTTP passed.');
}finally{await browser.close()}
