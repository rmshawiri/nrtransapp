import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
try{for(const [device,width] of [['PC',1440],['Mobile',390]]){
 const page=await browser.newPage({serviceWorkers:'block',viewport:{width,height:1100},deviceScaleFactor:2,isMobile:device==='Mobile',hasTouch:device==='Mobile'});
 await page.goto('http://127.0.0.1:4191/demo');await page.locator('#vehicle-scope').waitFor();
 const dir=new URL('../../05 Captures d\'écran/Version '+device+'/',import.meta.url);await mkdir(dir,{recursive:true});
 for(const [i,name] of ['dashboard','fleet','cash','reports'].entries()){
  if(width<700)await page.locator('#menu').click();await page.locator('[data-page="'+name+'"]').first().click();await page.evaluate(()=>document.fonts.ready);
  const clip=await page.evaluate(({name,mobile})=>{
   const content=document.querySelector('#content');
   const first=name==='dashboard'?content.querySelector('.cards'):name==='reports'?content.querySelector('.panel'):content;
   let last=name==='dashboard'?(mobile?content.querySelector('.cards'):content.querySelector('.grid2')):name==='fleet'?content.querySelector('.panel:last-child'):name==='reports'?content.querySelector('.panel'):content.querySelector('.cards');
   if(name==='cash'&&!mobile)last=content.querySelector('tbody tr:nth-child(5)');
   const a=first.getBoundingClientRect(),b=last.getBoundingClientRect();
   return {x:Math.max(0,a.x-8),y:a.y+scrollY-8,width:a.width+16,height:b.bottom-a.y+16};
  },{name,mobile:width<700});
  if(name==='reports'&&width<700){
   await page.locator('#content > .panel').first().evaluate(el=>el.scrollIntoView({block:'start'}));
   const region=await page.evaluate(()=>{const a=document.querySelector('#content > .panel').getBoundingClientRect(),b=document.querySelector('#content > .panel tbody tr:nth-child(3)').getBoundingClientRect();return {x:a.x,y:a.y,width:a.width,height:b.bottom-a.y+8};});
   await page.screenshot({path:fileURLToPath(new URL(`${i+1}-${name}.png`,dir)),clip:region});
  }else if(name==='fleet'||name==='reports')await page.locator(name==='fleet'?'.vehicle-card':'#content > .panel').first().screenshot({path:fileURLToPath(new URL(`${i+1}-${name}.png`,dir))});
  else await page.screenshot({path:fileURLToPath(new URL(`${i+1}-${name}.png`,dir)),clip});
  console.log(device+' '+name+' '+Math.round(clip.width)+'x'+Math.round(clip.height));
 }
 await page.close();
}}finally{await browser.close();}
