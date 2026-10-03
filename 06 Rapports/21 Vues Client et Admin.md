# Vues Client et Admin — 3 octobre 2026

Ajout de listes lisibles et recherchables pour Clients, Abonnements, Lecteurs et Journal, ainsi que de statistiques commerciales explicitant la limite de chargement de l'API existante (1 000 par catégorie). Pagination visuelle de 20 lignes. Les paiements Client affichent la commande, le statut, le montant et le lien vers le détail/justificatif privé. Aucun accès métier supplémentaire accordé à l'Admin.

Build réussi. Navigation Admin authentifiée sur données distantes vérifiée en 390/1440 px sans débordement. Pagination 25 éléments, recherche et échappement HTML vérifiés dans le navigateur avec données de test. Le checkpoint flotte précédent c1ad1a3 est READY et vérifié sur le domaine officiel.

Reste à améliorer pour les grands volumes : pagination serveur et statistiques globales indépendantes du plafond de chargement. Les libellés présents évitent de présenter les valeurs partielles comme exhaustives.
