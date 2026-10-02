// A lost response must reuse the same server idempotency key, including after reload.
export function orderRequest(storage,organizationId,values,makeId=()=>crypto.randomUUID()){
 const key='nr-order-request:'+organizationId,signature=JSON.stringify(values);let saved;
 try{saved=JSON.parse(storage.getItem(key));}catch{}
 if(saved?.signature!==signature||typeof saved?.id!=='string'){
  saved={signature,id:makeId()};storage.setItem(key,JSON.stringify(saved));
 }
 return {...values,idempotencyKey:saved.id};
}
export function clearOrderRequest(storage,organizationId){storage.removeItem('nr-order-request:'+organizationId);}
