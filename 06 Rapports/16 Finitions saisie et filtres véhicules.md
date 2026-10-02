# Finitions métier — 3 octobre 2026

Production 14db2f7 confirmée READY sur le domaine officiel. Reprise sans réaudit des fondations. La migration commercial_notifications_methods en préparation était un fichier entièrement vide ; ce gabarit est conservé dans .private/deferred-commercial-notifications-methods.sql et n’a jamais été appliqué. Créer une migration versionnée complète lorsque ce lot sera développé.

Terminé et déjà validé : calculs historiques, allocations prêts, RLS/isolation, socle Offline/synchronisation/conflits, parcours commercial Client/Admin, invitations serveur, profil et historique, multi-conducteurs. Incomplet : finitions des filtres/saisies, notifications, restrictions avancées des promotions et moyens de paiement, PWA/design. À faire en fin de développement : recette humaine Auth/e-mails et huit captures finales.

Ce lot : kilométrage recalculé lors du changement de véhicule dans une nouvelle journée ; ajout d’un véhicule bloqué immédiatement selon Gratuit/Avancé/VIP et lecture seule ; prêts et sélecteur de remboursement filtrés par allocations du véhicule ; affectations affichées et montants du contrat complet clairement identifiés. Aucun calcul historique modifié, aucune donnée supprimée.

Validation : six tests ciblés réussis (flotte, allocations, droits d’ajout), build réussi, tests navigateur 390/1440 px : nouveau véhicule sans prêt, kilométrage initial correct, aucun prêt hors périmètre, retour au contrat en vue globale, sans débordement horizontal.

RECETTE UTILISATEUR FINALE.md créé. Les vérifications humaines non bloquantes sont reportées à cette liste sans interrompre le développement.
