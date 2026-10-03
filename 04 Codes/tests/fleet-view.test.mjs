import test from 'node:test';import assert from 'node:assert/strict';
import {maintenanceAlerts,capitalRemaining} from '../src/domain/fleet-view.js';
import * as Fleet from '../src/domain/fleet.js';
test('rappels: chaque véhicule utilise son kilométrage et le filtre est respecté',()=>{
 const state={vehicles:[{id:'a',initialKm:10000},{id:'b',initialKm:100}],days:[],maintenance:[{id:'a',vehicleId:'a',nextKm:10300},{id:'b',vehicleId:'b',nextKm:2000},{id:'date',vehicleId:'b',nextDate:'2026-10-05'}]};
 assert.deepEqual(maintenanceAlerts(state,'','2026-10-03').map(x=>x.id),['a','date']);
 assert.deepEqual(maintenanceAlerts(state,'b','2026-10-03').map(x=>x.id),['date']);
 state.days.push({vehicleId:'b',kmEnd:1700});
 assert.deepEqual(maintenanceAlerts(state,'b','2026-10-03').map(x=>x.id),['b','date']);
});
test('capital du tableau de bord: somme des allocations égale flotte sans prêts étrangers',()=>{
 const s=Fleet.demo(),loan=s.loans[0],a=s.vehicles[0].id,b=crypto.randomUUID();s.vehicles.push({...s.vehicles[0],id:b});
 s.loanVehicles=[{loanId:loan.id,vehicleId:a,amount:loan.principal*.3},{loanId:loan.id,vehicleId:b,amount:loan.principal*.7}];
 assert.equal(Math.round((capitalRemaining(s,a)+capitalRemaining(s,b))*100),Math.round(capitalRemaining(s)*100));
 assert.equal(capitalRemaining(s,'absent'),0);
});
