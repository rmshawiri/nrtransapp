# Reprise infrastructure — 2 octobre 2026

Branche : main. Dernier checkpoint avant reprise : 8febd9d.

Le Session pooler fonctionne avec vérification du certificat et du nom TLS. Le lecteur de configuration accepte également une URI autonome sous une rubrique Shared pooler. Aucun identifiant n'est intégré aux scripts. Le certificat racine public Supabase est versionné ; ce certificat ne contient aucune clé privée.

## Checkpoint avant migrations

Inventaire privé terminé le 1 octobre 2026 à 16:09:06 UTC, fichier exclu de Git : `04 Codes/.private/database-checkpoint-1790870959772.json`.

SHA-256 : `9d493b445c4fcb51f510744caab0d041b1d512819a43c941d4b26f5ace106236`.

Constat : aucune table métier, aucun utilisateur Auth, aucun bucket ni objet Storage et aucun secret Vault. Les schémas techniques Supabase sont conservés. Définitions de fonctions, politiques, vues, index, grants, extensions, triggers et publications inventoriées. Aucune suppression nécessaire.

Les migrations `20261001151646_platform_foundation.sql` et `20261001152615_commercial_transactions.sql` ont déjà été appliquées avec succès à 16:10 UTC. Le lanceur conserve leur empreinte dans `nr_private.deployment_migrations` et refuse une modification ultérieure de leur contenu. Il ne faut pas les réappliquer ni les réécrire.

## Vérifications et point de reprise

48 tests locaux réussis. Première recette SQL distante : règles d'isolation, viewer, administrateur commercial, expiration, tarifs, commandes, promotions, renouvellement et essai réussis. Deux assertions du banc de test ont échoué : représentation texte des bigint dans le pilote pg et report des contraintes différées par la transaction englobant les fixtures. Corrections locales : conversion explicite de la version pour cette assertion et vérification des contraintes avant chaque libération du savepoint. Aucune règle de sécurité modifiée.

La recette distante n'est pas encore déclarée validée. Relancer `node scripts/test-remote.mjs` depuis `04 Codes`, puis compléter les scénarios demandés. Les fixtures sont contenues dans une transaction annulée en finally, y compris en cas d'échec. Reprise ensuite : checkpoint distant validé, adaptateur serveur et raccordement des parcours.
