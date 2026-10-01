# NR-TRANS — Audit initial et plan d’exécution

Date : 1 octobre 2026. État : audit et socle, aucune livraison finale revendiquée.

## Documents et périmètre

Cahier des charges v1.1, charte écrite et image, contenu de Landing Page, coordonnées et fichier de comptes consultés. Les deux fichiers TXT sont présents sans les préfixes numériques annoncés. Les secrets sont lus uniquement par les scripts locaux ; leur contenu est exclu de Git. Le dossier `01 Projet à reproduire` reste intact. `04 Codes` était vide.

## Référence fonctionnelle

Application JavaScript native sans dépendance : `core.js` (calculs/validation), `app.js` (11 modules), `storage.js` (document IndexedDB atomique), service worker et diagnostics isolés. Le dossier dist reprend les ressources. Serveur local lancé sur 127.0.0.1:8765. **17/17 tests Node réussis avant modification.** La validation navigateur est en cours, et ne doit pas être déduite des tests Node.

Modules à conserver : dashboard, versements avec recherche/statuts/incidents/km, dépenses et catégories, entretien/rappels, commissions et salaires dus, paiements/avances chauffeur, prêts/échéanciers/partiels, trésorerie/apports/retraits, simulation de trois scénarios, rapports/périodes/impression, paramètres, sauvegarde/restauration/démonstration/diagnostic.

Règles critiques :

- La recette est le versement reçu par le propriétaire. La commission est due séparément, proportionnelle ou par tranches complètes quotidiennes.
- Les règles historiques sont figées dans les journées et les salaires. Les modifications de paramètres ne réécrivent pas le passé.
- Un salaire fixe doit être explicitement saisi pour chaque mois ; alerte en cas de mois travaillé sans salaire.
- Résultat = versements − dépenses − entretiens − carburant propriétaire − rémunération due − intérêts/frais payés. Capital, achat, apports et retraits affectent uniquement la trésorerie.
- Le registre est dérivé des sources, jamais une copie comptable indépendante. Aucun achat, déblocage ou remboursement n’est supposé à partir d’un contrat.
- Échéancier mensuel/hebdomadaire à annuités constantes ; dernière échéance ajustée ; remboursement anticipé sans rééchelonnement bancaire fictif.
- Une journée par date/véhicule, kilométrage chronologique, montants arrondis à deux décimales, pas de conversion de devise.

Limites existantes à étendre : validation exige exactement un véhicule/un chauffeur/deux propriétaires ; kilométrage calculé globalement ; salaires/paiements/mouvements sans affectation véhicule ; prêt avec un seul vehicleId ; stockage mono-document sans cloud ni authentification. La référence ne contient pas de quotas 14/28 opérations à reprendre.

## Services et sauvegarde du code

- Git absent initialement ; dépôt main créé localement, origin `rmshawiri/nrtransapp`. API GitHub : dépôt existant, public et vide. Identité de commit issue du compte authentifié. Push à vérifier après ce checkpoint.
- `.gitignore` protège fichiers de comptes, .env, clés privées, exports privés, dépendances et sorties de build. `.env.example` ne contient aucun secret.
- Supabase cible confirmée par fichier et API : projet nr-trans, référence dffmdfueoihfcrkjabaz. REST accessible avec l’accès dédié : aucune table métier exposée, uniquement RPC rls_auto_enable. Storage : aucun bucket. **Ce constat ne prouve pas que tous les schémas sont vides.**
- Audit PostgreSQL direct tenté : ENOTFOUND. Demande d’accès Session pooler ou connexion du plugin au bon compte envoyée. Inventaire exhaustif tables/fonctions/triggers/RLS/utilisateurs et export restent à faire. Aucune mutation distante réalisée.
- Les plugins Supabase/Vercel sont liés à un autre compte : ses projets ne sont pas ceux de NR-TRANS. Les accès dédiés du fichier fonctionnent. Vercel dédié : sept projets existants, aucun NR-TRANS. Aucun projet tiers modifié.
- Aucun domaine configuré ni valeur DNS supposée. Déploiement et vérification HTTPS restent à faire.

## Architecture cible

Frontend léger en modules JavaScript, Vite pour assemblage, polices Outfit/Inter locales et composants accessibles communs aux quatre espaces. Préserver les fonctions pures financières avec tests historiques, puis étendre leur modèle de façon explicite. Routes sous un domaine unique : `/`, `/inscription`, `/connexion`, `/tarifs`, `/paiement`, `/app`, `/client`, `/admin`. Vercel héberge ressources et API serveur ; Supabase fournit Auth/PostgreSQL/Storage privé. Les pages publiques seront pré-rendues pour SEO.

PostgreSQL : organisations et membres, profils, véhicules/chauffeurs/propriétaires, opérations métier normalisées, prêts et affectations plusieurs-à-plusieurs ; séparation des abonnements/commandes/paiements/promos et des comptes d’exploitation. Les identifiants d’organisation et véhicule sont contrôlés par clés étrangères composites. Les montants restent décimaux exacts. Calculs commerciaux côté serveur, transitions de paiement et activation atomiques et idempotentes. Journal d’audit immuable pour les décisions sensibles.

La politique Avancé ↔ VIP reste configurable et non activée tant que la décision commerciale manque. Limite des utilisateurs secondaires configurable, sans chiffre arbitraire. Expiration conserve toutes les données. Renouvellement identique prolonge à partir de max(expiration, maintenant). Wakati reste bientôt disponible. PayPal n’est pas présenté comme automatisé.

## Offline et synchronisation

IndexedDB par identité/organisation, collections et file de mutations enregistrées dans la même transaction. UUID stables, version attendue, clés d’idempotence, tombstones. Le serveur revalide droits et données ; acquitte une mutation seulement après transaction réussie. Reprise après interruption sans doublon. Un conflit financier doit être visible et résolu explicitement, jamais écrasé automatiquement par dernier écrivain. Les données en attente restent disponibles à l’utilisateur. Séparation stricte démo/compte réel et purge des caches privés à la déconnexion.

Le service worker cache les ressources publiques statiques et la coque applicative ; pas les réponses d’authentification, justificatifs privés ou API commerciales. Inscription, paiements et administration nécessitent Internet. Un accès hors ligne n’accorde jamais de nouveaux droits serveur.

## Import historique

Conserver un parseur v1 strict. Migrer sur copie, convertir identifiants en UUID avec correspondance stable, créer une affectation de prêt vers le véhicule historique, rattacher salaires/paiements/mouvements historiques au véhicule unique. Comparer exactement tous les indicateurs avant/après. Prévisualiser l’import et confirmer avant transaction ; ne pas altérer le fichier original. Import répété détecté, aucune fusion silencieuse.

## Sécurité et recette

RLS activée sur toutes les tables exposées. Membres en lecture seule, filtre de véhicules attribués, mutations réservées au propriétaire actif. Aucun rôle tiré de user_metadata ou du navigateur. Secrets uniquement côté serveur. Justificatifs en bucket privé et URLs temporaires contrôlées. Admin commercial sans accès métier universel par défaut. Tests avec deux organisations, utilisateur secondaire, véhicules autorisés/interdits, anonyme et admin.

## Lots et critères de sortie

1. Audit/checkpoint, tests historiques et preuve navigateur.
2. Socle métier v2, flotte/prêts partagés, import v1, tests des totaux et allocations.
3. Socle commercial : tarifs exacts, promotions, dates/expiration/renouvellement, tests.
4. Schéma versionné et RLS après audit/export distant ; tests réels d’isolation.
5. Authentification, inscription progressive, commandes et paiement manuel.
6. Application métier complète, IndexedDB/file de synchronisation, conflits et PWA.
7. Espace Client et secondaire ; administration commerciale/avis/notifications.
8. Landing Page officielle, responsive, SEO, accessibilité.
9. Recette globale, build, checkpoint/push, Vercel et DNS réel Hostinger.
10. Production vérifiée, exactement quatre captures PC et quatre Mobile, rapport final.

Chaque lot : tests → corrections → commit → vérification → push → suite. Aucun test non exécuté ne sera annoncé réussi.

## Risques et interventions

Accès PostgreSQL à résoudre pour les migrations ; règles commerciales de changement de forfait à préciser avant activation ; configuration DNS Hostinger par le propriétaire après réception des valeurs réelles. Ces dépendances ne bloquent pas les développements locaux. La mise en production reste conditionnée à la recette complète, pas seulement au build.

Commit de ce rapport : identifiable par le message `chore: checkpoint audit initial NR-TRANS` ; SHA exact consigné dans le prochain rapport après vérification.
