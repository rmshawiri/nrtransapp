import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import './ui/operations.css';
import './style.css';
import {createClient} from '@supabase/supabase-js';
import {home,header,footer,pricing,legal,logo,esc,money} from './ui/public.js';
import {PRICES,price,SITE_URL} from './domain/commercial.js';
import * as Store from './app-store.js';

const root=document.querySelector('#root');
const path=location.pathname.replace(/\/$/,'')||'/';
let client,config,session;
const toast=message=>{const el=document.querySelector('#toast');el.textContent=message;el.style.display='block';setTimeout(()=>el.style.display='none',6000);};
async function settings(){
 if(config)return config;
 const response=await fetch('/api/config');
 if(!response.ok)throw Error('Le service est momentanément indisponible. Réessayez dans quelques instants.');
 config=await response.json();
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
 const params=new URLSearchParams(location.search);
 let step=0,values={plan:['avance','vip'].includes(params.get('plan'))?params.get('plan'):'gratuit',months:[1,3,6,12].includes(Number(params.get('months')))?Number(params.get('months')):1},password='';
 const names=['Votre compte','Votre activité','Votre formule','Récapitulatif'];
 const render=()=>{
  const amount=values.plan==='gratuit'?0:price(values.plan,values.months);
  const screens=[`<label>Adresse email<input name="email" type="email" autocomplete="email" value="${esc(values.email)}" required></label><label>Mot de passe<input name="password" type="password" autocomplete="new-password" minlength="10" required value="${esc(password)}"></label><p class="sub">Au moins 10 caractères. Choisissez un mot de passe unique.</p>`,`<label>Votre nom<input name="name" autocomplete="name" value="${esc(values.name)}" maxlength="120" required></label><label>Nom de votre activité<input name="business" value="${esc(values.business)}" maxlength="160" required></label><label>Téléphone<input name="phone" type="tel" autocomplete="tel" value="${esc(values.phone)}" maxlength="40"></label>`,`<div class="plan-options">${[['gratuit','Gratuit','7 jours · 1 véhicule'],['avance','Avancé','1 véhicule'],['vip','VIP','Véhicules illimités']].map(([v,n,d])=>`<label><input type="radio" name="plan" value="${v}" ${values.plan===v?'checked':''}><span><b>${n}</b><small>${d}</small></span></label>`).join('')}</div><label>Durée<select name="months">${[1,3,6,12].map(m=>`<option value="${m}" ${m===values.months?'selected':''}>${m} mois</option>`).join('')}</select></label><p class="signup-price">${money(amount)} ${values.plan==='gratuit'?'pour 7 jours':''}</p><small>Les codes promotionnels sont appliqués à la commande après création du compte.</small>`,`<div class="order-summary"><div><span>Votre activité</span><b>${esc(values.business)}</b></div><div><span>Formule</span><b>${values.plan==='gratuit'?'Gratuit · 7 jours':values.plan==='vip'?'VIP':'Avancé'}</b></div><div><span>Durée</span><b>${values.plan==='gratuit'?'7 jours':values.months+' mois'}</b></div><div class="total"><span>Prix de référence</span><b>${money(amount)}</b></div></div><label class="check"><input type="checkbox" required> J’ai lu les <a href="/conditions" target="_blank" rel="noopener">conditions d’utilisation</a> et la <a href="/confidentialite" target="_blank" rel="noopener">politique de confidentialité</a>.</label>`];
  root.innerHTML=authLayout('Votre prochaine étape<br>commence ici.',`<div class="signup-progress"><span>0${step+1} / 04</span><b>${names[step]}</b><progress value="${step+1}" max="4"></progress></div><form id="signup-form">${screens[step]}<div class="error" role="alert"></div><div class="formfoot">${step?'<button type="button" id="previous">Retour</button>':''}<button class="primary">${step===3?'Créer mon compte':'Continuer'}</button></div></form><p>Déjà un compte ? <a href="/connexion">Se connecter</a></p>`);
  document.querySelector('#previous')?.addEventListener('click',()=>{step--;render();});
  if(step===2)document.querySelector('#signup-form').onchange=e=>{const data=new FormData(e.currentTarget);values.plan=data.get('plan');values.months=Number(data.get('months'));document.querySelector('.signup-price').textContent=money(values.plan==='gratuit'?0:price(values.plan,values.months));};
  document.querySelector('#signup-form').onsubmit=async e=>{e.preventDefault();const form=e.target,data=new FormData(form);if(step<3){for(const [key,value] of data){if(key==='password')password=value;else values[key]=key==='months'?Number(value):value;}step++;render();return;}const button=form.querySelector('.primary');button.disabled=true;try{await settings();if(!config.ready)throw Error('Les inscriptions ne sont pas encore ouvertes. Vous pouvez explorer la démonstration ou contacter MORA Shawiri.');const {error}=await client.auth.signUp({email:values.email,password,options:{emailRedirectTo:location.origin+'/client',data:{display_name:values.name,business_name:values.business,phone:values.phone}}});if(error)throw Error('L’inscription n’a pas abouti. Vérifiez votre adresse ou réessayez.');password='';sessionStorage.setItem('nr-selected-offer',JSON.stringify({plan:values.plan,months:values.months}));root.innerHTML=authLayout('Vérifiez votre messagerie.',`<p>Un lien de confirmation peut vous être envoyé pour finaliser votre inscription. Consultez également les courriers indésirables.</p><a class="button primary" href="/client">Accéder à mon espace</a>`);}catch(error){alertForm(form,error.message);button.disabled=false;}};
 };render();
}

async function privateContext(){
 await settings();if(!client){location.replace('/connexion');return null;}
 const {data,error}=await client.auth.getUser();if(error||!data.user){location.replace('/connexion');return null;}
 session=data.user;
 return api('context');
}
async function workspace(){
 const demo=path==='/demo';
 let context;
 if(demo)context={identity:'demo',demo:true,canWrite:true};
 else {const remote=await privateContext();if(!remote)return;context={...remote,identity:session.id+':'+remote.organizationId,demo:false};}
 Store.configure(context);
 const embed=new URLSearchParams(location.search).has('embed');
 if(embed)document.body.classList.add('embedded');
 root.innerHTML=`<div class="app-globalbar"><a href="/">Accueil</a><span>${demo?'Démonstration · Données fictives':'Mon activité'}</span><span id="sync-state">${demo?'Enregistré sur cet appareil':'Synchronisation'}</span><a class="button small" href="${demo?'/inscription':'/client'}">${demo?'Créer mon compte':'Mon espace client'}</a></div><div id="workspace"></div>`;
 await import('./ui/operations.js');
 const sync=async()=>{const indicator=document.querySelector('#sync-state');if(demo){indicator.textContent='Démonstration locale';return;}if(!navigator.onLine){indicator.textContent='Hors ligne · Données sur cet appareil';return;}try{indicator.textContent='Synchronisation…';const result=await Store.sync(op=>api('sync',op));indicator.textContent=result.conflict?'Conflit · Votre saisie locale est conservée':'Synchronisé';}catch{indicator.textContent='En attente de synchronisation';}};
 window.addEventListener('nr-data-saved',sync);window.addEventListener('online',sync);window.addEventListener('offline',sync);await sync();
}

function accountShell(title,content,admin=false){return `<div class="account-layout"><aside><a class="brand" href="/"><img src="/brand/icon.webp" alt="NR-TRANS" width="44" height="44"><span>NR-TRANS</span></a><span class="eyebrow">${admin?'ADMINISTRATION':'MON ESPACE'}</span><nav>${(admin?['Vue d’ensemble','Clients','Commandes','Paiements','Codes promo','Avis','Paramètres','Journal']:['Vue d’ensemble','Abonnement','Commandes','Paiements','Utilisateurs','Avis','Notifications','Profil','Sécurité','Assistance']).map((n,i)=>`<button data-account-tab="${i}" class="${i===0?'active':''}">${n}</button>`).join('')}</nav><a class="button" href="/app">Ouvrir NR-TRANS</a><button id="logout">Se déconnecter</button></aside><main><div class="account-top"><span>${admin?'MORA SHAWIRI / ADMINISTRATION':'NR-TRANS / MON COMPTE'}</span><a href="/app">Accéder à l’application ↗</a></div><h1>${title}</h1><div id="account-content">${content}</div></main></div>`;}
async function account(){
 const admin=path==='/admin',ctx=await privateContext();if(!ctx)return;
 if(admin&&!ctx.isAdmin){root.innerHTML=authLayout('Accès réservé.','<p>Votre compte ne dispose pas des droits d’administration.</p><a href="/client">Retour à mon espace</a>');return;}
 const data=await api(admin?'admin':'client');
 const overview=()=>`<p class="sub">${admin?'Suivez l’activité commerciale de NR-TRANS.':'Votre compte, votre abonnement et vos prochaines étapes.'}</p><div class="cards"><article class="card highlight"><span>Abonnement</span><div class="value">${esc(data.subscription?.plan||'Gratuit')}</div><p>${data.subscription?.endsAt?'Expire le '+new Date(data.subscription.endsAt).toLocaleDateString('fr-FR'):'Votre compte'}</p></article><article class="card"><span>Véhicules</span><div class="value">${data.vehicleCount??0}</div><a href="/app">Consulter mon parc</a></article><article class="card"><span>Commandes</span><div class="value">${data.orders?.length??0}</div></article><article class="card"><span>Notifications</span><div class="value">${data.notifications?.length??0}</div></article></div><section class="panel"><h2>Tout est prêt pour votre prochaine journée.</h2><p>Retrouvez vos versements, vos dépenses et vos indicateurs dans l’application.</p><a class="button primary" href="/app">Ouvrir mon tableau de bord</a> <a class="button" href="/paiement">Renouveler mon abonnement</a></section>`;
 root.innerHTML=accountShell(admin?'Tableau de bord commercial':'Bonjour, '+esc(data.profile?.display_name||'bienvenue'),overview(),admin);
 document.querySelector('#logout').onclick=async()=>{Store.closeDB();await client.auth.signOut();location.assign('/connexion');};
 document.querySelectorAll('[data-account-tab]').forEach(button=>button.onclick=()=>{
  document.querySelectorAll('[data-account-tab]').forEach(b=>b.classList.toggle('active',b===button));
  const area=document.querySelector('#account-content'),tab=button.textContent;
  if(tab==='Vue d’ensemble'){area.innerHTML=overview();return;}
  if(tab==='Abonnement'){area.innerHTML=`<div id="pricing-root">${pricing()}</div><a class="button primary" href="/paiement">Renouveler ou choisir une offre</a>`;bindPublic();return;}
  if(tab==='Assistance'){area.innerHTML='<section class="panel"><h2>Comment pouvons-nous vous aider ?</h2><p>Contactez l’équipe MORA Shawiri.</p><a class="button primary" href="https://wa.me/2694306306">Ouvrir WhatsApp</a> <a href="mailto:nrtransapp@morashawiri.com">Envoyer un email</a></section>';return;}
  if(tab==='Sécurité'){area.innerHTML='<section class="panel"><h2>Protéger votre compte</h2><a class="button" href="/recuperation">Changer mon mot de passe</a><button id="logout-all">Déconnecter toutes mes sessions</button></section>';document.querySelector('#logout-all').onclick=async()=>{await client.auth.signOut({scope:'global'});location.assign('/connexion');};return;}
  if(tab==='Avis'&&!admin){area.innerHTML='<section class="panel"><h2>Votre expérience nous intéresse.</h2><form id="review-form"><label>Votre note<select name="rating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><label>Votre commentaire<textarea name="comment" required maxlength="2000"></textarea></label><p>Votre avis sera modéré avant publication.</p><button class="primary">Envoyer mon avis</button><div class="error" role="alert"></div></form></section>';document.querySelector('#review-form').onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target);await api('review',{rating:Number(f.get('rating')),comment:f.get('comment')});toast('Avis transmis pour modération.');e.target.reset();}catch(error){alertForm(e.target,error.message);}};return;}
  const rows=tab==='Commandes'?data.orders:tab==='Paiements'?data.payments:tab==='Notifications'?data.notifications:tab==='Utilisateurs'?data.members:tab==='Clients'?data.clients:tab==='Codes promo'?data.promotions:tab==='Avis'?data.reviews:tab==='Journal'?data.audit:[];
  area.innerHTML=`<section class="panel"><h2>${esc(tab)}</h2>${rows?.length?rows.map(r=>`<article class="record-card"><strong>${esc(r.reference||r.title||r.display_name||r.code||r.id)}</strong><span>${esc(r.status||r.role||'')}</span><p>${esc(r.message||r.comment||'')}</p>${r.total!=null?'<b>'+money(r.total)+'</b>':''}</article>`).join(''):'<p class="empty">Aucun élément à afficher pour le moment.</p>'}</section>`;
 });
}

async function checkout(){
 const ctx=await privateContext();if(!ctx)return;
 root.innerHTML=`${header()}<main class="checkout section"><span class="eyebrow">VOTRE ABONNEMENT NR-TRANS</span><h1>Une offre pour votre activité.</h1><form id="checkout-form"><label>Formule<select name="plan"><option value="avance">Avancé · 1 véhicule</option><option value="vip">VIP · Plusieurs véhicules</option></select></label><label>Durée<select name="months">${[1,3,6,12].map(m=>`<option value="${m}">${m} mois</option>`).join('')}</select></label><label>Code promotionnel<input name="code" maxlength="50" autocomplete="off"></label><button type="button" id="quote">Vérifier mon récapitulatif</button><div id="quote-result" aria-live="polite"></div><label>Moyen de paiement<select name="method"><option value="mvola">Mvola</option><option value="holo">Holo</option><option value="cash">Espèces</option><option value="cheque">Chèque</option><option value="paypal">PayPal · manuel</option><option disabled>Wakati · Bientôt disponible</option><option disabled>Carte bancaire · Prochainement</option></select></label><div class="error" role="alert"></div><button class="primary">Créer ma commande</button></form></main>${footer()}`;
 const form=document.querySelector('#checkout-form');const values=()=>{const f=new FormData(form);return {plan:f.get('plan'),months:Number(f.get('months')),code:f.get('code'),method:f.get('method')};};
 document.querySelector('#quote').onclick=async()=>{try{const q=await api('quote',values());document.querySelector('#quote-result').innerHTML=`<div class="order-summary"><div><span>Prix officiel</span><b>${money(q.subtotal)}</b></div><div><span>Réduction</span><b>−${money(q.discount)}</b></div><div class="total"><span>Total validé</span><b>${money(q.total)}</b></div></div>`;}catch(error){alertForm(form,error.message);}};
 form.onsubmit=async e=>{e.preventDefault();try{const result=await api('order',{...values(),idempotencyKey:crypto.randomUUID()});root.innerHTML=authLayout('Votre commande est créée.',`<p>Référence : <b>${esc(result.reference)}</b></p><p>Montant : <b>${money(result.total)}</b></p><p>${esc(result.instructions)}</p><form id="declare-payment"><label>Référence du paiement<input name="reference" required maxlength="160"></label><label>Justificatif (PDF, JPEG ou PNG, 5 Mo maximum)<input name="proof" type="file" accept="application/pdf,image/jpeg,image/png"></label><button class="primary">Déclarer mon paiement</button><div class="error" role="alert"></div></form>`);document.querySelector('#declare-payment').onsubmit=async event=>{event.preventDefault();try{const data=new FormData(event.target),file=data.get('proof');let proof=null;if(file?.size){if(file.size>5*1024*1024)throw Error('Le justificatif dépasse 5 Mo.');const upload=await api('proof-upload',{orderId:result.id,name:file.name,type:file.type});const {error}=await client.storage.from('payment-proofs').uploadToSignedUrl(upload.path,upload.token,file);if(error)throw Error('Le justificatif n’a pas été envoyé.');proof=upload.path;}await api('declare-payment',{orderId:result.id,reference:data.get('reference'),proof});location.assign('/client');}catch(error){alertForm(event.target,error.message);}};}catch(error){alertForm(form,error.message);}};
 bindPublic();
}

try{
 if(path==='/')root.innerHTML=home();
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
if('serviceWorker' in navigator && import.meta.env.PROD)navigator.serviceWorker.register('/sw.js').catch(()=>{});
