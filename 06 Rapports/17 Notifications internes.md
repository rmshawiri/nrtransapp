# Notifications internes — 3 octobre 2026

Migration 20261002220519_internal_notifications appliquée. Envoi réservé à nr_admins, ciblé sur une organisation existante, message borné, journal d’audit atomique. Identifiant de demande réutilisable : répéter la même demande ne crée ni notification ni audit supplémentaire ; réutiliser l’identifiant avec un autre contenu est refusé. Lecture réservée au propriétaire actif de l’organisation ; date de lecture conservée lors des répétitions. RPC inaccessibles directement aux rôles anon/authenticated.

Écrans : Admin Notifications (client, titre, message interne), Client Notifications (statut et action Marquer comme lue). Aucun e-mail externe envoyé. Les avis et instructions de paiement restent indépendants.

Validation : huit tests PostgreSQL locaux puis huit tests distants réussis ; fixtures annulées par transaction. Intégration HTTP réelle réussie avec création, répétition, lecture et isolation A/B. Recette navigateur Admin PC vers Client mobile réussie, fixtures nettoyées. Build réussi. Le refus SQL access_denied est désormais traduit en HTTP 403 ; le test HTTP correspondant vérifie ce statut.

Le checkpoint précédent 75cdc1f est confirmé READY et l’affichage des allocations de prêt a été vérifié dans le navigateur sur le domaine officiel. Après publication de ce lot, vérifier son état READY et exécuter NR_TEST_NOTIFICATION_ONLY=1 avec scripts/test-commercial-browser.mjs sur le domaine.

Suite : compléter restrictions/édition des promotions et moyens de paiement, avis publics approuvés, cohérence des vues Client/Admin, consolidation PWA/design et recette globale. Les tests humains e-mail restent reportés à RECETTE UTILISATEUR FINALE.md à la demande du propriétaire.
