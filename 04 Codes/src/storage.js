import {validateFleet} from './domain/fleet.js';

export function openStore(identity) {
  if(!identity || !/^[a-zA-Z0-9:_-]+$/.test(identity))throw Error('Identité de stockage invalide.');
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(`nr-trans-v2:${identity}`,2);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains('state'))request.result.createObjectStore('state');
      if(!request.result.objectStoreNames.contains('outbox'))request.result.createObjectStore('outbox',{keyPath:'id'});
      if(!request.result.objectStoreNames.contains('imports'))request.result.createObjectStore('imports');
      if(!request.result.objectStoreNames.contains('recoveries'))request.result.createObjectStore('recoveries',{keyPath:'id'});
    };
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>resolve(new LocalStore(request.result));
  });
}

class LocalStore {
  constructor(db){this.db=db;db.onversionchange=()=>db.close();}
  close(){this.db.close();}
  async read(){return this.get('state','main');}
  get(store,key){return new Promise((resolve,reject)=>{const request=this.db.transaction(store).objectStore(store).get(key);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error);});}
  pending(){return new Promise((resolve,reject)=>{const request=this.db.transaction('outbox').objectStore('outbox').getAll();request.onsuccess=()=>resolve(request.result.sort((a,b)=>a.localRevision-b.localRevision));request.onerror=()=>reject(request.error);});}
  save(state,expectedRevision,{queue=true,fingerprint=null}={}){
    validateFleet(state);
    return new Promise((resolve,reject)=>{
      const tx=this.db.transaction(['state','outbox','imports'],'readwrite'),store=tx.objectStore('state');
      let next,error;
      const fail=message=>{error=Error(message);tx.abort();};
      const write=()=>{
        const request=store.get('main');
        request.onsuccess=()=>{
          const previous=request.result;
          if((previous?.revision??null)!==expectedRevision)return fail('Les données ont changé dans un autre onglet. Rechargez avant de réessayer.');
          next=structuredClone(state);next.revision=(previous?.revision??0)+1;next.serverVersion=previous?.serverVersion??state.serverVersion??0;
          store.put(next,'main');
          if(fingerprint)tx.objectStore('imports').put(new Date().toISOString(),fingerprint);
          if(queue)tx.objectStore('outbox').add({id:crypto.randomUUID(),createdAt:new Date().toISOString(),localRevision:next.revision,baseVersion:previous?.serverVersion??0,state:next,status:'pending'});
        };
      };
      if(fingerprint){const request=tx.objectStore('imports').get(fingerprint);request.onsuccess=()=>request.result?fail('Cette sauvegarde a déjà été importée.'):write();}else write();
      tx.oncomplete=()=>resolve(next);
      tx.onabort=()=>reject(error||Error('Enregistrement impossible. Les données précédentes sont conservées.'));
      tx.onerror=()=>{};
    });
  }
  acknowledge(id,serverVersion){return new Promise((resolve,reject)=>{
    const tx=this.db.transaction(['state','outbox'],'readwrite'),outbox=tx.objectStore('outbox');
    outbox.delete(id);
    const stateRequest=tx.objectStore('state').get('main');
    stateRequest.onsuccess=()=>{
     const version=Math.max(serverVersion,stateRequest.result?.serverVersion??0);
     if(stateRequest.result)tx.objectStore('state').put({...stateRequest.result,serverVersion:version},'main');
     const remaining=outbox.getAll();remaining.onsuccess=()=>{for(const item of remaining.result)outbox.put({...item,baseVersion:version});};
    };
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Confirmation locale interrompue.'));
  });}
  conflict(){return this.get('state','conflict');}
  recoveries(){return new Promise((resolve,reject)=>{const r=this.db.transaction('recoveries').objectStore('recoveries').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  reconcile(remote,{choice=null,expectedRevision=null}={}){
   validateFleet(remote);if(!Number.isSafeInteger(remote.serverVersion)||remote.serverVersion<0)throw Error('Version serveur invalide.');
   return new Promise((resolve,reject)=>{
    const tx=this.db.transaction(['state','outbox','recoveries'],'readwrite'),states=tx.objectStore('state'),outbox=tx.objectStore('outbox');let answer,error;
    const request=states.get('main');
    request.onsuccess=()=>{
     const local=request.result;
     if(choice&&local?.revision!==expectedRevision){error=Error('Une autre saisie a été enregistrée. Comparez de nouveau les versions.');tx.abort();return;}
     const pending=outbox.getAll();pending.onsuccess=()=>{
      if(remote.serverVersion<(local?.serverVersion??0)){answer={changed:false,stale:true};return;}
      if(!choice&&pending.result.length){
       if(remote.serverVersion>(local?.serverVersion??0)){states.put({remote,localRevision:local.revision},'conflict');answer={changed:false,conflict:true};}
       else answer={changed:false,conflict:false};return;
      }
      if(!choice&&local&&remote.serverVersion===local.serverVersion){states.delete('conflict');answer={changed:false};return;}
      if(choice&&!['local','remote'].includes(choice)){error=Error('Choix de résolution invalide.');tx.abort();return;}
      if(choice){tx.objectStore('recoveries').add({id:crypto.randomUUID(),at:new Date().toISOString(),choice,local,remote});outbox.clear();}
      const next=structuredClone(choice==='local'?local:remote);next.revision=(local?.revision??0)+1;next.serverVersion=remote.serverVersion;
      states.put(next,'main');states.delete('conflict');
      if(choice==='local')outbox.add({id:crypto.randomUUID(),createdAt:new Date().toISOString(),localRevision:next.revision,baseVersion:remote.serverVersion,state:next,status:'pending'});
      answer={changed:true,conflict:false,state:next};
     };
    };
    tx.oncomplete=()=>resolve(answer);tx.onabort=()=>reject(error||Error('Récupération interrompue. Vos données sont conservées.'));tx.onerror=()=>{};
   });
  }
}

// A failed request or conflict leaves the mutation intact. The server must deduplicate id.
const flights=new WeakMap();
export async function synchronize(store,send){
 if(flights.has(store))return flights.get(store);
 const work=()=>drain(store,send);
 const promise=globalThis.navigator?.locks ? navigator.locks.request('nr-sync:'+store.db.name,work) : work();
 flights.set(store,promise);
 try{return await promise;}finally{flights.delete(store);}
}
async function drain(store,send){
  let sent=0;
  while(true){
    const [operation]=await store.pending();
    if(!operation)break;
    const response=await send(operation);
    if(response.conflict)return {sent,conflict:true,operation};
    if(!Number.isInteger(response.version))throw Error('Réponse de synchronisation invalide.');
    await store.acknowledge(operation.id,response.version);sent++;
    // Refetch after each acknowledgement: the expected version has changed.
  }
  return {sent,conflict:false};
}
