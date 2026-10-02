(async()=>{
 const cached=JSON.parse(localStorage.getItem('nr-trans-offline-context'));
 const name='nr-trans-v2:'+cached.userId+':'+cached.context.organizationId;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const tx=db.transaction(['state','outbox']),read=(s,k)=>new Promise((resolve,reject)=>{const r=k?tx.objectStore(s).get(k):tx.objectStore(s).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const [state,pending]=await Promise.all([read('state','main'),read('outbox')]);db.close();
 return {state,pending,status:document.querySelector('#sync-state')?.textContent};
})()
