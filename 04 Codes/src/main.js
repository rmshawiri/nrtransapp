import {commercialOverview} from './ui/commercial-overview.js';
import {recordsPanel} from './ui/account-records.js';
import {notificationsPanel} from './ui/notifications.js';
import {orderRequest,clearOrderRequest} from './order-request.js';
import {paymentDetail,orderStatus} from './ui/payment-detail.js';
import {commercialPanel} from './ui/commercial-admin.js';
import {membersPanel} from './ui/members.js';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import './ui/operations.css';
import './style.css';
import {createClient} from '@supabase/supabase-js';
import {home,header,footer,pricing,legal,logo,esc,money} from './ui/public.js';
import {PRICES,price,SITE_URL} from './domain/commercial.js';
import * as Store from './app-store.js';
import {rememberContext,offlineContext,forgetContext} from './offline-session.js';
import * as Core from './domain/core.js';

const root=document.querySelector('#root');
const path=location.pathname.replace(/\/$/,'')||'/';
let client,config,session;
const toast=message=>{const el=document.querySelector('#toast');el.textContent=message;el.style.display='block';setTimeout(()=>el.style.display='none',6000);};
async function settings(){
 if(config)return config;
 try{const response=await fetch('/api/config');if(!response.ok)throw Error();config=await response.json();localStorage.setItem('nr-public-config',JSON.stringify(config));}
 catch{try{config=JSON.parse(localStorage.getItem('nr-public-config'));}catch{}if(!config)throw Error('Connectez cet appareil à Internet pour sa première ouverture.');}
 if(config.supabaseUrl&&config.publishableKey)client=createClient(config.supabaseUrl,config.publishableKey);
 return config;
}
async function api(action,body){
 await settings();
 const {data}=await client.auth.getSession();
 const response=await fetch('/api/platform?action='+encodeURIComponent(action),{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session?.access_token||''}`},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json();
 if(!response.ok)throw Error(result.message||'L’opération n’a pas abouti.');
 return result;
}
function bindPublic(){
 document.querySelector('.nav-toggle')?.addEventListener('click',e=>{const h=document.querySelector('.public-header');h.classList.toggle('expanded');e.currentTarget.setAttribute('aria-expanded',h.classList.contains('expanded'));});
 document.querySelectorAll('[data-duration]').forEach(b=>b.onclick=()=>{document.querySelector('#pricing-root').innerHTML=pricing(Number(b.dataset.duration));bindPublic();});
}
function alertForm(form,message){let el=form.querySelector('.error');if(!el){el=document.createElement('p');el.className='error';el.setAttribute('role','alert');form.append(el);}el.textContent=message;}
function authLayout(title,body){return `<div class="auth-layout"><aside>${logo()}<a class="back-home" href="/">Retour à l’accueil</a><div><span class="eyebrow">VOTRE ACTIVITÉ MÉRITE UNE VUE CLAIRE</span><h2>Des comptes clairs.<br>Des décisions<br><em>plus sereines.</em></h2><p>Retrouvez vos véhicules, vos opérations et vos indicateurs dans un seul espace.</p></div><small>NR-TRANS · Une solution MORA Shawiri</small></aside><main><div class="auth-content"><h1>${title}</h1>${body}</div></main></div>`;}
async function authPage(){
 const recovery=path==='/recuperation',reset=path==='/nouveau-mot-de-passe';
 root.innerHTML=authLayout(reset?'Votre nouveau mot de passe':recovery?'Retrouvez votre accès.':'Heureux de vous retrouver.',`<p class="sub">${recovery?'Nous vous enverrons un lien de récupération.':'Connectez-vous à votre espace NR-TRANS.'}</p><form id="auth-form">${reset?'':'<label>Adresse email<input type="email" name="email" autocomplete="email" required></label>'}${recovery?'':'<label>Mot de passe<input type="password" name="password" autocomplete="'+(reset?'new-password':'current-password')+'" minlength="10" required></label>'}<div class="error" role="alert"></div><button class="primary large">${recovery?'Recevoir le lien':reset?'Enregistrer le mot de passe':'Se connecter'}</button></form><a href="/recuperation">Mot de passe oublié ?</a><p>Vous découvrez NR-TRANS ? <a href="/inscription">Commencer gratuitement</a></p><a href="/demo">Explorer la démonstration</a>`);
 document.querySelector('#auth-form').onsubmit=async e=>{e.preventDefault();const form=e.target,button=form.querySelector('button');button.disabled=true;try{await settings();if(!client)throw Error('La connexion au service n’est pas configurée.');const data=new FormData(form);let result;if(recovery)result=await client.auth.resetPasswordForEmail(data.get('email'),{redirectTo:location.origin+'/nouveau-mot-de-passe'});else if(reset)result=await client.auth.updateUser({password:data.get('password')});else result=await client.auth.signInWithPassword({email:data.get('email'),password:data.get('password')});if(result.error)throw Error(recovery?'Le lien n’a pas pu être envoyé. Réessayez.':'Vérifiez vos identifiants ou réessayez dans quelques instants.');if(recovery){form.innerHTML='<p class="notice">Si cette adresse correspond à un compte, vous recevrez un lien de récupération.</p>';}else location.assign('/client');}catch(error){alertForm(form,error.message);}finally{button.disabled=false;}};
}
function signup(){
 const invited=!!sessionStorage.getItem('nr-invitation');
 const params=new URLSearchParams(location.search);
 let step=0,values={plan:['avance','vip'].includes(params.get('plan'))?params.get('plan'):'gratuit',months:[1,3,6,12].includes(Number(params.get('months')))?Number(params.get('months')):1},password='';
 const names=['Votre compte','Votre activité','Votre formule','Récapitulatif'];
 const render=()=>{
  const amount=values.plan==='gratuit'?0:price(values.plan,values.months);
  const screens=[`<label>Adresse email<input name="email" type="email" autocomplete="email" value="${esc(values.email)}" required></label><label>Mot de passe<input name="password" type="password" autocomplete="new-password" minlength="10" required value="${esc(password)}"></label><p class="sub">Au moins 10 caractères. Choisissez un mot de passe unique.</p>`,`<label>Votre nom<input name="name" autocomplete="name" value="${esc(values.name)}" maxlength="120" required></label><label>Nom de votre activité<input name="business" value="${esc(values.business)}" maxlength="160" required></label><label>Téléphone<input name="phone" type="tel" autocomplete="tel" value="${esc(values.phone)}" maxlength="40"></label>`,`<div class="plan-options">${[['gratuit','Gratuit','7 jours · 1 véhicule'],['avance','Avancé','1 véhicule'],['vip','VIP','Véhicules illimités']].map(([v,n,d])=>`<label><input type="radio" name="plan" value="${v}" ${values.plan===v?'checked':''}><span><b>${n}</b><small>${d}</small></span></label>`).join('')}</div><label>Durée<select name="months">${[1,3,6,12].map(m=>`<option value="${m}" ${m===values.months?'selected':''}>${m} mois</option>`).join('')}</select></label><p class="signup-price">${money(amount)} ${values.plan==='gratuit'?'pour 7 jours':''}</p><small>Les codes promotionnels sont appliqués à la commande après création du compte.</small>`,`<div class="order-summary"><div><span>Votre activité</span><b>${esc(values.business)}</b></div><div><span>Formule</span><b>${values.plan==='gratuit'?'Gratuit · 7 jours':values.plan==='vip'?'VIP':'Avancé'}</b></div><div><span>Durée</span><b>${values.plan==='gratuit'?'7 jours':values.months+' mois'}</b></div><div class="total"><span>Prix de référence</span><b>${money(amount)}</b></div></div><label class="check"><input type="checkbox" required> J’ai lu les <a href="/conditions" target="_blank" rel="noopener">conditions d’utilisation</a> et la <a href="/confidentialite" target="_blank" rel="noopener">politique de confidentialité</a>.</label>`];
  if(invited){screens[1]='<label>Votre nom<input name="name" autocomplete="name" maxlength="120" required value="'+esc(values.name)+'"></label><label>Téléphone<input name="phone" type="tel" maxlength="40" value="'+esc(values.phone)+'"></label>';screens[2]='<h2>Accès en lecture seule</h2><p>Vous rejoignez une activité existante. Le propriétaire définit les véhicules que vous pourrez consulter. Aucun abonnement personnel n’est nécessaire.</p>';screens[3]='<p>Utilisez l’adresse destinataire de l’invitation. Votre rattachement sera vérifié après confirmation de votre adresse.</p><label><input type="checkbox" required> J’accepte les <a href="/conditions" target="_blank" rel="noopener">conditions d’utilisation</a>.</label>';}
  root.innerHTML=authLayout('Votre prochaine étape<br>commence ici.',`<div class="signup-progress"><span>0${step+1} / 04</span><b>${names[step]}</b><progress value="${step+1}" max="4"></progress></div><form id="signup-form">${screens[step]}<div class="error" role="alert"></div><div class="formfoot">${step?'<button type="button" id="previous">Retour</button>':''}<button class="primary">${step===3?'Créer mon compte':'Continuer'}</button></div></form><p>Déjà un compte ? <a href="/connexion">Se connecter</a></p>`);
  document.querySelector('#previous')?.addEventListener('click',()=>{step--;render();});
  if(step===2&&!invited)document.querySelector('#signup-form').onchange=e=>{const data=new FormData(e.currentTarget);values.plan=data.get('plan');values.months=Number(data.get('months'));document.querySelector('.signup-price').textContent=money(values.plan==='gratuit'?0:price(values.plan,values.months));};
  document.querySelector('#signup-form').onsubmit=async e=>{e.preventDefault();const form=e.target,data=new FormData(form);if(step<3){for(const [key,value] of data){if(key==='password')password=value;else values[key]=key==='months'?Number(value):value;}step++;render();return;}const button=form.querySelector('.primary');button.disabled=true;try{await settings();if(!config.ready)throw Error('Les inscriptions ne sont pas encore ouvertes. Vous pouvez explorer la démonstration ou contacter MORA Shawiri.');const {error}=await client.auth.signUp({email:values.email,password,options:{emailRedirectTo:location.origin+'/client'+(sessionStorage.getItem('nr-invitation')?'?invitation='+encodeURIComponent(sessionStorage.getItem('nr-invitation')):''),data:{display_name:values.name,business_name:values.business,phone:values.phone}}});if(error)throw Error('L’inscription n’a pas abouti. Vérifiez votre adresse ou réessayez.');password='';if(!invited)sessionStorage.setItem('nr-selected-offer',JSON.stringify({plan:values.plan,months:values.months}));root.innerHTML=authLayout('Vérifiez votre messagerie.',`<p>Un lien de confirmation peut vous être envoyé pour finaliser votre inscription. Consultez également les courriers indésirables.</p><a class="button primary" href="/client">Accéder à mon espace</a>`);}catch(error){alertForm(form,error.message);button.disabled=false;}};
 };render();
}

async function privateContext(){
 const incoming=new URL(location.href).searchParams.get('invitation');
 if(incoming&&/^[0-9a-f-]{36}$/i.test(incoming))sessionStorage.setItem('nr-invitation',incoming);
 if(path==='/app'&&!navigator.onLine){const cached=offlineContext();if(cached){session={id:cached.userId};return cached;}}
 await settings();if(!client){location.replace('/connexion');return null;}
 const {data,error}=await client.auth.getUser();if(error||!data.user){location.replace('/connexion');return null;}
 session=data.user;
 const invitation=sessionStorage.getItem('nr-invitation');
 if(invitation){await api('accept-invitation',{token:invitation});sessionStorage.removeItem('nr-invitation');history.replaceState(null,'',location.pathname);}
 const context=await api('context');rememberContext(session,context);return context;
}
async function workspace(){
 const demo=path==='/demo';
 let context;
 if(demo)context={identity:'demo',demo:true,canWrite:true};
 else {const remote=await privateContext();if(!remote)return;if(!remote.organizationId){if(remote.isAdmin)location.assign('/admin');else root.innerHTML=authLayout('Accès désactivé.','<p>Contactez le propriétaire de votre activité.</p><a href="/client">Mon compte</a>');return;}if(remote.role==='viewer'){renderViewer(remote);return;}context={...remote,identity:session.id+':'+remote.organizationId,demo:false};}
 Store.configure(context);
 const embed=new URLSearchParams(location.search).has('embed');
 if(embed)document.body.classList.add('embedded');
 root.innerHTML=`<div class="app-globalbar"><a href="/">Accueil</a><span>${demo?'Démonstration · Données fictives':'Mon activité'}</span><button id="sync-state">${demo?'Enregistré sur cet appareil':'Synchronisation'}</button><button id="recoveries" ${demo?'hidden':''}>Versions conservées</button><a class="button small" href="${demo?'/inscription':'/client'}">${demo?'Créer mon compte':'Mon espace client'}</a></div><div id="workspace"></div><dialog id="sync-conflict"></dialog>`;
 await import('./ui/operations.js');
 let syncing=false;
 const resolveConflict=async()=>{
  const conflict=await Store.conflict();if(!conflict)return;
  const local=await Store.current(),remote=conflict.remote,dialog=document.querySelector('#sync-conflict');
  const summary=s=>`${s.days.length} journées · ${s.expenses.length} dépenses · trésorerie ${money(Core.stats(s).balance)}`;
  dialog.innerHTML=`<h2>Deux versions à comparer</h2><p>Une autre session a modifié cette activité. Vos saisies sont conservées sur cet appareil.</p><p><b>Sur cet appareil</b><br>${esc(summary(local))}</p><p><b>Sur le serveur · version ${remote.serverVersion}</b><br>${esc(summary(remote))}</p><p>Le choix s’applique à toute l’activité. Les deux versions seront archivées sur cet appareil et téléchargeables dans « Versions conservées ».</p><div class="formfoot"><button data-choice="remote">Reprendre la version serveur</button><button class="primary" data-choice="local">Envoyer ma version locale</button><button data-close>Décider plus tard</button></div><p class="error" role="alert"></p>`;
  if(!dialog.open)dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-choice]').forEach(button=>button.onclick=async()=>{try{await Store.reconcile(remote,{choice:button.dataset.choice,expectedRevision:local.revision});dialog.close();await sync();}catch(e){dialog.querySelector('.error').textContent=e.message;}});
 };
 const sync=async()=>{
  const indicator=document.querySelector('#sync-state');if(demo){indicator.textContent='Démonstration locale';return;}if(syncing)return;
  if(!navigator.onLine){indicator.textContent='Hors ligne · Saisies conservées';return;}syncing=true;
  try{indicator.textContent='Synchronisation…';const refreshed=await api('context');if(refreshed.userId!==session.id||refreshed.organizationId!==context.organizationId)throw Error('Le compte connecté a changé. Rechargez avant de synchroniser.');Store.updateContext(refreshed);rememberContext(session,refreshed);
   const result=await Store.sync(op=>api('sync',op));
   const {state:remote}=await api('snapshot');await Store.reconcile(remote);
   if(result.conflict||await Store.conflict()){indicator.textContent='Conflit · Comparer les versions';await resolveConflict();}
   else indicator.textContent=refreshed.canWrite?'Synchronisé':'Lecture seule · Abonnement expiré';
  }catch(e){indicator.textContent='En attente · Réessayer';indicator.title=e.message;}finally{syncing=false;}
 };
 document.querySelector('#sync-state').onclick=async()=>{if(await Store.conflict())await resolveConflict();else await sync();};
 document.querySelector('#recoveries').onclick=async()=>{const versions=await Store.recoveries(),dialog=document.querySelector('#sync-conflict');dialog.innerHTML='<h2>Versions conservées</h2><p>Chaque fichier peut être restauré depuis le module Sauvegarde.</p>'+versions.map((v,i)=>`<article class="record-card"><b>${esc(new Date(v.at).toLocaleString('fr-FR'))}</b><button data-version="${i}" data-source="local">Télécharger la version locale</button><button data-version="${i}" data-source="remote">Télécharger la version serveur</button></article>`).join('')+(versions.length?'':'<p>Aucun conflit résolu sur cet appareil.</p>')+'<button data-close>Fermer</button>';dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>downloadJSON(Core.backup(versions[Number(b.dataset.version)][b.dataset.source]),'nr-trans-recovery-'+b.dataset.source+'.json'));};
 window.addEventListener('nr-data-saved',sync);window.addEventListener('online',sync);window.addEventListener('offline',sync);await sync();
}

function downloadJSON(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderViewer(ctx){
 const s=ctx.initialState;
 root.innerHTML=accountShell('Votre activité en lecture seule',`<p class="notice">Seuls les véhicules qui vous sont attribués sont affichés. Les financements partagés avec d’autres véhicules sont masqués.</p><div class="cards">${s.vehicles.map(v=>`<article class="card"><h2>${esc(v.name)}</h2><p>${esc(v.plate)}</p><b>${money(s.days.filter(d=>d.vehicleId===v.id).reduce((n,d)=>n+d.actual,0))}</b><p>Versements enregistrés</p></article>`).join('')||'<p>Aucun véhicule attribué.</p>'}</div><section class="panel"><h2>Journées de transport</h2>${s.days.map(d=>`<article class="record-card"><strong>${esc(d.date)}</strong><span>${esc(s.vehicles.find(v=>v.id===d.vehicleId)?.name)}</span><b>${money(d.actual)}</b><p>${esc(d.status)}</p></article>`).join('')||'<p>Aucune journée.</p>'}</section><section class="panel"><h2>Dépenses et entretiens</h2>${[...s.expenses,...s.maintenance].map(e=>`<article class="record-card"><strong>${esc(e.date)}</strong><span>${esc(e.category||e.type)}</span><b>${money(e.amount??e.cost)}</b></article>`).join('')||'<p>Aucune dépense.</p>'}</section>`);
 document.querySelectorAll('[data-account-tab]').forEach(b=>b.remove());document.querySelector('#logout').onclick=async()=>{forgetContext();await client.auth.signOut();location.assign('/connexion');};
}

function accountShell(title,content,admin=false){return `<div class="account-layout"><aside><a class="brand" href="/"><img src="/brand/icon.webp" alt="NR-TRANS" width="44" height="44"><span>NR-TRANS</span></a><span class="eyebrow">${admin?'ADMINISTRATION':'MON ESPACE'}</span><nav>${(admin?['Vue d’ensemble','Clients','Abonnements','Lecteurs','Statistiques','Commandes','Paiements','Codes promo','Avis','Notifications','Moyens de paiement','Paramètres','Journal']:['Vue d’ensemble','Abonnement','Commandes','Paiements','Utilisateurs','Avis','Notifications','Profil','Sécurité','Assistance']).map((n,i)=>`<button data-account-tab="${i}" class="${i===0?'active':''}">${n}</button>`).join('')}</nav><a class="button" href="/app">Ouvrir NR-TRANS</a><button id="logout">Se déconnecter</button></aside><main><div class="account-top"><span>${admin?'MORA SHAWIRI / ADMINISTRATION':'NR-TRANS / MON COMPTE'}</span><a href="/app">Accéder à l’application ↗</a></div><h1>${title}</h1><div id="account-content">${content}</div></main></div>`;}
async function account(){
 const admin=path==='/admin',ctx=await privateContext();if(!ctx)return;
 if(admin&&!ctx.isAdmin){root.innerHTML=authLayout('Accès réservé.','<p>Votre compte ne dispose pas des droits d’administration.</p><a href="/client">Retour à mon espace</a>');return;}
 let data=await api(admin?'admin':'client');
 const overview=()=>admin?commercialOverview(data,{esc,money}):`<p class="sub">${admin?'Suivez l’activité commerciale de NR-TRANS.':'Votre compte, votre abonnement et vos prochaines étapes.'}</p><div class="cards"><article class="card highlight"><span>Abonnement</span><div class="value">${esc(data.subscription?.plan||(data.subscriptions?.length?'Expiré':'Aucun abonnement actif'))}</div><p>${data.subscription?.endsAt?'Expire le '+new Date(data.subscription.endsAt).toLocaleDateString('fr-FR'):'Votre compte'}</p></article><article class="card"><span>Véhicules</span><div class="value">${data.vehicleCount??0}</div><a href="/app">Consulter mon parc</a></article><article class="card"><span>Commandes</span><div class="value">${data.orders?.length??0}</div></article><article class="card"><span>Notifications</span><div class="value">${data.notifications?.length??0}</div></article></div><section class="panel"><h2>Tout est prêt pour votre prochaine journée.</h2><p>Retrouvez vos versements, vos dépenses et vos indicateurs dans l’application.</p><a class="button primary" href="/app">Ouvrir mon tableau de bord</a> <a class="button" href="/paiement">Renouveler mon abonnement</a></section>`;
 root.innerHTML=accountShell(admin?'Tableau de bord commercial':'Bonjour, '+esc(data.profile?.display_name||'bienvenue'),overview(),admin);
 document.querySelector('#logout').onclick=async()=>{Store.closeDB();forgetContext();await client.auth.signOut();location.assign('/connexion');};
 document.querySelectorAll('[data-account-tab]').forEach(button=>button.onclick=()=>{
  document.querySelectorAll('[data-account-tab]').forEach(b=>b.classList.toggle('active',b===button));
  const area=document.querySelector('#account-content'),tab=button.textContent;
  if(admin&&['Paramètres','Codes promo','Commandes','Paiements','Avis','Moyens de paiement'].includes(tab)){commercialPanel(area,tab,{api,esc,money}).catch(e=>{area.textContent=e.message;});return;}
  if((admin&&['Clients','Abonnements','Lecteurs','Statistiques','Journal'].includes(tab))||(!admin&&tab==='Paiements')){recordsPanel(area,tab,{api,esc,money,admin}).catch(e=>{area.textContent=e.message;});return;}
  if(tab==='Notifications'){notificationsPanel(area,{admin,api,esc}).catch(e=>{area.textContent=e.message;});return;}
  if(tab==='Vue d’ensemble'){api(admin?'admin':'client').then(next=>{data=next;area.innerHTML=overview();}).catch(e=>{area.textContent=e.message;});return;}
  if(tab==='Utilisateurs'&&!admin){if(ctx.role!=='owner'){area.innerHTML='<p>Gestion réservée au propriétaire.</p>';return;}membersPanel(area,{api,esc}).catch(e=>{area.textContent=e.message;});return;}
  if(tab==='Abonnement'){area.innerHTML=`<section class="panel"><h2>Historique de mes abonnements</h2>${(data.subscriptions||[]).map(s=>`<article class="record-card"><strong>${esc(s.plan_id)}</strong><p>Du ${new Date(s.starts_at).toLocaleDateString('fr-FR')} au ${new Date(s.ends_at).toLocaleDateString('fr-FR')}</p><span>${Date.parse(s.starts_at)>Date.now()?'À venir':Date.parse(s.ends_at)>Date.now()?'En cours':'Terminé'}</span></article>`).join('')||'<p>Aucun abonnement enregistré.</p>'}</section><div id="pricing-root">${pricing()}</div><a class="button primary" href="/paiement">Renouveler ou choisir une offre</a>`;bindPublic();return;}
  if(tab==='Profil'&&!admin){area.innerHTML='<section class="panel"><h2>Mon profil</h2><form id="profile-form"><label>Nom<input name="name" required maxlength="120"></label><label>Téléphone<input name="phone" maxlength="40"></label><button class="primary">Enregistrer</button><p class="error" role="alert"></p></form></section>';const f=area.querySelector('form');f.elements.name.value=data.profile?.display_name||'';f.elements.phone.value=data.profile?.phone||'';f.onsubmit=async e=>{e.preventDefault();try{await api('profile',{name:f.elements.name.value,phone:f.elements.phone.value});data.profile={display_name:f.elements.name.value,phone:f.elements.phone.value};toast('Profil enregistré.');}catch(e){alertForm(f,e.message);}};return;}
  if(tab==='Assistance'){area.innerHTML='<section class="panel"><h2>Comment pouvons-nous vous aider ?</h2><p>Contactez l’équipe MORA Shawiri.</p><a class="button primary" href="https://wa.me/2694306306">Ouvrir WhatsApp</a> <a href="mailto:nrtransapp@morashawiri.com">Envoyer un email</a></section>';return;}
  if(tab==='Sécurité'){area.innerHTML='<section class="panel"><h2>Protéger votre compte</h2><a class="button" href="/recuperation">Changer mon mot de passe</a><button id="logout-all">Déconnecter toutes mes sessions</button></section>';document.querySelector('#logout-all').onclick=async()=>{await client.auth.signOut({scope:'global'});location.assign('/connexion');};return;}
  if(tab==='Avis'&&!admin){area.innerHTML='<section class="panel"><h2>Votre expérience nous intéresse.</h2><form id="review-form"><label>Votre note<select name="rating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><label>Votre commentaire<textarea name="comment" required maxlength="2000"></textarea></label><p>Votre avis sera modéré avant publication.</p><button class="primary">Envoyer mon avis</button><div class="error" role="alert"></div></form></section>';document.querySelector('#review-form').onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target);await api('review',{rating:Number(f.get('rating')),comment:f.get('comment')});toast('Avis transmis pour modération.');e.target.reset();}catch(error){alertForm(e.target,error.message);}};return;}
  const rows=tab==='Commandes'?data.orders:tab==='Paiements'?data.payments:tab==='Notifications'?data.notifications:tab==='Utilisateurs'?data.members:tab==='Clients'?data.clients:tab==='Codes promo'?data.promotions:tab==='Avis'?data.reviews:tab==='Journal'?data.audit:[];
  area.innerHTML=`<section class="panel"><h2>${esc(tab)}</h2>${rows?.length?rows.map(r=>`<article class="record-card"><strong>${esc(r.reference||r.title||r.display_name||r.code||r.id)}</strong><span>${esc(orderStatus[r.status]||r.status||r.role||'')}</span><p>${esc(r.message||r.comment||'')}</p>${r.total!=null?'<b>'+money(r.total)+'</b>':''}${!admin&&tab==='Commandes'?'<a class="button" href="/paiement?order='+encodeURIComponent(r.id)+'">Consulter / reprendre</a>':''}</article>`).join(''):'<p class="empty">Aucun élément à afficher pour le moment.</p>'}</section>`;
 });
}

async function checkout(){
 const ctx=await privateContext();if(!ctx)return;
 const orderId=new URL(location.href).searchParams.get('order');if(orderId){await paymentDetail(root,orderId,{api,client,esc,money,layout:authLayout});return;}
 const methods=await api('payment-methods');
 root.innerHTML=`${header()}<main class="checkout section"><span class="eyebrow">VOTRE ABONNEMENT NR-TRANS</span><h1>Une offre pour votre activité.</h1><form id="checkout-form"><label>Formule<select name="plan"><option value="avance">Avancé · 1 véhicule</option><option value="vip">VIP · Plusieurs véhicules</option></select></label><label>Durée<select name="months">${[1,3,6,12].map(m=>`<option value="${m}">${m} mois</option>`).join('')}</select></label><label>Code promotionnel<input name="code" maxlength="50" autocomplete="off"></label><button type="button" id="quote">Vérifier mon récapitulatif</button><div id="quote-result" aria-live="polite"></div><label>Moyen de paiement<select name="method" required>${methods.map(m=>`<option value="${esc(m.id)}" ${m.status!=='active'?'disabled':''}>${esc(m.name)}${m.status==='soon'?' · Bientôt disponible':m.status==='disabled'?' · Indisponible':''}</option>`).join('')}</select></label><div class="error" role="alert"></div><button class="primary">Créer ma commande</button></form></main>${footer()}`;
 const form=document.querySelector('#checkout-form');const values=()=>{const f=new FormData(form);return {plan:f.get('plan'),months:Number(f.get('months')),code:f.get('code'),method:f.get('method')};};
 document.querySelector('#quote').onclick=async()=>{try{const q=await api('quote',values());document.querySelector('#quote-result').innerHTML=`<div class="order-summary"><div><span>Prix officiel</span><b>${money(q.subtotal)}</b></div><div><span>Réduction</span><b>−${money(q.discount)}</b></div><div class="total"><span>Total validé</span><b>${money(q.total)}</b></div></div>`;}catch(error){alertForm(form,error.message);}};
 form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button.primary');button.disabled=true;try{const result=await api('order',orderRequest(sessionStorage,ctx.organizationId,values()));clearOrderRequest(sessionStorage,ctx.organizationId);location.assign('/paiement?order='+encodeURIComponent(result.id));}catch(error){alertForm(form,error.message);button.disabled=false;}};
 bindPublic();
}

try{
 if(path==='/'){root.innerHTML=home();fetch('/api/platform?action=public-reviews').then(r=>r.ok?r.json():null).then(data=>{const section=document.querySelector('#public-reviews');if(!section||!data?.reviews?.length)return;section.querySelector('.feature-grid').innerHTML=data.reviews.map(r=>'<article><b>'+esc(r.author_name)+'</b><p aria-label="Note">'+esc(r.rating)+' / 5</p><p>'+esc(r.comment)+'</p></article>').join('');section.hidden=false;}).catch(()=>{});}
 else if(path==='/tarifs')root.innerHTML=header()+'<main id="pricing-root">'+pricing()+'</main>'+footer();
 else if(['/confidentialite','/conditions','/mentions-legales'].includes(path))root.innerHTML=legal(path.slice(1));
 else if(path==='/inscription')signup();
 else if(['/connexion','/recuperation','/nouveau-mot-de-passe'].includes(path))await authPage();
 else if(['/app','/demo'].includes(path))await workspace();
 else if(['/client','/admin'].includes(path))await account();
 else if(path==='/paiement')await checkout();
 else root.innerHTML=authLayout('Cette page est introuvable.','<a class="button primary" href="/">Retour à l’accueil</a>');
 bindPublic();
}catch(error){root.innerHTML=authLayout('Nous n’avons pas pu ouvrir cet espace.',`<p role="alert">${esc(error.message)}</p><button onclick="location.reload()">Réessayer</button> <a href="/demo">Explorer la démonstration</a>`);}
if('serviceWorker' in navigator && import.meta.env.PROD){
 navigator.serviceWorker.register('/sw.js').then(registration=>{
  const offer=()=>{if(!registration.waiting||document.querySelector('#app-update'))return;const button=document.createElement('button');button.id='app-update';button.className='pwa-update';button.textContent='Nouvelle version disponible · Mettre à jour';button.onclick=async()=>{if(document.querySelector('dialog[open]')){toast('Fermez le formulaire avant la mise à jour.');return;}try{if((await Store.pending()).length){toast('Synchronisez vos saisies avant la mise à jour.');return;}}catch{}navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});registration.waiting.postMessage('ACTIVATE_UPDATE');};document.body.append(button);};
  offer();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',offer));
 }).catch(()=>{});
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();const button=document.createElement('button');button.className='pwa-install';button.textContent='Installer NR-TRANS';button.onclick=async()=>{await event.prompt();button.remove();};document.body.append(button);});
