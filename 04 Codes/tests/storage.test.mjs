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
test('récupération distante sans écrasement des saisies en attente',async()=>{
 const store=await openStore(crypto.randomUUID()),remote={...demo(),serverVersion:1};
 await store.reconcile(remote);let local=await store.read();local.vehicles[0].name='Saisie hors ligne';await store.save(local,local.revision);
 const changed=structuredClone(remote);changed.serverVersion=2;changed.vehicles[0].name='Autre appareil';
 assert.equal((await store.reconcile(changed)).conflict,true);
 assert.equal((await store.read()).vehicles[0].name,'Saisie hors ligne');assert.equal((await store.pending()).length,1);
 const revision=(await store.read()).revision;
 await assert.rejects(()=>store.reconcile(changed,{choice:'remote',expectedRevision:revision-1}),/autre saisie/);
 await store.reconcile(changed,{choice:'local',expectedRevision:revision});
 assert.equal((await store.pending()).length,1);assert.equal((await store.pending())[0].baseVersion,2);
 const versions=await store.recoveries();assert.equal(versions.length,1);assert.equal(versions[0].remote.vehicles[0].name,'Autre appareil');assert.equal(versions[0].local.vehicles[0].name,'Saisie hors ligne');store.close();
});
test('choix serveur explicite conserve une copie et vide la file atomiquement',async()=>{
 const store=await openStore(crypto.randomUUID());await store.save(demo(),null);
 const remote={...demo(),serverVersion:5};await store.reconcile(remote,{choice:'remote',expectedRevision:1});
 assert.equal((await store.pending()).length,0);assert.equal((await store.read()).serverVersion,5);assert.equal((await store.recoveries()).length,1);
 assert.equal((await store.reconcile({...remote,serverVersion:4})).stale,true);assert.equal((await store.read()).serverVersion,5);store.close();
});
test('confirmation tardive ne fait jamais reculer la version serveur',async()=>{
 const store=await openStore(crypto.randomUUID());await store.save(demo(),null);
 const id=(await store.pending())[0].id;await store.acknowledge(id,3);await store.acknowledge(id,1);
 assert.equal((await store.read()).serverVersion,3);store.close();
});
