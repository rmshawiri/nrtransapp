# Point de reprise — 3 octobre 2026

Dernier checkpoint applicatif : c07991e1e828c051d1803d53c547f0af24fcab2c, poussé sur main, Vercel READY (dpl_6Q2m8XJFVb16XXRmS4QvxijdSkKj). Domaine officiel : https://nr-trans.morashawiri.com. Parcours invitation invalide → abandon explicite → espace Client → cockpit Admin vérifié en production. Aucun changement local perdu. Aucun secret ajouté à Git.

## TERMINÉ depuis 6671ee0
- Promotions complètes et moyens de paiement manuels ; responsive et déconnexion Admin.
- Rappels d'entretien par véhicule, capital restant alloué, libellés des rapports flotte.
- Historiques Client et listes Admin recherchables ; récupération paginée sans plafond silencieux ; fiches clients limitées aux données commerciales.
- Statistiques commerciales, filtres commandes, avis publics approuvés sans témoignage fictif.
- Cache PWA corrigé, polices réduites, rechargement hors ligne et retour réseau vérifiés.
- Parcours invitation invalide récupérable et entrée lecteur en lecture seule.

## INCOMPLET / À FAIRE à la prochaine reprise
- Compléter les interventions administratives tracées prévues au cahier des charges : gestion directe des abonnements/statut compte, au-delà des validations et renouvellements par commande déjà opérationnels. Ne pas modifier les tarifs ni supprimer les données.
- Compléter les alertes de cycle de vie (notamment bientôt expiré/expiré) ; notifications manuelles et décisions commerciales déjà raccordées.
- Consolider les documents d'exploitation/livraison et la revue finale des parcours Client/lecteur, de la Landing et de l'accessibilité. Éviter de refaire les audits et suites déjà validés sans modification les justifiant.
- Ensuite seulement : exactement 4 captures PC + 4 mobile, réelles, sans données sensibles, avec démonstration identifiée. Aucune capture définitive produite pendant cette session.
- Recette humaine réservée à RECETTE UTILISATEUR FINALE.md : aucun blocage de développement lié à la réception e-mail ou aux paiements manuels du propriétaire.

## Preuves et commandes utiles
76 tests locaux réussis (npm test). Intégration HTTP distante réussie après les changements d'API ; fixtures nettoyées. Douze écrans métier vérifiés PC/mobile en production. Formulaires Admin vérifiés en production. Test PWA de production réussi : cache sans API, reload offline, retour réseau et endpoint avis public.

Scripts dans 04 Codes/scripts : test-authenticated-api.mjs, test-admin-forms-browser.mjs, test-business-screens.mjs, test-pwa-browser.mjs. NR_TEST_ORIGIN permet de cibler local/production. test-authenticated-api utilise par défaut le port 5173 ; préciser l'origine. Pour déployer : dépôt propre, check-secrets, git-sync, deploy-vercel ; attendre READY puis vérifier le domaine.

Les migrations jusqu'à 20261002221452_manual_payment_methods.sql sont appliquées et immuables. Le pooler et tous les secrets restent uniquement dans le fichier local ignoré. Ne pas utiliser le connecteur Supabase lié à l'autre compte.

Arrêt de nouveaux lots demandé par la règle de quota : 93 % consommés lors du dernier contrôle. Les fonctionnalités restantes sont identifiées ; le produit n'est pas déclaré entièrement terminé.
