import {build} from 'vite';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {home,header,footer,pricing,legal} from '../src/ui/public.js';
await build();
const base=await readFile('dist/index.html','utf8');
const origin='https://nr-trans.morashawiri.com';
const loading='<main class="loading" aria-live="polite">Ouverture de NR-TRANS…</main>';
function page(path,title,description,body,indexable=false){
 const url=origin+(path==='/'?'/':path);
 let html=base.replace(/<title>.*?<\/title>/,`<title>${title} | NR-TRANS</title>`)
 .replace(/(<meta name="description" content=")[^"]*/,`$1${description}`)
 .replace(/(<link rel="canonical" href=")[^"]*/,`$1${url}`)
 .replace(/(<meta property="og:title" content=")[^"]*/,`$1${title} | NR-TRANS`)
 .replace(/(<meta property="og:description" content=")[^"]*/,`$1${description}`)
 .replace(/(<meta property="og:url" content=")[^"]*/,`$1${url}`)
 .replace('</head>',`<meta name="robots" content="${indexable?'index,follow':'noindex,nofollow'}"><meta property="og:locale" content="fr_FR"><meta name="twitter:card" content="summary_large_image"><meta property="og:image:alt" content="Logo NR-TRANS"></head>`);
 if(body)html=html.replace(loading,body);
 if(path==='/')html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:'NR-TRANS',url:origin,applicationCategory:'BusinessApplication',operatingSystem:'Web',inLanguage:'fr',description})+'</script></head>');
 return html;
}
await writeFile('dist/index.html',page('/','Gestion de transport aux Comores','Gérez véhicules, chauffeurs, versements, dépenses, prêts et rentabilité en KMF. NR-TRANS accompagne votre activité de transport sur PC et mobile.',home(),true));
await writeFile('dist/tarifs.html',page('/tarifs','Tarifs et abonnements','Découvrez les offres NR-TRANS : essai gratuit de 7 jours, Avancé et VIP. Tarifs en KMF pour votre véhicule ou votre parc.',header()+'<main id="pricing-root"><h1 class="section">Tarifs NR-TRANS</h1>'+pricing()+'</main>'+footer(),true));
for(const [path,title] of Object.entries({confidentialite:'Confidentialité',conditions:'Conditions d’utilisation','mentions-legales':'Mentions légales'}))await writeFile('dist/'+path+'.html',page('/'+path,title,title+' du service NR-TRANS, édité par MORA Shawiri.',legal(path),true));
for(const [path,title] of Object.entries({inscription:'Créer un compte',connexion:'Connexion',recuperation:'Récupérer mon accès','nouveau-mot-de-passe':'Nouveau mot de passe',app:'Mon activité',demo:'Démonstration',client:'Espace Client',admin:'Administration',paiement:'Ma commande'}))await writeFile('dist/'+path+'.html',page('/'+path,title,'Accédez à votre espace NR-TRANS.'));
await writeFile('dist/404.html',page('/404','Page introuvable','Cette page NR-TRANS est introuvable.',header()+'<main class="legal section"><h1>Page introuvable</h1><p>Vérifiez l’adresse ou revenez à l’accueil.</p><a class="button primary" href="/">Retour à l’accueil</a></main>'+footer()));
await writeFile('dist/shell.html',page('/app','NR-TRANS hors ligne','Votre activité NR-TRANS sur cet appareil.'));
const files=await readdir('dist/assets');
const assets=['/manifest.webmanifest','/shell','/brand/icon.webp','/brand/logo.webp',...files.map(f=>'/assets/'+f)];
const cache='nr-trans-v2-'+Date.now();
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)},ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nr-trans-v2-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET'||u.pathname.startsWith('/api/'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/shell')));return;}if(ASSETS.includes(u.pathname))e.respondWith(caches.open(CACHE).then(c=>c.match(u.pathname,{ignoreVary:true})).then(r=>r||fetch(e.request)));});`);
console.log('Public pages prerendered; PWA shell and versioned assets generated.');
