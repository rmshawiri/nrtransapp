# Reprise — interfaces et stockage local

1 octobre 2026. Vérification de reprise : branche main ; HEAD local et GitHub identiques à `f7c1dbdfabe0adf2476d110ad02f345f030e3cf6` (le hash f7c1adb cité dans la consigne ne correspond pas au commit réel). Aucun changement local supprimé.

## Travail préservé et complété

Landing Page et tarifs publics, parcours d’inscription progressif, écrans de connexion/récupération, premières interfaces Client/Admin/paiement, reprise des modules historiques, sélecteurs flotte/chauffeur, ajout véhicules/chauffeurs, allocation des prêts, thèmes PC/mobile et marque officielle. Vite, pages publiques pré-rendues, ressources PWA versionnées et polices locales.

IndexedDB sépare les identités et la démonstration. L’écriture de l’état et de sa mutation est atomique ; révisions locales, empreinte d’import, file persistante, acquittement serveur et reprise. Les tests de réseau utilisent un transport simulé : ils ne prouvent pas encore la synchronisation distante.

## Vérifications effectuées

- 33 tests réussis, y compris les 17 historiques et 4 nouveaux scénarios IndexedDB.
- Build de production réussi : pages pré-rendues, bundles, service worker et coque offline générés.
- La démonstration a été ouverte dans un vrai navigateur ; les douze modules, filtres et indicateurs sont rendus. Recette exhaustive des formulaires et mobile encore à faire.
- API Supabase réaudité : aucune table métier exposée, aucun bucket. Connexion IPv6 directe inaccessible. Aucun changement distant.
- Vercel réaudité avec le compte fourni : aucun projet NR-TRANS. Aucun déploiement effectué.

## Limites explicites du checkpoint

Ce checkpoint sécurise une version intermédiaire. Les espaces connectés attendent encore les endpoints serveur et le schéma. L’inscription reste fermée (`ready:false`) pour éviter de présenter un service commercial opérationnel avant ses contrôles serveur. La PWA est générée mais son scénario réel offline/auth et son installation restent à valider. Les pages légales sont des textes de travail à faire valider par l’éditeur. Aucune capture finale n’a été produite.

Prochaine phase : modèle PostgreSQL, tests RLS d’isolation et de lecture seule, contrats de synchronisation idempotents/concurrents, contrôles serveur commerciaux, puis raccordement distant après audit exhaustif.

Commit : `chore: secure recovered interfaces and offline foundation`.
