# Parcours invitation et non-régression — 3 octobre 2026

Une invitation refusée/expirée affiche désormais des actions explicites : réessayer, changer de compte en conservant l'invitation, ou continuer sans elle. Aucun onboarding n'est tenté avant ce choix. Les lecteurs arrivant sur /client voient directement les données autorisées en lecture seule.

Validation : parcours invitation invalide puis retour au compte contrôlé dans Chrome mobile. Build réussi. Suite locale complète : 76 tests réussis, zéro échec ; couvre calculs historiques, flotte, conducteurs, PostgreSQL/RLS, commerce, stockage/synchronisation et ajouts récents. Les tests distants déjà validés n'ont pas été recommencés sans motif.

Checkpoint précédent 9e7dccb confirmé READY. Restent la vérification de ce dernier parcours en production, la consolidation des documents et les huit captures définitives une fois les interfaces stabilisées. Les tests humains restent réservés à la recette finale.
