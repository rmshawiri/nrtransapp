import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {credentials} from './credentials.mjs';
const c=credentials(),origin=process.env.NR_TEST_ORIGIN||'https://nr-trans.morashawiri.com';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.goto(origin+'/connexion');
 await page.locator('[name=email]').fill(c.ADMIN_EMAIL);
 await page.locator('[name=password]').fill(c.ADMIN_PASSWORD);
 await page.locator('#auth-form button').click();
 await page.waitForURL('**/client');
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto(origin+'/admin');
  await page.getByRole('button',{name:'Codes promo',exact:true}).click();
  await page.locator('#promotion').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await page.locator('[name=maxUses]').count(),1);
  await page.getByRole('button',{name:'Moyens de paiement',exact:true}).click();
  await page.locator('[data-method]').first().waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await page.locator('#logout').isVisible(),true);
 }
 await page.locator('#logout').click();
 console.log('Admin forms verified at 390/1440: promotions, payment methods, no page overflow, sign-out available.');
}finally{await browser.close()}
