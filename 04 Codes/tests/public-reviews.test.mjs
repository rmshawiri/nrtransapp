import test from 'node:test';import assert from 'node:assert/strict';import {createPlatform} from '../server/platform.mjs';
test('public reviews expose only approved public columns, without authenticating or accepting writes',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async request=>{const url=new URL(typeof request==='string'?request:request.url);calls.push(url);assert.equal(url.pathname,'/rest/v1/nr_reviews');assert.equal(url.searchParams.get('status'),'eq.approved');assert.equal(url.searchParams.get('select'),'author_name,rating,comment,created_at');assert.equal(url.searchParams.get('limit'),'12');return new Response(JSON.stringify([{author_name:'Auteur',rating:5,comment:'Avis approuvé',created_at:'2026-10-03'}]),{headers:{'Content-Type':'application/json'}});});
 const platform=createPlatform({SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-public',SUPABASE_SECRET_KEY:'test-service'});
 assert.equal((await platform({action:'public-reviews'})).reviews.length,1);
 await assert.rejects(platform({action:'public-reviews',method:'POST'}),e=>e.status===405);
 assert.equal(calls.length,1);
});
