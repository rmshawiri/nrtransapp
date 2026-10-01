export const PRICES = Object.freeze({avance:Object.freeze({1:2500,3:6000,6:12000,12:18000}),vip:Object.freeze({1:5000,3:13500,6:27000,12:48000})});
export const DURATIONS = Object.freeze([1,3,6,12]);
export const SITE_URL = 'https://nr-trans.morashawiri.com';
export const DEFAULT_POLICY = Object.freeze({planChange:null,secondaryUserLimit:null});
const requireThat=(condition,message)=>{if(!condition)throw Error(message);};
const validDate=value=>{const d=new Date(value);requireThat(Number.isFinite(d.getTime()),'Date invalide.');return d;};

export function price(plan,months) {
  requireThat(Object.hasOwn(PRICES,plan)&&DURATIONS.includes(months),'Offre ou durée invalide.');
  return PRICES[plan][months];
}

// Call with trusted promotion and usage records loaded by the server transaction.
export function quote({plan,months,promotion=null,globalUses=0,clientUses=0,now=new Date()}) {
  const subtotal=price(plan,months);
  let discount=0;
  if(promotion) {
    const p=promotion,instant=validDate(now).getTime();
    requireThat(p.active===true,'Ce code promotionnel est désactivé.');
    requireThat(!p.startsAt || instant>=validDate(p.startsAt).getTime(),'Ce code n’est pas encore disponible.');
    requireThat(!p.endsAt || instant<validDate(p.endsAt).getTime(),'Ce code promotionnel a expiré.');
    requireThat(p.maxUses==null || globalUses<p.maxUses,'Ce code a atteint sa limite d’utilisation.');
    requireThat(p.maxPerClient==null || clientUses<p.maxPerClient,'Vous avez atteint la limite d’utilisation de ce code.');
    requireThat(!p.plans?.length || p.plans.includes(plan),'Ce code ne s’applique pas à cette offre.');
    requireThat(!p.months?.length || p.months.includes(months),'Ce code ne s’applique pas à cette durée.');
    requireThat(subtotal>=(p.minimum??0),'Le montant minimum du code n’est pas atteint.');
    requireThat(Number.isFinite(p.value)&&p.value>=0,'Valeur promotionnelle invalide.');
    requireThat(['fixed','percent'].includes(p.type),'Type promotionnel invalide.');
    requireThat(p.type!=='percent'||p.value<=100,'Le pourcentage ne peut dépasser 100 %.');
    discount=Math.min(subtotal,p.type==='percent'?Math.round(subtotal*p.value/100):Math.round(p.value));
  }
  return {plan,months,subtotal,discount,total:subtotal-discount,savings:PRICES[plan][1]*months-subtotal};
}

export function addMonths(value,months) {
  requireThat(Number.isInteger(months)&&months>0,'Durée invalide.');
  const date=validDate(value),day=date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth()+months);
  date.setUTCDate(Math.min(day,new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()));
  return date.toISOString();
}

export function activation({current=null,plan,months,now=new Date(),policy=DEFAULT_POLICY}) {
  price(plan,months);
  const instant=validDate(now);
  const active=current && validDate(current.endsAt)>instant;
  let startsAt=instant.toISOString();
  if(active && current.plan===plan) startsAt=validDate(current.endsAt).toISOString();
  else if(active && current.plan!=='gratuit' && current.plan!==plan) {
    requireThat(policy.planChange==='at_expiry','La règle de changement d’offre doit être configurée avant activation.');
    startsAt=validDate(current.endsAt).toISOString();
  }
  return {plan,startsAt,endsAt:addMonths(startsAt,months),scheduled:validDate(startsAt)>instant};
}

export function trial(now=new Date()) {
  const date=validDate(now);
  return {plan:'gratuit',startsAt:date.toISOString(),endsAt:new Date(date.getTime()+7*86400000).toISOString()};
}
export function entitlement(subscription,vehicleCount=0,now=new Date()) {
  const active=!!subscription && ['gratuit','avance','vip'].includes(subscription.plan) && validDate(subscription.startsAt)<=validDate(now) && validDate(subscription.endsAt)>validDate(now);
  return {canRead:true,canWrite:active,canAddVehicle:active&&(subscription.plan==='vip'||vehicleCount<1),vehicleLimit:subscription?.plan==='vip'?null:1};
}

const TRANSITIONS={awaiting_payment:['declared','cancelled','expired'],declared:['reviewing','rejected'],reviewing:['approved','rejected'],rejected:['declared','cancelled'],approved:[],cancelled:[],expired:[]};
export function transitionOrder(order,next,actor) {
  requireThat(TRANSITIONS[order.status]?.includes(next),'Transition de commande invalide.');
  const admin=['reviewing','approved','rejected','expired'].includes(next);
  requireThat(admin?actor.isAdmin===true:actor.userId===order.ownerId,'Action non autorisée.');
  return {...order,status:next};
}
