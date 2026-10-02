import {openStore,synchronize} from './storage.js';
import * as Fleet from './domain/fleet.js';
import * as Core from './domain/core.js';
let store,context;
export function configure(value){context=value;}
export async function openDB(){
  if(!context)throw Error('Session non initialisée.');
  store=await openStore(context.identity);
  if(context.initialState&&!context.demo)await store.reconcile(context.initialState);
}
export async function read(){
 let state=await store.read();
 if(!state && context.demo)state=await store.save(Fleet.demo(),null,{queue:false});
 if(!state && context.initialState)state=await store.save(context.initialState,null,{queue:false});
 return state;
}
export async function save(next,revision,options={}){
 if(!canWrite())throw Error('Votre accès est en lecture seule. Vos données restent disponibles.');
 const saved=await store.save(next,revision,{...options,queue:!context.demo});
 window.dispatchEvent(new Event('nr-data-saved'));
 return saved;
}
export async function sync(send){return synchronize(store,send);}
export async function pending(){return store.pending();}
export function isDemo(){return context?.demo===true;}
export function canWrite(){return context?.demo||context?.canWrite&&Date.parse(context.subscription?.endsAt)>Date.now();}
export function closeDB(){store?.close();}
export async function initialize(){return save(Core.blank(),null);}
export async function reconcile(remote,options){const result=await store.reconcile(remote,options);if(result.changed)window.dispatchEvent(new Event('nr-data-refreshed'));return result;}
export async function conflict(){return store.conflict();}
export async function recoveries(){return store.recoveries();}
export async function current(){return store.read();}
export function updateContext(next){context={...context,...next};}
