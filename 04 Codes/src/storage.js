import {validateFleet} from './domain/fleet.js';

export function openStore(identity) {
  if(!identity || !/^[a-zA-Z0-9:_-]+$/.test(identity))throw Error('Identité de stockage invalide.');
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(`nr-trans-v2:${identity}`,1);
    request.onupgradeneeded=()=>{
      request.result.createObjectStore('state');
      request.result.createObjectStore('outbox',{keyPath:'id'});
      request.result.createObjectStore('imports');
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
          next=structuredClone(state);next.revision=(previous?.revision??0)+1;
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
    stateRequest.onsuccess=()=>{if(stateRequest.result)tx.objectStore('state').put({...stateRequest.result,serverVersion},'main');};
    const remaining=outbox.getAll();
    remaining.onsuccess=()=>{for(const item of remaining.result)outbox.put({...item,baseVersion:serverVersion});};
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Confirmation locale interrompue.'));
  });}
}

// A failed request or conflict leaves the mutation intact. The server must deduplicate id.
export async function synchronize(store,send){
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
