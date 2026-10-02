import test from 'node:test';import assert from 'node:assert/strict';import {orderRequest,clearOrderRequest} from '../src/order-request.js';
test('commande : reprise réseau/rechargement stable, organisation et contenu isolés',()=>{
 const items=new Map(),store={getItem:k=>items.get(k),setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};let n=0;const id=()=>String(++n),values={plan:'avance',months:1,code:'',method:'cash'};
 const a=orderRequest(store,'a',values,id);assert.equal(orderRequest(store,'a',values,id).idempotencyKey,a.idempotencyKey);
 assert.notEqual(orderRequest(store,'b',values,id).idempotencyKey,a.idempotencyKey);
 assert.notEqual(orderRequest(store,'a',{...values,months:3},id).idempotencyKey,a.idempotencyKey);
 clearOrderRequest(store,'a');assert.equal(items.has('nr-order-request:a'),false);
 assert.ok(orderRequest(store,'a',values,id).idempotencyKey);
});
