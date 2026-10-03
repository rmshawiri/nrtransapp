import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'}),origin=process.env.NR_TEST_ORIGIN||'http://127.0.0.1:4182';
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/demo');await page.locator('#vehicle-scope').waitFor();
  for(const name of ['dashboard','fleet','days','expenses','maintenance','driver','loans','cash','simulation','reports','settings','backup']){
   if(width<760)await page.locator('#menu').click();
   await page.locator('[data-page="'+name+'"]').first().click();
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' overflow at '+width);
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('All 12 business screens passed at 390/1440 without page errors or horizontal overflow.');
}finally{await browser.close()}
