# Adaptateur serveur et Auth réelle — 2 octobre 2026

Raccordement des API Vercel `/api/config` et `/api/platform` et du serveur local Vite au projet Supabase réel. Les clés privées restent dans les variables serveur, alimentées localement depuis le fichier sécurisé et exclues de Git.

Authentification : vérification distante du JWT par getUser, refus des comptes anonymes, vérification de la session dans auth.sessions pour refuser les jetons de sessions révoquées. Organisation et rôle sont lus en base, jamais choisis dans le corps de la requête ou user_metadata. Les métadonnées éditables servent seulement aux libellés.

Migration complémentaire `20261001221354_authenticated_platform.sql` appliquée : lecture atomique/versionnée soumise à RLS et contrôle serveur des sessions. Snapshot propriétaire complet et snapshot lecteur limité à ses véhicules. Les écritures passent par la validation du moteur financier, les UUID uniques et la RPC transactionnelle.

API raccordées : contexte, synchronisation, espace client, listes administratives commerciales, devis, commandes, déclaration, décision administrative, profil et avis en attente de modération. Bucket `payment-proofs` privé, 5 MiB, PDF/JPEG/PNG ; chemins liés à l'organisation et à la commande, téléversement signé et consultation signée de courte durée après contrôle des droits. Vérification du contenu du fichier lors de la déclaration.

## Vérification réelle

- 20 tests PostgreSQL distants réussis après la nouvelle migration, dont lecture cohérente et contrôle des sessions.
- Recette HTTP utilisant deux comptes Auth temporaires et de vraies connexions par mot de passe : essai, organisations distinctes, écriture, replay, conflit, snapshot RLS, tarifs calculés côté serveur malgré un prix falsifié, accès administrateur refusé, justificatif téléversé mais inaccessible à l'autre compte, déclaration de paiement, profil, avis et refus du jeton après déconnexion globale.
- Fixtures Auth, organisations et fichiers de recette supprimés après exécution.
- Compilation de production réussie. Accueil et démonstration chargés dans le navigateur ; capture technique inspectée, grille et logo correctement contenus.

## Suite

Finaliser les interfaces client/admin, utilisateurs secondaires, politiques commerciales configurables et avis publics modérés. Raccorder la récupération serveur aux données locales, proposer une résolution explicite des conflits et permettre la reprise hors ligne. Recette navigateur authentifiée et mobile, puis Vercel/domaine et captures finales. Ce lot ne constitue pas encore la livraison de ces parcours complets.
