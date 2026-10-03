import test from 'node:test';import assert from 'node:assert/strict';import {readPages} from '../server/read-pages.mjs';
test('collection beyond Supabase row limit is complete, ordered, without duplicates',async()=>{
 const records=Array.from({length:1203},(_,id)=>({id})),ranges=[];
 const actual=await readPages(async(start,end)=>{ranges.push([start,end]);return records.slice(start,end+1);});
 assert.deepEqual(actual,records);assert.deepEqual(ranges,[[0,499],[500,999],[1000,1499]]);
});
test('failed later page is an error, never a partial successful collection',async()=>{
 await assert.rejects(readPages(async start=>{if(start)throw Error('network');return [1,2]},2),/network/);
 assert.deepEqual(await readPages(async()=>[]),[]);
});
