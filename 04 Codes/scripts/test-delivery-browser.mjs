import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.NR_TEST_ORIGIN||'https://nr-trans.morashawiri.com',production=origin.startsWith('https://');
const routes=['/','/tarifs','/confidentialite','/conditions','/mentions-legales','/inscription','/connexion','/recuperation','/nouveau-mot-de-passe','/app','/demo','/client','/admin','/paiement'];
for(const route of routes){const r=await fetch(origin+route);assert.equal(r.status,200,route);const html=await r.text();if(production){assert.ok(html.includes('href="https://nr-trans.morashawiri.com'+(route==='/'?'/':route)+'"'),route+' canonical');if(routes.indexOf(route)>=5)assert.ok(html.includes('noindex,nofollow'),route+' noindex');}assert.ok(!html.includes('localhost:'));}
if(production){assert.equal((await fetch(origin+'/route-inexistante-recette')).status,404);assert.equal((await fetch(origin+'/admin/route-inconnue')).status,404);}
const browser=await chromium.launch({channel:'chrome'});
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('/api/'))missing.push(new URL(r.url()).pathname);});
 for(const route of ['/','/tarifs','/inscription','/connexion','/recuperation','/nouveau-mot-de-passe','/client','/admin','/paiement']){
  await page.goto(origin+route);await page.waitForLoadState('networkidle');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' overflow '+width);
  assert.deepEqual(await page.locator('input:not([type=hidden]),select,textarea').evaluateAll(els=>els.filter(e=>e.getClientRects().length&&!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.name||e.id)),[],route+' unlabeled controls');
  assert.equal(await page.locator('img').evaluateAll(els=>els.some(e=>!e.hasAttribute('alt')||!e.complete||e.naturalWidth===0)),false,route+' images');
 }
 await page.goto(origin+'/demo');await page.locator('#vehicle-scope').waitFor();
 await page.getByRole('button',{name:'+ Nouveau versement',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Journée de transport',exact:true});await dialog.waitFor();
 assert.equal(await dialog.locator('input').first().evaluate(e=>e.labels.length>0),true);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog')),true);
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 if(width===1440){await page.evaluate(()=>document.documentElement.style.zoom='200%');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'zoom 200%');}
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await page.close();
}console.log('Delivery smoke passed: routes, metadata (production), 404 (production), labels, images, dialogs/keyboard, zoom, mobile/desktop, JS/resources.');}finally{await browser.close();}
