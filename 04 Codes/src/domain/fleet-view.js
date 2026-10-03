import * as Core from './core.js';
import {allocate} from './fleet.js';

export function maintenanceAlerts(state,vehicleId='',today=Core.today()){
 const near=Core.addPeriod(today,2,'weekly');
 const mileage=new Map(state.vehicles.map(v=>[v.id,Math.max(v.initialKm,...state.days.filter(d=>d.vehicleId===v.id).map(d=>d.kmEnd))]));
 return state.maintenance.filter(m=>(!vehicleId||m.vehicleId===vehicleId)&&((m.nextDate&&m.nextDate<=near)||(m.nextKm>0&&m.nextKm<=(mileage.get(m.vehicleId)??0)+500)));
}
export function capitalRemaining(state,vehicleId=''){
 return Core.sum(state.loans,loan=>{
  const balance=Core.loanBalance(state,loan.id);
  return vehicleId?allocate(balance,state.loanVehicles.filter(a=>a.loanId===loan.id)).find(a=>a.vehicleId===vehicleId)?.amount??0:balance;
 });
}
