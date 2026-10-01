# Socle PostgreSQL, RLS et synchronisation

Checkpoint précédent : `f22acb02ee6c413d7fddd7f2aea85455b54220e9`, vérifié sur GitHub.

Migration additive `20261001151646_platform_foundation.sql`, créée par la CLI Supabase. Exécutée uniquement sur PostgreSQL embarqué PGlite pour cette recette ; non appliquée au projet distant.

## Modèle

Organisations, membres, affectations véhicule, profils, administrateurs commerciaux, sources métier versionnées `nr_records` et relation explicite prêts/véhicules `nr_loan_allocations`. Les champs financiers historiques restent dans les payloads, les relations et dates sont indexées avec clés étrangères composites par organisation. Aucun registre de trésorerie dupliqué : il reste dérivé des sources.

Plans et huit prix officiels, abonnements, commandes, paiements, promos, moyens de paiement, avis, notifications, audit et reçus d’idempotence. Les prix navigateur ne constituent jamais la source d’une activation.

Les rôles navigateur ont uniquement SELECT avec RLS. Les écritures métier passent par un serveur authentifié, validation complète du moteur et RPC transactionnelle réservée à service_role. Les helpers RLS sont dans un schéma non exposé, avec search_path fixé et vérification de auth.uid(). Aucun droit basé sur user_metadata.

## Synchronisation

Pour cette fondation, le conflit est géré au niveau de l’organisation : une version attendue protège un lot métier cohérent. Le serveur verrouille l’organisation, vérifie propriétaire/abonnement/quota véhicule, applique le lot atomiquement et conserve les suppressions sous forme de tombstones. Une mutation déjà acquittée retrouve sa version sans créer d’opération supplémentaire ; réutiliser son UUID avec un autre contenu est refusé. Ce choix privilégie la cohérence financière ; la synchronisation différentielle par enregistrement pourra optimiser le volume sans changer les identifiants ou la sécurité.

L’envoi local est sérialisé, notamment entre onglets via Web Locks lorsque disponible. Les modifications locales conservent la dernière version serveur acquittée. Un conflit ne supprime pas la file.

## Tests réellement exécutés

8 sous-tests PostgreSQL réussis : replay idempotent ; conflit sans écrasement ; isolation A/B ; viewer limité à un véhicule sans écriture ni élévation ; admin commercial sans accès métier universel ; FK inter-client rejetée ; expiration conservant les lignes ; tarifs publics et finances interdites à l’anonyme. Les 4 tests IndexedDB passent après les adaptations de synchronisation.

Ces résultats prouvent les règles dans PostgreSQL local, pas leur application distante. Audit/export et migration Supabase attendent toujours l’accès Session pooler ou le connecteur approprié.

Correction visuelle : grille Hero à colonnes réductibles et logo contenu dans le header, après observation d’un débordement réel. Cache temporaire CLI exclu de Git.

Prochaine étape : transactions commerciales atomiques et adaptateur serveur authentifié ; puis tests élargis et raccordement distant.
