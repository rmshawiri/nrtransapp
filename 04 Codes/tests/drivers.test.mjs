import test from 'node:test';import assert from 'node:assert/strict';import {blank} from '../src/domain/core.js';import {driverSummary,missingSalaryMonths} from '../src/domain/drivers.js';
test('deux conducteurs : rémunérations isolées et périmètre véhicule respecté',()=>{
 const s=blank(),terms={mode:'commission',commission:500,tranche:5000,rule:'full'};
 const day=(driverId,vehicleId,actual)=>({id:crypto.randomUUID(),date:'2026-10-01',driverId,vehicleId,actual,expected:actual,status:'Travaillé',terms,kmStart:0,kmEnd:10,fuel:0});
 s.days=[day('a','v1',10000),day('a','v2',5000),day('b','v1',20000)];s.driverPayments=[{id:'p',date:'2026-10-01',driverId:'b',vehicleId:'v1',amount:2000}];
 assert.deepEqual(driverSummary(s,'a'),{wage:1500,paid:0,worked:2,revenue:15000,gap:0});assert.equal(driverSummary(s,'a',undefined,undefined,'v1').wage,1000);assert.equal(driverSummary(s,'b').paid,2000);
 s.days.forEach(d=>d.terms={mode:'fixed'});s.wages=[{driverId:'b',vehicleId:'v1',date:'2026-10-01',amount:20000}];assert.deepEqual(missingSalaryMonths(s),[{driverId:'a',month:'2026-10'}]);
});
