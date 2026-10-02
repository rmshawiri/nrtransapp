import * as Core from './core.js';
export function driverSummary(state,driverId,from='0000-01-01',to='9999-12-31',vehicleId=''){
 const belongs=row=>row.driverId===driverId&&(!vehicleId||row.vehicleId===vehicleId);
 const filtered={...state,days:state.days.filter(belongs),wages:state.wages.filter(belongs),driverPayments:state.driverPayments.filter(belongs)};
 const {wage,paid,worked,revenue,gap}=Core.stats(filtered,from,to);
 return {wage,paid,worked,revenue,gap};
}
export function missingSalaryMonths(state,driverId='',vehicleId=''){
 const months=new Map();
 for(const day of state.days){if(day.status!=='Travaillé'||day.terms.mode!=='fixed'||driverId&&day.driverId!==driverId||vehicleId&&day.vehicleId!==vehicleId)continue;
 const month=day.date.slice(0,7);if(!state.wages.some(w=>w.driverId===day.driverId&&w.date.startsWith(month)&&(!vehicleId||w.vehicleId===vehicleId)))months.set(day.driverId+':'+month,{driverId:day.driverId,month});}
 return [...months.values()];
}
