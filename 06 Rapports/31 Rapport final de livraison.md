# Rapport final de développement et de livraison — NR-TRANS

Date : 3 octobre 2026.

**DÉVELOPPEMENT FONCTIONNEL : TERMINÉ.**

**FINITIONS DE LIVRAISON : TERMINÉES.**

**NR-TRANS : PRÊT POUR RECETTE UTILISATEUR FINALE.**

La recette humaine n’a pas été réalisée à la place du propriétaire. Toutes les cases du fichier `RECETTE UTILISATEUR FINALE.md` restent non cochées. Aucune nouvelle fonctionnalité, modification de tarif ou refonte métier n’a été ajoutée pendant cette clôture.

## État livré

| Élément | Résultat vérifié |
|---|---|
| Supabase | Projet `nr-trans` accessible ; neuf migrations appliquées avec empreintes identiques aux fichiers versionnés. Aucune migration ajoutée pendant les finitions. |
| Dernier lot fonctionnel | `b2867abd8e7f4917e09cc9f534817a083a6b31b0` : interventions Admin validées en production PC/mobile. |
| GitHub | Dépôt `rmshawiri/nrtransapp`, branche `main`, push vérifié. |
| Hash final du code applicatif | `4e3fec2ff0963ac7de35b6227c90eeee17135617` — correction finale du shell PWA. Le commit qui ajoute ce rapport est documentaire ; il ne modifie pas ce code. |
| Vercel | Déploiement du code final `dpl_7tuPEKBUf6qu8z8nKfeKA3Dn2Yop`, état `READY`, empreinte Git correspondante vérifiée. |
| Production | https://nr-trans.morashawiri.com — HTTPS, routes et contrôles navigateur réussis. |
| PWA / Offline | Cache versionné, shell sans redirection, API exclue du cache, rechargement hors ligne et retour réseau réussis. |
| Responsive | Douze écrans métier vérifiés à 1440 et 390 px sans débordement horizontal ni exception JavaScript. |
| Documentation | Guide d’exploitation et maintenance livré dans `02 Documentation`. |
| Captures | Exactement quatre PNG PC et quatre PNG Mobile, inspectés visuellement, cadrés sur les fonctions utiles. |
| Recette utilisateur | Prête à commencer après livraison ; non exécutée et non cochée artificiellement. |

Le hash documentaire de clôture est consultable par `git log -1 --format=%H` et communiqué dans le compte-rendu de livraison. Cette distinction évite de prétendre qu’un fichier peut contenir le hash du commit qui le crée. Toute republication de ce commit documentaire conserve le même code applicatif que la référence ci-dessus.

## Dernier lot fonctionnel confirmé

Les six scénarios SQL du lot Admin avaient réussi localement et directement contre Supabase avant `b2867ab`. Le contrôle de reprise a ensuite vérifié sur le domaine officiel : refus d’une intervention par un non-Admin, suspension des écritures, conservation des données et de la consultation, rétablissement, ajout de période sans perte de dates acquises et journal contenant acteur/date/action. Le compte et l’organisation de test ont été nettoyés par le script, terminé avec succès.

Les rapports précédents conservent les preuves des contrôles RLS entre organisations, lecteur secondaire et restriction véhicule, anonyme, RPC commerciales, idempotence, tarifs, promotions, essai, renouvellement, expiration et activation. Ces audits déjà réussis n’ont pas été rejoués inutilement pour des changements de présentation.

La vérification de clôture du registre des migrations a relu les neuf empreintes distantes sans modifier la base.

## Finitions SEO, routes et sécurité de présentation

- Titres, descriptions, canonical et Open Graph propres aux routes ; partage et texte alternatif du logo renseignés.
- Accueil, tarifs et pages d’information pré-rendus. H1 ajouté à la page Tarifs.
- Données structurées `WebApplication` cohérentes avec le produit, sans faux avis, statistiques ou notation inventée.
- Sitemap des cinq pages publiques ; robots autorise la lecture des directives `noindex` et exclut l’API.
- Authentification, démonstration et espaces privés non indexables ; en-tête `X-Robots-Tag` vérifié en production pour Admin et shell. Ce mécanisme ne remplace pas Auth/RLS.
- Les routes inconnues et une sous-route Admin inexistante renvoient réellement HTTP 404. Les quatorze routes connues contrôlées renvoient 200.
- Treize liens internes publics contrôlés ; ressources et images des parcours inspectés sans manque observé. Les liens externes emploient HTTPS/mailto/tel ; aucun message externe n’a été envoyé pour les tester.
- En-têtes `nosniff`, politique de référent et `SAMEORIGIN` ajoutés ; l’aperçu de démonstration dans l’iframe du même site reste fonctionnel.
- Aucun lien localhost trouvé dans le HTML de production contrôlé. La réception des liens Auth en vraie messagerie reste dans la recette humaine.

## Accessibilité et affichage

Les formulaires inspectés présentent des labels ; les images ont un texte alternatif ; les modales métier, membres et conflits disposent d’un nom accessible. Le contrôle navigateur vérifie l’entrée dans la modale au clavier, le focus intérieur, la fermeture avec Échap et un affichage avec zoom CSS à 200 %. Les styles de focus visibles existants sont conservés.

Les échantillons de contraste des textes de l’accueil, du bouton principal, des sous-titres et des indicateurs vont de 4,76:1 à 12,61:1. Les parcours inspectés à 390 et 1440 px ne produisent ni débordement horizontal ni exception JavaScript. Il s’agit d’une vérification pratique ciblée, pas d’une certification exhaustive WCAG ou d’une validation sur tous les lecteurs d’écran et appareils.

## Tests de clôture

| Contrôle | Résultat |
|---|---|
| Build Vite de production | Réussi ; dernier build local en environ 2,7 s. |
| Stockage, demande idempotente, serveur | 10 tests ciblés réussis. |
| Interventions Admin en production | Réussi sur PC/mobile avec fixture temporaire nettoyée. |
| Script de livraison local et production | Routes, métadonnées, 404 en production, labels, images, clavier/modale, zoom, ressources : réussi. |
| Douze écrans métier en production | Réussi à 390 et 1440 px. |
| PWA en production après correction | Réussi : shell HTTP 200 sans redirection, cache, rechargement offline, retour online, avis publics HTTP. |
| Registre Supabase | 9 empreintes identiques ; lecture seule. |
| Secrets et Git | Contrôle des fichiers indexés réussi avant chaque commit de code ; push et SHA distant vérifiés. |

Une régression a été détectée puis corrigée pendant les finitions : les URL propres de Vercel redirigeaient `/shell.html` vers `/shell`, ce qui rendait la réponse mise en cache impropre au rechargement hors ligne. Le cache utilise désormais directement `/shell`. Le test PWA vérifie explicitement l’absence de redirection ; son exécution distante finale réussit. Aucun contrôle de sécurité n’a été désactivé pour faire passer ce test.

Les ressources JavaScript principales du build sont environ 290 ko et 50 ko avant compression, soit environ 80 ko et 17 ko gzip. Le cache versionné et les polices locales existantes sont conservés. Aucun score artificiel de performance ou résultat Lighthouse non exécuté n’est revendiqué.

## Documentation et captures

Le guide `02 Documentation/Guide exploitation et maintenance.md` couvre architecture, GitHub, Vercel, Supabase/Auth/RLS, migrations, noms des variables, déploiement, domaine, PWA/offline/conflits, abonnements/paiements/promotions/interventions, sauvegardes et restauration, sécurité, maintenance et reprise.

Les huit PNG finaux se trouvent dans `05 Captures d'écran/Version PC` et `Version Mobile`. Le fichier `Description des captures.md` précise leur sujet : dashboard, véhicule, trésorerie, rapport. Données fictives uniquement, densité 2, vraie largeur mobile 390 px, aucun bureau ou navigateur complet. Les cadrages ont été ouverts et vérifiés ; la capture mobile du rapport montre un extrait de trois indicateurs, pas toute la longue page.

## Limitations réellement restantes et recette humaine

- Réception réelle des e-mails Auth, confirmation, récupération et invitation : à vérifier avec le propriétaire dans la recette, sans intervention requise pendant cette livraison.
- Installation PWA et expérience tactile sur les appareils physiques du propriétaire : recette humaine à effectuer ; l’émulation Chrome et le test offline technique ont réussi.
- Paiements manuels : validation humaine et rapprochement indispensables. Carte/Wakati n’est pas intégré ni présenté comme un paiement actif.
- Les mentions et conditions commerciales/juridiques doivent être validées par l’éditeur avant ouverture commerciale ; la checklist le rappelle.
- Hors connexion, une suspension ou restriction distante n’est connue qu’au retour réseau ; le serveur refuse les écritures non autorisées. Les alertes d’abonnement sont internes et déclenchées à la visite, sans notification e-mail planifiée revendiquée.
- Les sauvegardes métier ne remplacent pas une politique complète PostgreSQL/Auth/Storage. Le guide explique la vérification de la rétention réelle et la restauration isolée ; aucun dispositif de supervision permanente ou de sauvegarde périodique non configuré n’est déclaré opérationnel.

Note locale sans effet sur le produit : huit PNG de brouillon ont été créés dans un chemin encodé hors du dépôt avant correction du script de capture. Le contrôle automatique a refusé leur suppression avec le motif générique « blocked by policy ». Ils sont exclus du dépôt et du déploiement ; les dossiers de livraison contiennent bien uniquement les huit captures finales. Aucun fichier du dossier de référence n’a été modifié.

**TESTS TECHNIQUES RÉUSSIS. RECETTE UTILISATEUR À EFFECTUER.**
