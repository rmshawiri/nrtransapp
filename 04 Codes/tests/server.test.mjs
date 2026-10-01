import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validateSync,createPlatform,publicConfig} from '../server/platform.mjs';
test('identifiants initiaux stables et isolés par organisation',()=>{
 const org=crypto.randomUUID(),a=initialState(org),b=initialState(org),other=initialState(crypto.randomUUID());
 assert.deepEqual(a,b);assert.notEqual(a.vehicles[0].id,other.vehicles[0].id);
 assert.doesNotThrow(()=>validateSync({id:crypto.randomUUID(),baseVersion:0,state:a}));
 const duplicate=structuredClone(a);duplicate.drivers[0].id=duplicate.vehicles[0].id;
 assert.throws(()=>validateSync({id:crypto.randomUUID(),baseVersion:0,state:duplicate}),/Identifiant partagé/);
 assert.throws(()=>validateSync({id:crypto.randomUUID(),baseVersion:0,state:{...a,demo:true}}));
});
test('configuration publique sans secret et requête sans session refusée',async()=>{
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-value',SUPABASE_SECRET_KEY:'private-value'};
 assert.equal(JSON.stringify(publicConfig(env)).includes('private-value'),false);
 await assert.rejects(()=>createPlatform(env)({action:'context',method:'GET'}),e=>e.status===401);
});
