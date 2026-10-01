import * as Core from './core.js';
import * as Legacy from './legacy-v1.js';

const assert = (condition, message) => { if (!condition) throw Error(message); };
const cents = amount => Math.round(amount * 100);

export function validateFleet(state) {
  Core.validate(state);
  const pairs = new Set();
  for (const link of state.loanVehicles) {
    assert(state.loans.some(x => x.id === link.loanId), 'Prêt associé introuvable.');
    assert(state.vehicles.some(x => x.id === link.vehicleId), 'Véhicule associé introuvable.');
    assert(Number.isFinite(link.amount) && link.amount >= 0 && link.amount <= 1e12 && Number.isSafeInteger(cents(link.amount)) && Math.abs(link.amount * 100 - cents(link.amount)) < 0.001, 'Allocation de financement invalide.');
    const pair = `${link.loanId}/${link.vehicleId}`;
    assert(!pairs.has(pair), 'Véhicule associé deux fois au même prêt.');
    pairs.add(pair);
  }
  for (const loan of state.loans) {
    const links = state.loanVehicles.filter(x => x.loanId === loan.id);
    assert(links.length > 0 && links.reduce((n,x) => n + cents(x.amount), 0) === cents(loan.principal), 'Le total des allocations doit correspondre au capital emprunté.');
  }
  for (const movement of state.movements) {
    assert(!(movement.vehicleId && movement.loanId), 'Choisissez un véhicule ou un financement partagé pour ce mouvement.');
  }
  return state;
}

// Largest remainder allocation in cents: each cent belongs to exactly one vehicle.
export function allocate(amount, links) {
  if (!links.length) return [];
  const total = links.reduce((n,x) => n + cents(x.amount), 0);
  if(total===0){assert(amount===0,'Allocation absente.');return links.map(x=>({vehicleId:x.vehicleId,amount:0}));}
  const absolute = Math.abs(cents(amount));
  const parts = links.map(x => {
    const product = BigInt(absolute) * BigInt(cents(x.amount));
    return {vehicleId:x.vehicleId,units:Number(product / BigInt(total)),remainder:product % BigInt(total)};
  });
  let remaining = absolute - parts.reduce((n,x) => n + x.units, 0);
  const ranked = [...parts].sort((a,b) => a.remainder === b.remainder ? a.vehicleId.localeCompare(b.vehicleId) : a.remainder > b.remainder ? -1 : 1);
  for (let i=0; i<remaining; i++) ranked[i].units++;
  return parts.map(x => ({vehicleId:x.vehicleId,amount:Math.sign(amount)*x.units/100}));
}

export function vehicleState(state, vehicleId) {
  assert(state.vehicles.some(x => x.id === vehicleId), 'Véhicule introuvable.');
  const scoped = structuredClone(state);
  const share = (loanId, amount) => allocate(amount,state.loanVehicles.filter(x=>x.loanId===loanId)).find(x=>x.vehicleId===vehicleId)?.amount ?? 0;
  for (const key of ['days','expenses','maintenance','wages','driverPayments']) scoped[key]=state[key].filter(x=>x.vehicleId===vehicleId);
  scoped.vehicles = state.vehicles.filter(x=>x.id===vehicleId);
  scoped.loanVehicles = state.loanVehicles.filter(x=>x.vehicleId===vehicleId);
  const loans = new Set(scoped.loanVehicles.map(x=>x.loanId));
  scoped.loans = state.loans.filter(x=>loans.has(x.id)).map(x=>({...x,principal:share(x.id,x.principal)}));
  scoped.loanPayments = state.loanPayments.filter(x=>loans.has(x.loanId)).map(x=>({...x,principal:share(x.loanId,x.principal),interest:share(x.loanId,x.interest),fees:share(x.loanId,x.fees)}));
  scoped.movements = state.movements.filter(x=>x.vehicleId===vehicleId || loans.has(x.loanId)).map(x=>x.loanId?{...x,amount:share(x.loanId,x.amount)}:x);
  return scoped;
}

export function fleetStats(state, from, to, vehicleId) {
  return Core.stats(vehicleId ? vehicleState(state,vehicleId) : state,from,to);
}

export function migrateV1(input, uuid = () => crypto.randomUUID()) {
  const original = Legacy.parseBackup(typeof input === 'string' ? input : JSON.stringify(input));
  const state = structuredClone(original);
  const maps = Object.fromEntries(Legacy.collections.map(key=>[key,new Map(state[key].map(x=>[x.id,uuid()]))]));
  const refs = {vehicleId:'vehicles',driverId:'drivers',ownerId:'owners',loanId:'loans'};
  const vehicleId = maps.vehicles.get(original.vehicles[0].id);
  for (const key of Legacy.collections) for (const record of state[key]) {
    record.id = maps[key].get(record.id);
    for (const [field,target] of Object.entries(refs)) if (record[field]) record[field]=maps[target].get(record[field]);
  }
  state.loanVehicles=state.loans.map(loan=>({id:uuid(),loanId:loan.id,vehicleId:loan.vehicleId,amount:loan.principal}));
  state.loans.forEach(loan=>delete loan.vehicleId);
  for (const key of ['wages','driverPayments','movements']) for (const record of state[key]) record.vehicleId=vehicleId;
  state.schemaVersion=2;
  state.revision=0;
  validateFleet(state);
  assert(JSON.stringify(Core.stats(state))===JSON.stringify(Legacy.stats(original)), 'Import interrompu : les totaux financiers diffèrent.');
  return state;
}

export function parseBackup(text) {
  let envelope;
  try { envelope=JSON.parse(text); } catch { throw Error('Fichier JSON invalide. Aucune donnée modifiée.'); }
  if (envelope?.formatVersion===1) return migrateV1(text);
  return validateFleet(Core.parseBackup(text));
}

export function backup(state) { validateFleet(state); return Core.backup(state); }
export function demo() { return migrateV1(Legacy.backup(Legacy.demo())); }

export async function importFingerprint(text) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
