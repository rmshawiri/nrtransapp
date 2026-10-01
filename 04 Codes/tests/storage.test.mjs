import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,synchronize} from '../src/storage.js';
import {demo} from '../src/domain/fleet.js';
test('écriture locale et outbox atomiques, protection contre onglet obsolète',async()=>{
 const store=await openStore(crypto.randomUUID());
 const first=await store.save(demo(),null);
 assert.equal((await store.pending()).length,1);
 await assert.rejects(()=>store.save(first,null),/autre onglet/);
 assert.equal((await store.read()).revision,1);
 assert.equal((await store.pending()).length,1);store.close();
});
test('échec réseau conserve mutation, reprise acquittée sans nouvelle identité',async()=>{
 const store=await openStore(crypto.randomUUID());await store.save(demo(),null);
 const id=(await store.pending())[0].id;
 await assert.rejects(()=>synchronize(store,async()=>{throw Error('offline');}));
 assert.equal((await store.pending())[0].id,id);
 assert.equal((await synchronize(store,async op=>{assert.equal(op.id,id);return {version:1};})).sent,1);
 assert.equal((await store.pending()).length,0);store.close();
});
test('conflit préserve données, import répété refusé sans mutation',async()=>{
 const store=await openStore(crypto.randomUUID());let s=await store.save(demo(),null,{fingerprint:'file-a'});
 await assert.rejects(()=>store.save(s,s.revision,{fingerprint:'file-a'}),/déjà/);
 assert.equal((await store.read()).revision,1);
 assert.equal((await synchronize(store,async()=>({conflict:true}))).conflict,true);
 assert.equal((await store.pending()).length,1);store.close();
});
test('bases de deux comptes et de démonstration indépendantes',async()=>{
 const a=await openStore(crypto.randomUUID()),b=await openStore(crypto.randomUUID());
 await a.save(demo(),null);assert.equal(await b.read(),null);a.close();b.close();
});
