import {readFile,writeFile} from 'node:fs/promises';
let source=await readFile(new URL('../../01 Projet à reproduire/NR-TRANS/app/app.js',import.meta.url),'utf8');
source=source.replace("import * as C from './core.js';",`import * as Base from '../domain/core.js';
import * as Fleet from '../domain/fleet.js';
const C={...Base,validate:Fleet.validateFleet,demo:Fleet.demo,backup:Fleet.backup,parseBackup:Fleet.parseBackup,stats:(s,from,to)=>Fleet.fleetStats(s,from,to,scope),ledger:s=>Base.ledger(scope?Fleet.vehicleState(s,scope):s)};
let scope='',driverScope='';
const currentVehicle=()=>state.vehicles.find(v=>v.id===scope)||state.vehicles[0];
const currentDriver=()=>state.drivers.find(d=>d.id===driverScope)||state.drivers[0];`);
source=source.replace("import * as DB from './storage.js';","import * as DB from '../app-store.js';");
source=source.replaceAll("$('#app')","$('#workspace')");
source=source.replaceAll('state.vehicles[0]','currentVehicle()').replaceAll('state.drivers[0]','currentDriver()');
// Fix accessors after mechanical replacement.
source=source.replace('||currentVehicle();','||state.vehicles[0];').replace('||currentDriver();','||state.drivers[0];');
source=source.replace("const selected=a=>a.filter(x=>C.inPeriod(x,from,to));","const selected=a=>a.filter(x=>C.inPeriod(x,from,to)&&(!scope||!x.vehicleId||x.vehicleId===scope));");
source=source.replace("['dashboard','◫','Tableau de bord']","['dashboard','◫','Tableau de bord'],['fleet','▱','Véhicules']");
source=source.replace('dashboard:dashboard,','fleet:fleetPage,dashboard:dashboard,');
source=source.replace("dashboard:'Gardez une vue précise sur votre transport familial.'","fleet:'Votre parc, vos véhicules et leurs performances.',dashboard:'Une vue claire sur votre activité de transport.'");
source=source.replace("const actions={dashboard:","const actions={fleet:'<button class=\"primary\" id=\"add-vehicle\">+ Ajouter un véhicule</button>',dashboard:");
source=source.replace("loans:state.loans.length?'<button class=\"primary\" data-add=\"loanPayments\">+ Enregistrer un paiement</button>':'<button class=\"primary\" data-add=\"loans\">+ Configurer le prêt</button>'","loans:'<button data-add=\"loans\">+ Nouveau prêt</button><button class=\"primary\" data-add=\"loanPayments\">+ Enregistrer un paiement</button>'");
source=source.replaceAll('<div class="brand">NR-TRANS<small>GESTION DE TRANSPORT</small></div>','<a class="brand" href="/"><img src="/brand/icon.webp" alt="NR-TRANS" width="46" height="46"><span>NR-TRANS<small>Gestion de transport</small></span></a>');
source=source.replace('${period()}','${period()}');
source=source.replace('<div class="heading"><div><h1>${names[page]}','<div class="fleet-filter"><label>Vue du parc<select id="vehicle-scope"><option value="">Tous les véhicules</option>${state.vehicles.map(v=>`<option value="${esc(v.id)}" ${v.id===scope?\'selected\':\'\'}>${esc(v.name)}</option>`).join(\'\')}</select></label><label>Chauffeur<select id="driver-scope">${state.drivers.map(d=>`<option value="${esc(d.id)}" ${d.id===currentDriver().id?\'selected\':\'\'}>${esc(d.name)}</option>`).join(\'\')}</select></label></div><div class="heading"><div><h1>${names[page]}');
source=source.replace("function bind(){","function bind(){bindFleet();");
source=source.replace("if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>toast('Cache hors ligne indisponible. Le lanceur local reste utilisable.'));",'');
source=source.replace('href="diagnostic.html"','href="/diagnostic"');
source=source.replace("case 'days':return [...common,","case 'days':return [...common,field('vehicleId','Véhicule','select',state.vehicles.map(v=>[v.id,v.name]),currentVehicle().id),field('driverId','Chauffeur','select',state.drivers.map(d=>[d.id,d.name]),currentDriver().id),");
for(const type of ['expenses','maintenance'])source=source.replace(`case '${type}':return [...common,`,`case '${type}':return [...common,field('vehicleId','Véhicule','select',state.vehicles.map(v=>[v.id,v.name]),currentVehicle().id),`);
for(const type of ['wages','driverPayments'])source=source.replace(`case '${type}':return [...common,`,`case '${type}':return [...common,field('vehicleId','Véhicule d’affectation','select',state.vehicles.map(v=>[v.id,v.name]),currentVehicle().id),field('driverId','Chauffeur','select',state.drivers.map(d=>[d.id,d.name]),currentDriver().id),`);
source=source.replace("case 'movements':return [...common,","case 'movements':return [...common,field('vehicleId','Véhicule (ou trésorerie commune)','select',[['','Commun au parc'],...state.vehicles.map(v=>[v.id,v.name])],scope),");
source=source.replace("if(['days','expenses','maintenance','loans'].includes(collection))record.vehicleId=currentVehicle().id;if(['days','wages','driverPayments'].includes(collection))record.driverId=currentDriver().id;if(['days','wages'].includes(collection))record.terms=old?.terms||C.terms(currentDriver());","if(['days','wages'].includes(collection))record.terms=old?.terms||C.terms(state.drivers.find(d=>d.id===record.driverId));");
source=source.replace("await mutate(s=>{if(id)s[collection]","await mutate(s=>{if(collection==='loans'){const allocations=state.vehicles.map(v=>({id:crypto.randomUUID(),loanId:record.id,vehicleId:v.id,amount:Number(form.elements['allocation_'+v.id]?.value||0)})).filter(a=>a.amount>0);s.loanVehicles=s.loanVehicles.filter(a=>a.loanId!==record.id).concat(allocations);}if(id)s[collection]");
source=source.replace("const modal=$('#modal');modal.innerHTML=","const modal=$('#modal');modal.innerHTML=");
source=source.replace("${fields.map(f=>input(f,old?.[f.name])).join('')}</div>","${fields.map(f=>input(f,old?.[f.name])).join('')}${collection==='loans'?state.vehicles.map(v=>`<label>Financement attribué · ${esc(v.name)}<input type=\"number\" min=\"0\" step=\"0.01\" name=\"allocation_${v.id}\" value=\"${state.loanVehicles.find(a=>a.loanId===id&&a.vehicleId===v.id)?.amount||0}\"></label>`).join(''):''}</div>");
source=source.replace("await mutate(s=>s[collection]=s[collection].filter(x=>x.id!==id));","await mutate(s=>{s[collection]=s[collection].filter(x=>x.id!==id);if(collection==='loans')s.loanVehicles=s.loanVehicles.filter(a=>a.loanId!==id);});");
source=source.replace("s[key.startsWith('v_')?'vehicles':key.startsWith('d_')?'drivers':'settings'][0]||s.settings","key.startsWith('v_')?s.vehicles.find(v=>v.id===currentVehicle().id):key.startsWith('d_')?s.drivers.find(d=>d.id===currentDriver().id):s.settings");
source=source.replace('Pour changer de chauffeur réel ou de véhicule, conservez une sauvegarde puis démarrez une base distincte.','Sélectionnez le véhicule et le chauffeur à modifier dans les filtres.');
source=source.replace("Math.max(v.initialKm,...state.days.map(d=>d.kmEnd))","Math.max(v.initialKm,...state.days.filter(d=>d.vehicleId===v.id).map(d=>d.kmEnd))");
source=source.replace("Math.max(currentVehicle().initialKm,...state.days.map(d=>d.kmEnd))","Math.max(currentVehicle().initialKm,...state.days.filter(d=>d.vehicleId===currentVehicle().id).map(d=>d.kmEnd))");
source=source.replace("if(!state){$('#workspace')","if(!state){$('#workspace')");
source=source.replace("$('#start-demo').onclick=","if(!DB.isDemo())$('#start-demo').remove();if($('#start-demo'))$('#start-demo').onclick=");
source=source.replace("for(const type of ['demo','empty'])if($('#reset-'+type))","for(const type of (DB.isDemo()?['demo','empty']:[]))if($('#reset-'+type))");
source += `
function fleetPage(){return '<div class="fleet-grid">'+state.vehicles.map(v=>{const s=Fleet.fleetStats(state,from,to,v.id);return '<section class="panel vehicle-card"><div class="vehicle-symbol">▱</div><span class="tag">'+esc(v.status)+'</span><h2>'+esc(v.name)+'</h2><p class="sub">'+esc(v.plate||'Immatriculation à renseigner')+'</p><div class="metricrow"><span>Versements</span><b>'+money(s.revenue)+'</b></div><div class="metricrow"><span>Résultat</span><b>'+money(s.profit)+'</b></div><button data-vehicle="'+esc(v.id)+'">Consulter ce véhicule</button></section>';}).join('')+'</div><section class="panel"><h2>Chauffeurs</h2>'+state.drivers.map(d=>'<div class="metricrow"><span>'+esc(d.name)+'</span><span>'+esc(d.status)+'</span></div>').join('')+'<button id="add-driver">Ajouter un chauffeur</button></section>';}
function bindFleet(){
 if($('#vehicle-scope'))$('#vehicle-scope').onchange=e=>{scope=e.target.value;render();};
 if($('#driver-scope'))$('#driver-scope').onchange=e=>{driverScope=e.target.value;render();};
 document.querySelectorAll('[data-vehicle]').forEach(b=>b.onclick=()=>{scope=b.dataset.vehicle;page='dashboard';render();});
 if($('#add-vehicle'))$('#add-vehicle').onclick=()=>simpleEntity('vehicles');
 if($('#add-driver'))$('#add-driver').onclick=()=>simpleEntity('drivers');
 if(!DB.canWrite())document.querySelectorAll('[data-add],[data-edit],[data-delete],#add-vehicle,#add-driver,#settings-form button,#reset-demo,#reset-empty,#import').forEach(e=>e.disabled=true);
 if(!DB.isDemo()){if($('#reset-demo'))$('#reset-demo').remove();if($('#reset-empty'))$('#reset-empty').remove();}
}
function simpleEntity(collection){
 const modal=$('#modal');modal.innerHTML='<h2>Ajouter '+(collection==='vehicles'?'un véhicule':'un chauffeur')+'</h2><form id="entity-form"><label>Nom<input name="name" required maxlength="120"></label><label>'+(collection==='vehicles'?'Immatriculation':'Téléphone')+'<input name="detail" maxlength="40"></label><div class="error" role="alert"></div><div class="formfoot"><button type="button" id="cancel">Annuler</button><button class="primary">Enregistrer</button></div></form>';modal.showModal();$('#cancel').onclick=()=>modal.close();$('#entity-form').onsubmit=async e=>{e.preventDefault();try{const data=new FormData(e.target),blank=Base.blank()[collection][0],record={...blank,id:crypto.randomUUID(),name:data.get('name')};record[collection==='vehicles'?'plate':'phone']=data.get('detail');await mutate(s=>s[collection].push(record));modal.close();}catch(error){modal.querySelector('.error').textContent=error.message;}};
}
`;
await writeFile(new URL('../src/ui/operations.js',import.meta.url),source);
