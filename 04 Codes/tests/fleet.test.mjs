import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../src/domain/legacy-v1.js';
import * as C from '../src/domain/core.js';
import * as F from '../src/domain/fleet.js';

test('import v1 préserve les totaux et les snapshots, sans modifier la source',()=>{
 const original=L.demo(),text=JSON.stringify(L.backup(original));
 const result=F.migrateV1(text);
 assert.deepEqual(C.stats(result),L.stats(original));
 assert.deepEqual(result.days.map(d=>d.terms),original.days.map(d=>d.terms));
 assert.equal(result.loanVehicles.length,original.loans.length);
 assert.equal(original.schemaVersion,1);
 assert.ok(result.vehicles.every(v=>/^[a-f0-9-]{36}$/.test(v.id)));
 assert.deepEqual(C.stats(F.parseBackup(JSON.stringify(F.backup(result)))),C.stats(result));
});
test('kilométrages indépendants et journée unique par véhicule',()=>{
 const s=F.demo(),v=s.vehicles[0];
 s.vehicles.push({...v,id:crypto.randomUUID(),initialKm:0});
 s.days.push({...s.days[0],id:crypto.randomUUID(),vehicleId:s.vehicles[1].id,kmStart:0,kmEnd:20});
 F.validateFleet(s);
 s.days.push({...s.days.at(-1),id:crypto.randomUUID()});
 assert.throws(()=>F.validateFleet(s),/Une seule journée/);
});
test('prêt partagé : aucun double comptage et centimes conservés',()=>{
 const s=F.demo(),v=s.vehicles[0],loan=s.loans[0];
 s.vehicles.push({...v,id:crypto.randomUUID(),initialKm:0});
 s.loanVehicles=[{id:'a',loanId:loan.id,vehicleId:v.id,amount:loan.principal/2},{id:'b',loanId:loan.id,vehicleId:s.vehicles[1].id,amount:loan.principal/2}];
 F.validateFleet(s);
 const a=F.fleetStats(s,undefined,undefined,v.id),b=F.fleetStats(s,undefined,undefined,s.vehicles[1].id),all=C.stats(s);
 for(const key of ['revenue','costs','wage','paid','interest','loanPaid','profit','balance','cashChange'])assert.equal(C.round(a[key]+b[key]),all[key],key);
 assert.equal(C.sum(F.allocate(0.01,s.loanVehicles)),0.01);
 assert.equal(C.sum(F.allocate(-0.01,s.loanVehicles)),-0.01);
 s.loanVehicles[0].amount++;
 assert.throws(()=>F.validateFleet(s),/total des allocations/);
});
test('références et allocations invalides sont refusées',()=>{
 const s=F.demo(); s.loanVehicles[0].vehicleId='missing';
 assert.throws(()=>F.validateFleet(s),/Véhicule associé/);
 assert.throws(()=>F.parseBackup('{'));
 assert.throws(()=>F.parseBackup(JSON.stringify({format:'NR-TRANS',formatVersion:999})));
});
test('empreinte stable permettant de détecter un fichier réimporté',async()=>{
 assert.equal(await F.importFingerprint('original'),await F.importFingerprint('original'));
 assert.notEqual(await F.importFingerprint('original'),await F.importFingerprint('autre'));
});
