# CAHIER DES CHARGES — NR-TRANS

## Plateforme de gestion professionnelle pour activités de transport

**Produit :** NR-TRANS  
**Éditeur :** MORA Shawiri  
**Type :** Application Web / PWA — Online & Offline  
**Version du cahier des charges :** 1.1 — Finale  
**Date :** Octobre 2026  
**Statut :** Spécifications de développement

---

# 1. PRÉSENTATION DU PROJET

NR-TRANS est une solution numérique de gestion destinée aux propriétaires et gestionnaires de véhicules exerçant une activité de transport.

Le projet dispose déjà d'une application fonctionnelle présente dans le dossier :

`01 Projet à reproduire`

Cette application existante constitue la RÉFÉRENCE FONCTIONNELLE du nouveau projet.

La nouvelle version ne doit pas réduire, supprimer ou altérer arbitrairement les fonctionnalités existantes.

L'objectif est de partir de cette base fonctionnelle pour construire une véritable plateforme commerciale moderne, premium, sécurisée, responsive et exploitable aussi bien en ligne que hors connexion.

NR-TRANS doit pouvoir être commercialisé directement auprès du public indépendamment de la publication future de son application Android sur Google Play.

La plateforme devra comprendre au minimum :

1. une Landing Page publique ;
2. l'application de gestion NR-TRANS ;
3. un espace Client ;
4. un espace Administrateur ;
5. un système d'authentification ;
6. un système d'abonnement ;
7. un système de commandes et paiements ;
8. un système de codes promotionnels ;
9. un système multi-véhicules ;
10. un système multi-utilisateurs avec droits d'accès ;
11. une architecture Online / Offline ;
12. une infrastructure Supabase ;
13. une documentation complète ;
14. des captures PC et Mobile destinées à la communication.

---

# 2. OBJECTIFS PRINCIPAUX

La nouvelle plateforme NR-TRANS doit permettre de :

- gérer professionnellement une activité de transport ;
- gérer un ou plusieurs véhicules ;
- centraliser les informations financières de l'activité ;
- suivre individuellement chaque véhicule ;
- disposer d'une vue consolidée de l'ensemble du parc ;
- gérer les versements ;
- gérer les dépenses ;
- gérer les chauffeurs ;
- gérer les rémunérations ;
- gérer les entretiens ;
- gérer les prêts ;
- rattacher un prêt à un ou plusieurs véhicules ;
- suivre la trésorerie ;
- suivre les propriétaires et mouvements associés ;
- analyser la rentabilité ;
- produire des rapports ;
- fonctionner sur ordinateur et smartphone ;
- continuer à fonctionner lorsque la connexion Internet est temporairement indisponible ;
- permettre la commercialisation par abonnement ;
- permettre au propriétaire d'accorder un accès à d'autres personnes ;
- fournir à MORA Shawiri un véritable espace d'administration commerciale.

---

# 3. PRINCIPE FONDAMENTAL : REPRODUCTION DE L'EXISTANT

Avant tout développement important, Codex doit analyser intégralement le contenu du dossier :

`01 Projet à reproduire`

Il doit comprendre :

- l'architecture actuelle ;
- les fonctionnalités existantes ;
- les règles métier ;
- les calculs ;
- les relations entre données ;
- les paramètres ;
- les mécanismes financiers ;
- les sauvegardes ;
- les comportements hors ligne ;
- les rapports existants ;
- les écrans ;
- les workflows.

Aucune fonctionnalité existante ne doit être supprimée simplement parce qu'une nouvelle architecture est mise en place.

Les règles métier et calculs existants doivent être préservés sauf lorsqu'une évolution prévue dans le présent cahier des charges nécessite explicitement leur extension.

En cas de différence entre une fonctionnalité existante et une nouvelle exigence du présent cahier des charges, la nouvelle exigence doit être intégrée sans dégrader inutilement l'existant.

---

# 4. DOSSIER RACINE DU PROJET

La structure fournie est organisée ainsi :

NR-TRANS/
│
├── 01 Projet à reproduire/
├── 02 Documentation/
├── 03 Logo et Favicon/
├── 04 Codes/
├── 05 Captures d'écran/
│   ├── Version PC/
│   └── Version Mobile/
└── 06 Rapports/

## Règles

### 01 Projet à reproduire

Contient la solution existante servant de référence.

Ne pas l'écraser.

### 02 Documentation

Contient notamment :

- `01 Cahier des charges.md` ;
- `02 Charte graphique.md` ;
- `IMG Charte graphique.png` ;
- `03 Contenu Landing Page.md` ;
- `04 Coordonnées.txt` ;
- `05 Informations des comptes.txt`.

`IMG Charte graphique.png` constitue une référence visuelle complémentaire. Les fichiers originaux présents dans `03 Logo et Favicon` restent les références officielles pour le logo et le favicon.

### 03 Logo et Favicon

Contient les éléments d'identité visuelle officiels.

Ils doivent être utilisés dans le produit final.

### 04 Codes

Tous les nouveaux codes sources du projet doivent être placés ici.

### 05 Captures d'écran

Contient :

- `Version PC`
- `Version Mobile`

Les captures finales demandées devront y être placées.

### 06 Rapports

Tous les rapports techniques et de livraison doivent être placés ici.

---

# 5. ARCHITECTURE GÉNÉRALE

La nouvelle solution doit être conçue comme une plateforme moderne composée de quatre grandes expériences :

## 5.1 Landing Page publique

Vitrine commerciale et SEO de NR-TRANS.

## 5.2 Application NR-TRANS

Outil principal de gestion du transport.

## 5.3 Espace Client

Gestion du compte, abonnement, paiements, utilisateurs secondaires, sécurité, avis, etc.

## 5.4 Espace Administrateur

Gestion commerciale et opérationnelle de la plateforme par MORA Shawiri.

---


# 6. URL OFFICIELLE ET ARCHITECTURE DES ROUTES

L'URL officielle prévue pour NR-TRANS est :

`https://nr-trans.morashawiri.com`

Ce domaine doit être pris en compte DÈS LE DÉBUT du développement et non uniquement lors de la livraison finale.

L'ensemble de la plateforme doit être conçu pour fonctionner sous ce domaine unique.

Architecture de référence :

- `/` → Landing Page publique ;
- `/inscription` → création de compte ;
- `/connexion` → connexion ;
- `/app` → application NR-TRANS ;
- `/client` → espace Client ;
- `/admin` → espace Administrateur sécurisé ;
- `/tarifs` → offres et abonnements ;
- `/paiement` → parcours de paiement.

Des sous-routes supplémentaires peuvent être créées lorsque nécessaires.

Éviter de répartir inutilement NR-TRANS sur plusieurs sous-domaines. Le domaine principal doit rester `nr-trans.morashawiri.com`.

Les routes privées doivent être protégées selon le rôle, les autorisations et l'état de l'utilisateur. La Landing Page publique doit être directement accessible depuis la racine du domaine.

Le domaine officiel doit également être pris en compte pour les URLs de redirection d'authentification, les liens applicatifs, la PWA, les métadonnées SEO, les URLs canoniques et toute configuration de production pertinente.

Les URLs temporaires `.vercel.app` peuvent être utilisées pour le développement et les tests, mais ne constituent pas l'adresse commerciale finale.

---

# 7. LANDING PAGE

La Landing Page doit être :

- premium ;
- captivante ;
- professionnelle ;
- moderne ;
- rapide ;
- responsive ;
- mobile-first ;
- accessible ;
- optimisée SEO ;
- cohérente avec la charte graphique NR-TRANS ;
- orientée conversion.

Elle ne doit pas ressembler à une simple page technique.

Elle doit donner immédiatement envie de découvrir NR-TRANS.

Le contenu rédactionnel détaillé sera fourni dans :

`03 Contenu Landing Page.md`

La Landing Page devra notamment pouvoir présenter :

- NR-TRANS ;
- sa proposition de valeur ;
- ses principaux avantages ;
- les fonctionnalités ;
- la gestion multi-véhicules ;
- les captures réelles du produit ;
- le fonctionnement PC et Mobile ;
- le fonctionnement hors ligne ;
- les offres ;
- les tarifs ;
- les avantages des engagements longue durée ;
- les moyens de paiement ;
- les témoignages/avis approuvés ;
- les FAQ ;
- des appels à l'action ;
- l'identité MORA Shawiri.

Les balises SEO, métadonnées, Open Graph, données structurées pertinentes, sitemap, robots et autres bonnes pratiques doivent être correctement préparés.

---

# 8. DESIGN ET EXPÉRIENCE UTILISATEUR

Une évolution graphique importante est autorisée.

L'objectif est d'obtenir un produit :

- premium ;
- captivant ;
- élégant ;
- professionnel ;
- distinctif ;
- fluide ;
- rassurant ;
- simple à utiliser.

Codex est autorisé à proposer une véritable amélioration visuelle de l'application existante.

Cependant :

LE DESIGN PEUT ÉVOLUER.

LES RÈGLES MÉTIER ET FONCTIONNALITÉS VALIDÉES NE DOIVENT PAS ÊTRE DÉGRADÉES.

La plateforme doit être parfaitement adaptée :

- aux smartphones ;
- aux tablettes ;
- aux ordinateurs.

Les tableaux complexes doivent disposer d'une présentation adaptée au mobile plutôt que d'imposer systématiquement de grands tableaux horizontaux.

Prévoir notamment :

- Dashboard premium ;
- cartes statistiques ;
- graphiques ;
- états vides ;
- skeleton/loading states si nécessaire ;
- feedback après actions ;
- confirmations pour actions sensibles ;
- formulaires agréables ;
- navigation claire ;
- accessibilité ;
- design responsive ;
- cohérence des espacements ;
- typographie professionnelle ;
- interactions et animations légères.

Éviter les animations excessives qui ralentiraient l'application.

---

# 9. GESTION MULTI-VÉHICULES

Le véhicule doit devenir une entité métier centrale de NR-TRANS.

Un client doit pouvoir gérer :

- un véhicule ;
- plusieurs véhicules selon son abonnement.

Chaque véhicule doit disposer d'une fiche propre.

Les informations pertinentes existantes et nouvelles doivent pouvoir être rattachées au véhicule concerné.

Cela peut notamment concerner :

- versements ;
- recettes ;
- dépenses ;
- entretien ;
- chauffeur ;
- rémunération ;
- prêt/financement ;
- mouvements ;
- statistiques ;
- rentabilité ;
- rapports.

## Vue globale

Le propriétaire doit pouvoir consulter les performances consolidées de l'ensemble de son parc.

Exemples :

- recettes globales ;
- dépenses globales ;
- trésorerie ;
- rentabilité globale ;
- véhicules actifs ;
- performances comparées ;
- charges ;
- prêts ;
- entretiens.

## Vue individuelle

Il doit également pouvoir sélectionner un véhicule et obtenir uniquement les données relatives à celui-ci.

Le passage :

`Tous les véhicules`

vers :

`Véhicule sélectionné`

doit être simple et intuitif.

---

# 10. GESTION DES PRÊTS MULTI-VÉHICULES

NR-TRANS doit gérer plusieurs scénarios.

## Cas 1 — Un prêt pour un véhicule

Un prêt peut financer un véhicule unique.

## Cas 2 — Un prêt pour plusieurs véhicules

Un même prêt peut financer plusieurs véhicules.

Exemple :

Un client contracte un prêt de 10 000 000 KMF et utilise ce financement pour acquérir trois véhicules.

Il doit être possible de :

- créer un seul prêt ;
- associer plusieurs véhicules à ce prêt ;
- conserver l'échéancier global ;
- suivre les remboursements ;
- visualiser les véhicules concernés.

## Cas 3 — Plusieurs prêts

Un propriétaire peut avoir plusieurs prêts simultanément.

Chaque prêt peut être associé à un ou plusieurs véhicules.

L'architecture de données doit donc gérer proprement les relations :

UTILISATEUR
→ PRÊTS
↔ VÉHICULES

sans duplication incohérente des informations financières.

---

# 11. APPLICATION ONLINE / OFFLINE

NR-TRANS doit fonctionner :

- avec Internet ;
- sans Internet lorsque cela est possible.

L'application doit être conçue selon une logique :

**offline-first / PWA**

L'utilisateur doit pouvoir continuer les opérations métier essentielles lors d'une coupure temporaire de connexion.

La solution doit prévoir :

- stockage local approprié ;
- cache des ressources nécessaires ;
- persistance des données ;
- synchronisation lorsque la connexion revient ;
- gestion des conflits ;
- indicateur de connexion ;
- indicateur de synchronisation ;
- reprise après interruption ;
- protection contre les doubles enregistrements.

Les données ne doivent jamais disparaître simplement parce qu'une connexion Internet est momentanément indisponible.

---

# 12. SYNCHRONISATION

La nouvelle architecture doit permettre l'utilisation multi-appareils et les utilisateurs secondaires.

Une stratégie de synchronisation sécurisée doit donc être conçue.

Les données locales et distantes doivent disposer d'identifiants stables.

Prévoir notamment :

- création hors ligne ;
- modification hors ligne lorsque possible ;
- file d'attente de synchronisation ;
- synchronisation au retour du réseau ;
- déduplication ;
- horodatage ;
- gestion cohérente des conflits ;
- statut de synchronisation.

La synchronisation ne doit pas provoquer de duplication des opérations financières.

---

# 13. AUTHENTIFICATION

L'inscription et la connexion doivent reprendre la philosophie d'authentification sécurisée utilisée sur le nouveau site MORA Shawiri.

Utiliser Supabase Auth lorsque pertinent.

Prévoir notamment :

- création de compte ;
- connexion ;
- déconnexion ;
- récupération de compte/mot de passe ;
- session persistante sécurisée ;
- routes protégées ;
- profil utilisateur ;
- contrôle des rôles ;
- vérification serveur des autorisations sensibles.

Ne jamais stocker de mot de passe en clair.

---

# 14. INSCRIPTION — EXPÉRIENCE PREMIUM

La page d'inscription doit être particulièrement soignée.

Elle doit être :

- élégante ;
- captivante ;
- rassurante ;
- fluide ;
- responsive ;
- agréable sur mobile ;
- visuellement premium.

Éviter un énorme formulaire affichant toutes les informations simultanément.

Privilégier un parcours progressif, par étapes ou conversationnel.

Le parcours peut comprendre :

1. création du compte ;
2. informations essentielles ;
3. choix du forfait ;
4. choix de la durée ;
5. code promo éventuel ;
6. récapitulatif ;
7. choix du moyen de paiement ;
8. confirmation.

Les calculs doivent être réalisés automatiquement et instantanément à mesure que l'utilisateur effectue ses choix.

---

# 15. ABONNEMENTS

NR-TRANS dispose de trois offres :

## 15.1 GRATUIT

**Prix : 0 KMF**

Durée :

**7 jours**

Caractéristiques :

- accès à toutes les fonctionnalités ;
- 1 véhicule ;
- période d'essai complète de 7 jours.

L'objectif est de permettre au prospect de réellement tester NR-TRANS.

À l'expiration :

- les données ne sont PAS supprimées ;
- le compte reste accessible selon les règles prévues ;
- les données restent conservées ;
- les nouvelles opérations nécessitant un abonnement actif sont bloquées ;
- le client est invité à souscrire Avancé ou VIP.

Le système doit empêcher autant que raisonnablement possible la répétition abusive de périodes d'essai.

---

# 16. ABONNEMENT AVANCÉ

L'abonnement Avancé donne accès à :

- toutes les fonctionnalités NR-TRANS ;
- gestion d'un seul véhicule ;
- absence de limitation artificielle du nombre d'opérations pendant la période active.

Tarifs officiels :

| Durée | Prix |
|---|---:|
| 1 mois | 2 500 KMF |
| 3 mois | 6 000 KMF |
| 6 mois | 12 000 KMF |
| 12 mois | 18 000 KMF |

Logique tarifaire :

- 1 mois : 2 500 KMF/mois ;
- 3 mois : équivalent 2 000 KMF/mois ;
- 6 mois : équivalent 2 000 KMF/mois ;
- 12 mois : équivalent 1 500 KMF/mois.

---

# 17. ABONNEMENT VIP

L'abonnement VIP donne accès à :

- toutes les fonctionnalités NR-TRANS ;
- plusieurs véhicules ;
- nombre de véhicules illimité selon les règles normales de la plateforme ;
- absence de limitation artificielle du nombre d'opérations pendant la période active.

Tarifs officiels :

| Durée | Prix |
|---|---:|
| 1 mois | 5 000 KMF |
| 3 mois | 13 500 KMF |
| 6 mois | 27 000 KMF |
| 12 mois | 48 000 KMF |

Logique tarifaire :

- 1 mois : 5 000 KMF/mois ;
- 3 mois : équivalent 4 500 KMF/mois ;
- 6 mois : équivalent 4 500 KMF/mois ;
- 12 mois : équivalent 4 000 KMF/mois.

---

# 18. RÈGLE DE CONSERVATION DES DONNÉES

Une expiration d'abonnement ne doit jamais supprimer les données métier du client.

Cela s'applique notamment :

- après l'essai Gratuit ;
- après Avancé ;
- après VIP.

Les informations restent conservées.

Lorsqu'un abonnement est renouvelé, l'utilisateur doit retrouver son environnement.

Un ancien client VIP possédant plusieurs véhicules ne doit pas perdre ses véhicules parce que son abonnement expire.

---

# 19. RENOUVELLEMENT

Lorsqu'un client renouvelle le même forfait avant son expiration, la nouvelle durée doit s'ajouter à la durée restante.

Exemple :

Expiration actuelle :

20 novembre.

Le client achète 6 mois supplémentaires le 10 novembre.

Les 10 jours restants ne doivent pas être perdus.

La nouvelle période commence à la suite de la période déjà payée.

Le calcul des dates doit être réalisé automatiquement.

---

# 20. CHANGEMENT DE FORFAIT

L'architecture doit permettre :

- Gratuit → Avancé ;
- Gratuit → VIP ;
- Avancé → VIP ;
- VIP → Avancé.

Aucune donnée ne doit être supprimée lors d'un changement de forfait.

Pour un passage vers une formule dont les capacités sont inférieures, les données existantes dépassant les nouvelles limites doivent être conservées.

Le système ne doit jamais supprimer automatiquement des véhicules ou données pour respecter une nouvelle formule.

Les règles commerciales exactes concernant prorata, reliquat ou date d'effet lors d'un changement Avancé ↔ VIP doivent rester configurables afin de ne pas figer arbitrairement une politique commerciale non encore définitivement arrêtée.

---

# 21. CALCUL AUTOMATIQUE DES COMMANDES

Le formulaire doit calculer en temps réel :

- forfait ;
- durée ;
- tarif de référence ;
- remise tarifaire déjà intégrée à la durée ;
- code promo éventuel ;
- réduction promo ;
- total final.

Exemple :

VIP
6 mois
Prix officiel : 27 000 KMF

Code promo : -10 %

Réduction :
2 700 KMF

TOTAL :
24 300 KMF

Le client doit voir un récapitulatif clair AVANT validation.

IMPORTANT :

Le calcul côté interface sert à l'expérience utilisateur.

LE SERVEUR DOIT RECALCULER ET VALIDER LE MONTANT.

Le client ne doit jamais pouvoir modifier le JavaScript ou une requête pour imposer arbitrairement un prix inférieur.

---

# 22. CODES PROMOTIONNELS

L'espace Administrateur doit disposer d'un module complet de gestion des codes promotionnels.

Deux mécanismes minimum :

## Montant fixe

Exemple :

`NRT1000`

Réduction :

1 000 KMF.

## Pourcentage

Exemple :

`NRT10`

Réduction :

10 %.

Le système doit permettre de configurer au minimum :

- code ;
- nom interne ;
- type ;
- montant ou pourcentage ;
- actif/inactif ;
- date de début ;
- date de fin ;
- nombre maximum d'utilisations ;
- nombre d'utilisations par client ;
- forfait(s) concerné(s) ;
- durée(s) concernée(s) ;
- montant minimum éventuel ;
- statistiques d'utilisation.

Prévoir la possibilité d'une remise de 100 % lorsque l'administrateur souhaite offrir un abonnement.

Un code expiré, désactivé ou ayant atteint sa limite doit être refusé proprement.

Les validations sensibles doivent être effectuées côté serveur.

---

# 23. COMMANDES

Chaque souscription payante doit générer une commande.

Prévoir une référence automatique unique.

Exemple de format :

`NRT-20261001-XXXX`

La commande doit conserver notamment :

- client ;
- forfait ;
- durée ;
- prix officiel ;
- code promo éventuel ;
- réduction ;
- total ;
- moyen de paiement ;
- référence de paiement ;
- justificatif éventuel ;
- date ;
- statut ;
- historique des changements de statut ;
- administrateur ayant validé/refusé lorsque pertinent.

Statuts possibles à prévoir proprement :

- Brouillon ;
- En attente de paiement ;
- Paiement déclaré ;
- En vérification ;
- Payé / Validé ;
- Refusé ;
- Annulé ;
- Expiré.

Les statuts exacts peuvent être adaptés techniquement si nécessaire, à condition de conserver une logique claire.

---

# 24. MOYENS DE PAIEMENT

## Mvola

Numéro :

430 63 06

Nom :

Mohamed Rachade

## Holo

Numéro :

430 63 06

Nom :

Rachade Houmaydat Mohamed

## Wakati

Numéro :

351 63 06

Nom :

Mohamed Rachade

Wakati n'ayant pas encore lancé son service, le moyen de paiement doit pouvoir être présent dans l'administration mais affiché comme :

**Bientôt disponible**

tant qu'il n'est pas activé.

## Virement bancaire

Prévoir la possibilité d'afficher les coordonnées bancaires configurées par l'administrateur.

## Chèque

Paiement par chèque selon les instructions de MORA Shawiri.

## Espèces

Paiement directement auprès de MORA Shawiri.

## PayPal

Compte associé :

morapro.entrepreneur@gmail.com

Préparer l'architecture proprement.

Ne pas simuler une intégration PayPal automatique si les identifiants/API nécessaires ne sont pas disponibles.

## Carte bancaire

Prévoir l'architecture de manière extensible.

L'intégration carte sera traitée ultérieurement.

---

# 25. PAIEMENTS MANUELS

Pour les paiements nécessitant une vérification manuelle :

1. le client choisit le forfait ;
2. il choisit la durée ;
3. le système calcule le total ;
4. le code promo éventuel est appliqué ;
5. le client choisit son moyen de paiement ;
6. NR-TRANS affiche les instructions ;
7. le client effectue le paiement ;
8. il transmet la référence et/ou le justificatif ;
9. la commande passe en vérification ;
10. l'administrateur contrôle le paiement ;
11. l'administrateur valide ou refuse ;
12. si validé, l'abonnement est activé automatiquement selon la commande ;
13. le client est informé.

La validation d'un paiement doit être tracée.

---

# 26. ESPACE CLIENT

L'espace Client doit être une véritable interface de gestion du compte NR-TRANS.

Il doit être premium, clair et cohérent avec l'application.

Prévoir notamment :

## Tableau de bord du compte

- forfait actuel ;
- statut ;
- date de début ;
- date d'expiration ;
- jours restants ;
- nombre de véhicules ;
- actions rapides ;
- éventuelles alertes.

## Profil

- informations personnelles/professionnelles ;
- coordonnées ;
- modification des informations autorisées.

## Abonnement

- forfait actuel ;
- durée ;
- renouvellement ;
- changement de forfait ;
- historique.

## Commandes

- références ;
- montants ;
- moyens de paiement ;
- statuts ;
- justificatifs ;
- historique.

## Paiements

- historique ;
- références ;
- reçus/justificatifs ;
- statut.

## Véhicules

Accès cohérent à la gestion du parc.

## Utilisateurs secondaires

Création et gestion des accès délégués.

## Sécurité

- mot de passe ;
- sessions ;
- appareils si pertinent ;
- déconnexion.

## Notifications

Notifications relatives :

- abonnement ;
- paiement ;
- expiration ;
- sécurité ;
- informations importantes.

## Assistance

Moyen de contacter MORA Shawiri ou d'obtenir de l'aide.

## Avis client

Le client doit pouvoir laisser un avis concernant NR-TRANS.

Prévoir :

- note ;
- commentaire ;
- date ;
- statut de modération.

L'avis ne doit pas être publié automatiquement sur la Landing Page sans validation/modération administrative.

---

# 27. UTILISATEURS SECONDAIRES

Le propriétaire principal doit pouvoir créer des accès secondaires.

Exemples :

- associé ;
- comptable ;
- gestionnaire ;
- personne chargée de consultation.

Le premier rôle explicitement requis est :

**Lecture seule**

Cet utilisateur peut consulter les données auxquelles il est autorisé mais ne peut pas :

- créer ;
- modifier ;
- supprimer des opérations métier ;
- modifier l'abonnement ;
- modifier les moyens de paiement ;
- gérer les paramètres critiques ;
- gérer les autres utilisateurs sans autorisation.

L'architecture doit permettre à terme des permissions plus détaillées.

Prévoir la possibilité de limiter un utilisateur secondaire :

- à l'ensemble du parc ;
- ou à certains véhicules.

Le nombre exact d'utilisateurs secondaires autorisés par formule doit rester configurable afin de pouvoir faire évoluer la politique commerciale sans réécriture du système.

---

# 28. ESPACE ADMINISTRATEUR

L'espace Administrateur doit être particulièrement complet.

Il représente le cockpit de gestion de NR-TRANS pour MORA Shawiri.

Prévoir notamment :

## Dashboard Administrateur

Afficher des indicateurs pertinents tels que :

- nombre de clients ;
- nouveaux inscrits ;
- essais gratuits actifs ;
- abonnements Avancé ;
- abonnements VIP ;
- abonnements expirés ;
- commandes en attente ;
- paiements à vérifier ;
- revenus ;
- évolution des souscriptions ;
- codes promo ;
- avis à modérer ;
- alertes.

## Clients

Permettre :

- recherche ;
- filtres ;
- consultation du profil ;
- abonnement ;
- véhicules ;
- commandes ;
- paiements ;
- utilisateurs secondaires ;
- historique pertinent ;
- statut du compte.

Les données métier sensibles ne doivent pas nécessairement être exposées à l'administrateur si elles ne sont pas nécessaires à l'administration commerciale.

## Abonnements

- activation ;
- renouvellement ;
- expiration ;
- modification ;
- historique ;
- interventions administratives tracées.

## Commandes

- consultation ;
- filtres ;
- vérification ;
- validation ;
- refus ;
- historique.

## Paiements

- moyen ;
- référence ;
- justificatif ;
- montant attendu ;
- montant déclaré ;
- statut ;
- validation.

## Codes promo

Module complet tel que défini précédemment.

## Avis

- avis reçus ;
- note ;
- commentaire ;
- approuver ;
- masquer ;
- refuser ;
- sélectionner éventuellement certains avis pour la Landing Page.

## Moyens de paiement

L'administrateur doit pouvoir :

- activer/désactiver un moyen ;
- changer ses informations ;
- définir son statut ;
- afficher « Bientôt disponible » lorsque nécessaire.

## Paramètres commerciaux

Centraliser autant que possible les paramètres susceptibles d'évoluer :

- prix ;
- durées ;
- caractéristiques des forfaits ;
- moyens de paiement ;
- règles commerciales configurables ;
- limitations configurables.

Éviter de disperser les paramètres commerciaux dans le code.

## Journal d'activité

Tracer les actions administratives sensibles :

- validation paiement ;
- changement abonnement ;
- création code promo ;
- désactivation compte ;
- changement de paramètres commerciaux ;
- autres opérations critiques.

---

# 29. RÔLES ET AUTORISATIONS

Prévoir au minimum :

- visiteur ;
- propriétaire/client ;
- utilisateur secondaire ;
- administrateur ;
- super administrateur si l'architecture le nécessite.

L'interface ne suffit pas pour sécuriser les autorisations.

Les contrôles doivent également être réalisés côté serveur / base de données.

Un utilisateur ne doit jamais pouvoir accéder aux données d'un autre compte en modifiant simplement une URL, un identifiant ou une requête.

---

# 30. SUPABASE

Supabase doit servir de socle backend lorsque pertinent.

Prévoir notamment :

- Auth ;
- PostgreSQL ;
- RLS ;
- stockage de fichiers si nécessaire ;
- fonctions serveur/Edge Functions lorsque pertinent ;
- données commerciales ;
- synchronisation.

Les informations nécessaires sont présentes dans les fichiers de configuration fournis dans la documentation.

RÈGLE ABSOLUE :

Aucun secret serveur ne doit être exposé dans le frontend, dans un dépôt Git public ou dans les rapports.

Les fichiers contenant des secrets doivent être protégés par `.gitignore`.

Ne jamais reproduire les secrets dans les rapports.

---

# 31. BASE DE DONNÉES

La base doit être conçue proprement pour supporter notamment :

- profils ;
- organisations/comptes clients si nécessaire ;
- abonnements ;
- plans ;
- tarifs ;
- commandes ;
- paiements ;
- codes promo ;
- utilisations de codes promo ;
- véhicules ;
- prêts ;
- relations prêts/véhicules ;
- utilisateurs secondaires ;
- permissions ;
- avis ;
- notifications ;
- journaux ;
- données nécessaires à la synchronisation.

Les tables exactes doivent être conçues après audit du projet existant.

Utiliser :

- clés primaires stables ;
- relations explicites ;
- contraintes ;
- index pertinents ;
- timestamps ;
- migrations versionnées.

---

# 32. ROW LEVEL SECURITY

Activer et configurer RLS sur les données concernées.

Exemples :

Un client ne doit pouvoir accéder qu'à :

- son compte ;
- ses véhicules ;
- ses données ;
- ses commandes ;
- ses paiements ;
- ses utilisateurs autorisés.

Un utilisateur secondaire ne doit accéder qu'aux données autorisées par le propriétaire.

Les opérations administratives sensibles doivent nécessiter les droits correspondants.

Ne jamais se fier uniquement au rôle affiché dans le frontend.

---

# 33. DONNÉES ET CONFIDENTIALITÉ

NR-TRANS manipule des informations financières et opérationnelles importantes.

Appliquer notamment :

- principe du moindre privilège ;
- validation des entrées ;
- contrôle d'accès ;
- RLS ;
- protection des secrets ;
- sessions sécurisées ;
- journalisation des actions sensibles ;
- sauvegardes appropriées ;
- pas d'informations sensibles inutiles dans les logs.

Ne jamais afficher les secrets techniques dans les rapports.

---

# 34. SAUVEGARDE ET RESTAURATION

Conserver et améliorer les mécanismes de sauvegarde existants lorsque nécessaire.

La sauvegarde/restauration doit être fiable.

Les anciennes sauvegardes compatibles ne doivent pas être rendues inutilisables arbitrairement.

Si une migration de format est nécessaire :

- la documenter ;
- la tester ;
- préserver autant que possible la rétrocompatibilité.

Prévoir une protection contre :

- doublons ;
- imports partiels incohérents ;
- corruption ;
- écrasement accidentel.

---

# 35. RAPPORTS ET ANALYSES

Conserver les rapports existants et les adapter au multi-véhicules.

Prévoir :

- rapports globaux ;
- rapports par véhicule ;
- filtres par période ;
- comparaison lorsque pertinente ;
- synthèses financières ;
- rentabilité ;
- dépenses ;
- recettes/versements ;
- entretien ;
- prêt ;
- chauffeur.

Les chiffres affichés doivent provenir des mêmes règles métier que les données principales.

---

# 36. TABLEAU DE BORD

Le Dashboard doit devenir l'un des écrans les plus impressionnants de NR-TRANS.

Il doit rester fonctionnel avant tout.

Prévoir une lecture rapide de :

- activité ;
- recettes ;
- dépenses ;
- trésorerie ;
- rentabilité ;
- prêts ;
- entretien ;
- véhicules ;
- tendances ;
- alertes.

L'utilisateur doit pouvoir passer entre :

- Tous les véhicules ;
- Un véhicule précis.

Les graphiques doivent être utiles et non décoratifs.

---

# 37. CAPTURES D'ÉCRAN

À la fin du développement, produire exactement :

## Version PC

4 captures stratégiques.

Destination :

`05 Captures d'écran/Version PC/`

## Version Mobile

4 captures stratégiques.

Destination :

`05 Captures d'écran/Version Mobile/`

Les captures doivent être :

- réelles ;
- propres ;
- nettes ;
- bien cadrées ;
- sans IDE ;
- sans console ;
- sans données sensibles ;
- avec des données de démonstration réalistes ;
- utilisables pour la Landing Page ;
- utilisables pour les mockups ;
- utilisables pour les campagnes ;
- potentiellement utilisables ultérieurement pour Google Play.

Privilégier notamment :

1. Dashboard ;
2. gestion des versements/activité ;
3. trésorerie ou rapports ;
4. écran démontrant une autre force importante de NR-TRANS.

Les captures PC et Mobile doivent être adaptées à leur format respectif.

Ne pas simplement redimensionner une capture PC pour créer une version mobile.

---

# 38. SEO

La Landing Page doit disposer d'une optimisation SEO sérieuse.

Prévoir notamment :

- title ;
- meta description ;
- canonical ;
- Open Graph ;
- Twitter/X cards lorsque pertinent ;
- sitemap ;
- robots.txt ;
- favicon ;
- manifest ;
- données structurées pertinentes ;
- hiérarchie H1/H2/H3 ;
- URLs propres ;
- textes alternatifs ;
- performances ;
- responsive ;
- indexabilité ;
- contenu sémantique.

Le référencement doit notamment permettre de travailler des intentions liées à :

- logiciel de gestion transport ;
- gestion véhicule de transport ;
- gestion chauffeur ;
- suivi recettes transport ;
- suivi dépenses transport ;
- gestion parc automobile ;
- rentabilité véhicule ;
- gestion transport aux Comores ;
- expressions pertinentes découvertes lors du travail SEO.

Ne pas faire de keyword stuffing.

---

# 39. PERFORMANCE

La plateforme doit rester rapide, y compris sur des smartphones modestes et des connexions limitées.

Optimiser :

- JavaScript ;
- images ;
- polices ;
- requêtes ;
- bundle ;
- cache ;
- chargements ;
- base de données.

Éviter les dépendances lourdes sans justification.

---

# 40. ACCESSIBILITÉ

Prévoir notamment :

- contraste suffisant ;
- navigation clavier lorsque pertinente ;
- labels ;
- focus visible ;
- boutons suffisamment grands ;
- messages d'erreur compréhensibles ;
- formulaires accessibles ;
- structure sémantique.

---

# 41. GITHUB

Les informations du compte/dépôt sont fournies séparément.

Utiliser Git proprement.

Workflow obligatoire :

1. établir la base ;
2. vérifier l'état Git ;
3. développer par lots cohérents ;
4. tester ;
5. commit ;
6. vérifier le commit ;
7. pousser lorsque configuré ;
8. poursuivre.

Ne pas laisser plusieurs heures de travail uniquement dans un environnement temporaire.

Créer des checkpoints durables avant :

- migrations importantes ;
- gros refactoring ;
- compilation longue ;
- déploiement ;
- opérations risquées.

Ne jamais commit :

- mots de passe ;
- clés privées ;
- secrets Supabase ;
- tokens ;
- chaînes de connexion privées.

---

# 42. VERCEL, DOMAINE ET DNS

Le projet doit être préparé et déployé sur Vercel.

Le domaine de production officiel prévu est :

`nr-trans.morashawiri.com`

Le domaine principal `morashawiri.com` est géré côté Hostinger.

La configuration du domaine doit être prise en compte dès le début du projet et non uniquement à la livraison finale.

Codex doit :

1. configurer correctement le projet Vercel ;
2. effectuer les déploiements intermédiaires nécessaires ;
3. préparer le domaine personnalisé `nr-trans.morashawiri.com` dans Vercel dès que l'état du projet le permet raisonnablement ;
4. récupérer les informations DNS réellement demandées par Vercel ;
5. fournir au propriétaire les valeurs exactes à configurer côté Hostinger ;
6. ne jamais inventer une valeur DNS ;
7. attendre l'intervention du propriétaire lorsque la modification Hostinger nécessite son action ;
8. après confirmation de la modification DNS, vérifier la propagation et la validation du domaine dans Vercel ;
9. vérifier HTTPS et le certificat ;
10. ouvrir et vérifier réellement l'URL de production.

Lorsque l'intervention du propriétaire est nécessaire, Codex doit fournir des instructions très claires, notamment :

- Type d'enregistrement ;
- Nom / Host ;
- Valeur / Destination ;
- TTL recommandé ou valeur par défaut Hostinger.

Ces valeurs doivent provenir de la configuration réellement affichée par Vercel. Codex ne doit pas supposer à l'avance qu'un CNAME, un enregistrement A ou un autre type précis sera nécessaire.

Une fois les DNS configurés côté Hostinger, Codex doit reprendre les vérifications et confirmer l'état réel du domaine.

L'objectif final est que :

`https://nr-trans.morashawiri.com`

soit l'adresse officielle publique de NR-TRANS.

Les URLs temporaires `.vercel.app` peuvent être utilisées pendant le développement et les tests, mais elles ne constituent pas l'URL commerciale finale.

---

# 43. GESTION DES ERREURS

L'application doit fournir des messages compréhensibles.

Éviter :

- erreurs techniques brutes ;
- écrans blancs ;
- erreurs silencieuses ;
- boutons semblant fonctionner alors que l'opération a échoué.

Les opérations importantes doivent confirmer :

- succès ;
- échec ;
- attente ;
- synchronisation.

---

# 44. TESTS

Une stratégie de tests sérieuse est obligatoire.

Conserver les tests utiles du projet existant.

Ajouter des tests pour les nouveautés.

Tester notamment :

## Fonctionnel

- fonctionnalités historiques ;
- calculs financiers ;
- multi-véhicules ;
- prêts multi-véhicules ;
- rapports ;
- filtres ;
- sauvegardes.

## Authentification

- inscription ;
- connexion ;
- déconnexion ;
- récupération ;
- routes protégées ;
- rôles.

## Abonnements

- essai 7 jours ;
- expiration ;
- Avancé ;
- VIP ;
- 1/3/6/12 mois ;
- renouvellement ;
- conservation des données.

## Tarification

Vérifier exactement :

Avancé :
- 1 mois = 2 500 ;
- 3 mois = 6 000 ;
- 6 mois = 12 000 ;
- 12 mois = 18 000.

VIP :
- 1 mois = 5 000 ;
- 3 mois = 13 500 ;
- 6 mois = 27 000 ;
- 12 mois = 48 000.

## Codes promo

- montant fixe ;
- pourcentage ;
- expiration ;
- désactivation ;
- limites ;
- 100 % ;
- mauvais code ;
- code non applicable ;
- calcul serveur.

## Paiement

- déclaration ;
- justificatif ;
- vérification ;
- validation ;
- refus ;
- activation abonnement.

## Permissions

- propriétaire ;
- utilisateur secondaire ;
- lecture seule ;
- véhicule autorisé/non autorisé ;
- tentative d'accès à un autre client.

## Offline

- perte de connexion ;
- opérations locales ;
- reconnexion ;
- synchronisation ;
- doublons ;
- conflits.

## Responsive

Tester plusieurs tailles PC et Mobile.

---

# 45. DONNÉES DE DÉMONSTRATION

Prévoir des données de démonstration réalistes permettant de tester et présenter NR-TRANS.

Elles doivent couvrir notamment :

- plusieurs véhicules ;
- chauffeur ;
- versements ;
- dépenses ;
- entretien ;
- prêt ;
- trésorerie ;
- rapports.

Aucune donnée personnelle réelle ou secret ne doit être utilisé.

---

# 46. ADMINISTRATION DES PARAMÈTRES COMMERCIAUX

Autant que raisonnablement possible, les règles commerciales susceptibles d'évoluer doivent être configurables depuis l'administration ou centralisées dans une configuration sécurisée.

Exemples :

- prix ;
- durées ;
- activation des moyens de paiement ;
- informations de paiement ;
- codes promo ;
- limites utilisateurs secondaires ;
- disponibilité des offres.

Les calculs financiers métier de l'outil ne doivent cependant pas être confondus avec les paramètres commerciaux du SaaS.

---

# 47. AVIS CLIENTS

Le système d'avis doit permettre :

Côté client :

- laisser une note ;
- écrire un commentaire ;
- envoyer l'avis ;
- éventuellement modifier selon les règles retenues.

Côté administration :

- consulter ;
- modérer ;
- approuver ;
- masquer/refuser ;
- sélectionner les avis destinés à la Landing Page.

Aucun avis ne doit être fabriqué artificiellement.

---

# 48. NOTIFICATIONS

Prévoir une architecture de notifications concernant notamment :

- création de compte ;
- commande ;
- paiement ;
- validation ;
- refus ;
- abonnement bientôt expiré ;
- abonnement expiré ;
- renouvellement ;
- sécurité ;
- informations importantes.

Les canaux réellement disponibles doivent être utilisés.

Ne pas prétendre envoyer un SMS, WhatsApp ou email si le service correspondant n'est pas réellement configuré.

---

# 49. PWA

La solution doit pouvoir se comporter comme une véritable Progressive Web App lorsque techniquement pertinent.

Prévoir :

- manifest ;
- icônes ;
- service worker ;
- cache ;
- installation ;
- comportement offline ;
- mise à jour contrôlée ;
- détection de nouvelle version.

Éviter qu'une mise à jour de l'application détruise les données locales.

---

# 50. ÉVOLUTIVITÉ

L'architecture doit permettre ultérieurement :

- application Android ;
- Google Play ;
- paiement carte ;
- automatisation Mobile Money si des API deviennent disponibles ;
- nouveaux forfaits ;
- nouveaux rôles ;
- davantage de permissions ;
- notifications avancées ;
- nouveaux rapports ;
- autres évolutions.

Ne pas implémenter prématurément toutes ces possibilités.

Préparer simplement une architecture qui ne les bloque pas.

---

# 51. SÉCURITÉ DES SECRETS

Les fichiers contenant :

- Supabase ;
- GitHub ;
- Vercel ;
- SMTP ;
- mots de passe ;
- tokens ;
- clés API ;

sont des fichiers de travail sensibles.

Ils ne doivent jamais :

- apparaître dans le frontend ;
- être affichés dans les captures ;
- être commités dans Git ;
- être reproduits dans les rapports ;
- être exposés publiquement.

Créer et maintenir un `.gitignore` approprié.

---

# 52. RAPPORTS DE DÉVELOPPEMENT

Placer les rapports dans :

`06 Rapports`

Les rapports doivent permettre de connaître :

- ce qui a été développé ;
- fichiers modifiés ;
- migrations ;
- tests exécutés ;
- résultats ;
- problèmes rencontrés ;
- décisions techniques ;
- limitations ;
- éléments restant à faire ;
- déploiement ;
- commit correspondant.

Ne jamais inclure de secrets dans les rapports.

---

# 53. WORKFLOW DE DÉVELOPPEMENT

Codex doit commencer par une phase d'audit.

Ordre recommandé :

1. lire tout le présent cahier des charges ;
2. lire les autres documents du dossier Documentation ;
3. analyser `01 Projet à reproduire` ;
4. inventorier les fonctionnalités existantes ;
5. identifier les règles métier ;
6. identifier les tests existants ;
7. comprendre les données ;
8. vérifier Git ;
9. créer une base/checkpoint durable ;
10. proposer l'architecture cible dans un rapport ;
11. intégrer dès l'architecture initiale le domaine officiel `nr-trans.morashawiri.com`, Vercel, les redirections d'authentification, la PWA et le SEO ;
12. commencer le développement.

Ensuite, travailler par lots fonctionnels.

Pour chaque lot :

DÉVELOPPEMENT
→ TESTS
→ CORRECTIONS
→ COMMIT
→ VÉRIFICATION DU COMMIT
→ RAPPORT/CHECKPOINT SI NÉCESSAIRE
→ LOT SUIVANT

Ne pas attendre la toute fin pour sauvegarder le travail.

---

# 54. DÉPLOIEMENT ET MISE EN PRODUCTION

Le déploiement Vercel doit être intégré au workflow du projet et ne doit pas être traité uniquement à la toute fin.

Des déploiements intermédiaires peuvent être réalisés afin de vérifier progressivement :

- Landing Page ;
- responsive ;
- authentification ;
- Supabase ;
- espace Client ;
- application NR-TRANS ;
- espace Administrateur ;
- PWA ;
- comportement réel en production.

Le domaine final est :

`https://nr-trans.morashawiri.com`

Dès que l'état du projet permet raisonnablement la configuration du domaine, Codex doit préparer le domaine dans Vercel et fournir au propriétaire les informations DNS exactes nécessaires pour Hostinger.

Après intervention du propriétaire sur Hostinger, Codex doit vérifier la validation effective du domaine.

Avant la livraison finale :

1. exécuter les tests ;
2. effectuer le build production ;
3. vérifier le build ;
4. créer un checkpoint Git durable ;
5. créer le commit ;
6. vérifier réellement que le commit existe ;
7. pousser sur GitHub ;
8. déployer sur Vercel ;
9. vérifier le déploiement ;
10. vérifier `nr-trans.morashawiri.com` ;
11. vérifier HTTPS ;
12. tester la Landing Page ;
13. tester l'inscription ;
14. tester la connexion ;
15. tester l'espace Client ;
16. tester l'application NR-TRANS ;
17. tester l'espace Administrateur ;
18. tester les abonnements et calculs ;
19. tester PC et Mobile ;
20. tester PWA / Offline ;
21. produire les captures finales ;
22. produire le rapport final.

Le projet ne doit pas être déclaré déployé simplement parce que Vercel indique qu'un déploiement existe. L'URL de production doit réellement être ouverte et vérifiée.

---

# 55. CRITÈRES DE LIVRAISON

Le projet ne doit pas être déclaré terminé simplement parce que le code compile.

La livraison finale doit comporter au minimum :

- Landing Page fonctionnelle ;
- outil NR-TRANS fonctionnel ;
- fonctionnalités historiques conservées ;
- multi-véhicules ;
- prêts multi-véhicules ;
- authentification ;
- espace Client ;
- utilisateurs secondaires ;
- espace Administrateur ;
- abonnements ;
- tarification correcte ;
- codes promo ;
- commandes ;
- paiements manuels ;
- avis ;
- Supabase ;
- RLS ;
- PWA ;
- online/offline ;
- synchronisation ;
- responsive PC/mobile ;
- SEO ;
- tests ;
- documentation ;
- déploiement Vercel vérifié ;
- domaine officiel `https://nr-trans.morashawiri.com` validé et accessible en HTTPS ;
- captures ;
- rapports.

---

# 56. INTERDICTIONS IMPORTANTES

Ne pas :

- supprimer une fonctionnalité historique sans justification ;
- simplifier arbitrairement les règles métier ;
- modifier les tarifs validés ;
- exposer les secrets ;
- simuler un paiement réel ;
- inventer un avis client ;
- fabriquer une fausse capture présentée comme réelle ;
- déclarer un test réussi sans l'avoir exécuté ;
- déclarer un déploiement réussi sans l'avoir vérifié ;
- écraser le projet de référence ;
- supprimer les données d'un client à expiration ;
- donner des droits administratifs au frontend sans contrôle serveur ;
- stocker les mots de passe en clair ;
- faire dépendre les calculs commerciaux sensibles uniquement du JavaScript client.

---

# 57. PRIORITÉ PRODUIT

L'objectif n'est pas seulement de refaire l'ancienne application sur Internet.

NR-TRANS doit devenir un véritable produit commercial de MORA Shawiri.

La nouvelle plateforme doit donner l'impression d'un produit :

- mature ;
- fiable ;
- moderne ;
- premium ;
- sécurisé ;
- simple ;
- professionnel.

L'utilisateur doit pouvoir comprendre rapidement :

- ce qu'il possède ;
- ce que rapporte son activité ;
- ce qu'elle lui coûte ;
- comment évoluent ses véhicules ;
- où en sont ses prêts ;
- ce qu'il doit surveiller.

L'administrateur doit pouvoir gérer efficacement l'activité commerciale de NR-TRANS sans intervenir directement dans la base de données pour les opérations courantes.

---

# 58. LIBERTÉ D'AMÉLIORATION

Codex est autorisé à proposer et implémenter des améliorations pertinentes lorsqu'elles :

- améliorent réellement NR-TRANS ;
- respectent les règles métier ;
- ne suppriment pas les fonctions validées ;
- restent cohérentes avec le produit ;
- n'ajoutent pas une complexité inutile.

L'objectif est de produire une version sensiblement supérieure à l'application de référence.

Le résultat final doit pouvoir impressionner aussi bien sur ordinateur que sur smartphone.

---

# 59. PRINCIPE FINAL

La règle centrale du projet est :

**Conserver ce qui fonctionne. Comprendre avant de modifier. Étendre sans régresser. Tester avant de livrer. Sauvegarder avant de poursuivre.**

NR-TRANS doit pouvoir être commercialisé au public comme une solution professionnelle de gestion du transport éditée par MORA Shawiri.