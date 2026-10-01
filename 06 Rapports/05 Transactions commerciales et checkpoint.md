# Transactions commerciales — checkpoint du 1 octobre 2026

Reprise depuis les checkpoints sauvegardés, sans modification du dossier de référence `01 Projet à reproduire`.

## Lot réalisé

Migration additive `20261001152615_commercial_transactions.sql` : ouverture idempotente du compte et essai de sept jours ; devis calculé côté PostgreSQL avec les huit tarifs officiels ; restrictions et plafond d'utilisation des promotions ; création de commande idempotente ; déclaration de paiement ; décision administrative et activation atomique. Une promotion à 100 % active automatiquement l'abonnement. Un renouvellement du même forfait conserve la date de fin restante. Un changement de forfait payant reste bloqué tant que sa politique n'est pas définie.

Les RPC sont réservées au rôle serveur. Une clé de commande réutilisée avec une offre, un moyen de paiement ou un code promotionnel différent est refusée. La répétition d'une validation ne crée pas un deuxième abonnement. Wakati reste indisponible.

## Vérification

`npm test` : 47 tests réussis, zéro échec, incluant le moteur financier historique, la migration multi-véhicules, IndexedDB, les règles commerciales et les politiques RLS exécutées dans PostgreSQL embarqué PGlite. `npm run build` : réussi, pages publiques pré-rendues et ressources PWA générées.

Ces résultats sont locaux. Aucune migration n'a été appliquée à Supabase distant, aucune mise en production Vercel n'a été effectuée.

## Accès restant nécessaire

Le fichier local `02 Documentation/Informations des comptes.txt` contient toujours uniquement la connexion PostgreSQL directe ; fichier inchangé lors de la dernière vérification. L'adresse directe exige IPv6, inaccessible depuis cet environnement. L'API REST est joignable mais ne suffit pas à auditer l'intégralité du schéma. Le connecteur installé correspond à un autre compte.

Dans Supabase, ouvrir le projet **nr-trans**, puis **Connect → Session pooler → URI**. Ajouter dans ce fichier local une ligne `Session pooler : postgresql://…`. Le mot de passe peut rester sous forme `[YOUR-PASSWORD]` : le script utilise celui déjà fourni. Ne pas publier cette chaîne dans Git ou dans le chat. Le fichier reste exclu de Git.

## Suite et limites actuelles

1. Adaptateur serveur : authentification vérifiée, contexte organisation, validation du moteur avant RPC, commandes et justificatifs privés.
2. Audit/export distant avant migration, puis recette des politiques Supabase réelles et des parcours client/admin.
3. Finaliser la reprise hors ligne des sessions, la récupération des changements serveur et la résolution explicite des conflits ; la file locale actuelle préserve les données mais ne remplace pas ces parcours.
4. Finaliser les formulaires multi-conducteurs, paramètres et contrôles de quotas, puis recette complète PC/mobile.
5. Déployer sur Vercel, relever les valeurs DNS réelles, produire les quatre captures PC et quatre captures mobile finales.

La plateforme complète n'est donc pas encore livrée ; ce checkpoint sécurise un lot de fondations testé et reproductible.
