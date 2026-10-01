import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/domain/commercial.js';
test('les huit prix officiels sont exacts, sans quota opérations',()=>{
 assert.deepEqual([1,3,6,12].map(m=>C.price('avance',m)),[2500,6000,12000,18000]);
 assert.deepEqual([1,3,6,12].map(m=>C.price('vip',m)),[5000,13500,27000,48000]);
 assert.throws(()=>C.price('__proto__',1));assert.throws(()=>C.price('vip','1'));assert.throws(()=>C.price('vip',2));
});
test('promos fixe, pourcentage et cadeau 100 %',()=>{
 const args={plan:'vip',months:6};
 assert.equal(C.quote({...args,promotion:{active:true,type:'percent',value:10}}).total,24300);
 assert.equal(C.quote({...args,promotion:{active:true,type:'fixed',value:1000}}).total,26000);
 assert.equal(C.quote({...args,promotion:{active:true,type:'percent',value:100}}).total,0);
 assert.equal(C.quote({...args,promotion:{active:true,type:'fixed',value:99999}}).total,0);
});
test('restrictions promo et expiration sont vérifiées',()=>{
 const base={active:true,type:'percent',value:10},args={plan:'avance',months:1,now:'2026-10-01T00:00:00Z'};
 for(const change of [{active:false},{endsAt:args.now},{startsAt:'2026-10-02'},{maxUses:0},{maxPerClient:0},{plans:['vip']},{months:[12]},{minimum:3000},{value:101},{value:-1},{type:'unknown'}])assert.throws(()=>C.quote({...args,promotion:{...base,...change}}));
});
test('renouvellement conserve le reliquat et gère la fin de mois',()=>{
 const result=C.activation({current:{plan:'avance',endsAt:'2026-11-20T10:00:00Z'},plan:'avance',months:6,now:'2026-11-10T10:00:00Z'});
 assert.equal(result.startsAt,'2026-11-20T10:00:00.000Z');assert.equal(result.endsAt,'2027-05-20T10:00:00.000Z');
 assert.equal(C.addMonths('2028-01-31T12:00:00Z',1),'2028-02-29T12:00:00.000Z');
});
test('changement de forfait non décidé refusé, date différée configurable',()=>{
 const args={current:{plan:'vip',endsAt:'2026-11-20'},plan:'avance',months:1,now:'2026-10-01'};
 assert.throws(()=>C.activation(args),/configurée/);
 assert.equal(C.activation({...args,policy:{planChange:'at_expiry'}}).startsAt,'2026-11-20T00:00:00.000Z');
});
test('essai 7 jours, expiration lecture seule et VIP multi-véhicules',()=>{
 const trial=C.trial('2026-10-01T12:00:00Z');assert.equal(trial.endsAt,'2026-10-08T12:00:00.000Z');
 assert.deepEqual(C.entitlement(trial,1,'2026-10-08T12:00:00Z'),{canRead:true,canWrite:false,canAddVehicle:false,vehicleLimit:1});
 assert.equal(C.entitlement(trial,1,'2026-10-02').canAddVehicle,false);
 assert.equal(C.entitlement({...trial,plan:'vip'},20,'2026-10-02').canAddVehicle,true);
});
test('validation paiement réservée admin et approbation non répétable',()=>{
 const order={status:'reviewing',ownerId:'owner'};
 assert.throws(()=>C.transitionOrder(order,'approved',{userId:'owner',isAdmin:false}));
 const approved=C.transitionOrder(order,'approved',{isAdmin:true});
 assert.throws(()=>C.transitionOrder(approved,'approved',{isAdmin:true}));
});
