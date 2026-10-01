# Recette Supabase distante — 2 octobre 2026

Projet nr-trans : deux migrations installées, 19 tables métier avec RLS et six RPC accessibles uniquement au rôle serveur. Vérification via les catalogues PostgreSQL et l'API REST : huit tarifs accessibles à l'anonyme ; données financières refusées.

`node scripts/test-remote.mjs` : 19 tests réussis, zéro échec, exécutés directement contre le Session pooler avec TLS et vérification du certificat. Ce total comprend le test parent et 18 scénarios. Les fixtures sont transactionnelles et annulées en fin de recette.

Scénarios : écriture atomique et replay ; conflit de version ; isolation de deux organisations ; propriétaire et lecteur secondaire limité à un véhicule ; refus d'écriture et d'élévation ; administrateur commercial sans lecture métier universelle ; référence inter-compte refusée ; expiration sans suppression ; anonyme ; huit tarifs officiels ; commande idempotente, déclaration et validation unique ; cadeau 100 % et plafond promotionnel ; changement de plan non défini refusé ; Wakati indisponible ; essai idempotent de sept jours ; prêt partagé VIP et véhicule non autorisé masqué ; limite Avancé d'un véhicule ; réductions fixes et proportionnelles ; refus administratif motivé sans activation.

Le renouvellement conserve le reliquat et une validation répétée n'ajoute pas d'abonnement. Les deux écarts initiaux du banc de test sont corrigés sans changer TLS, RLS ou les contraintes métier. Les mêmes 19 tests passent aussi sur PostgreSQL embarqué local.

Portée : les rôles PostgreSQL réels sont exercés avec le contexte auth.uid des utilisateurs de recette ; les parcours de connexion HTTP avec de véritables sessions Auth seront vérifiés avec l'adaptateur serveur. Aucun utilisateur de production n'a été créé par ces tests.

Point de reprise : adaptateur Vercel authentifié, inscription et contexte organisation, puis parcours client/admin et justificatifs privés. Les migrations existantes sont immuables et leurs empreintes sont conservées en base.
