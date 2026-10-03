# Historiques complets et sauvegardes — 3 octobre 2026

L'API récupère les collections Admin et historiques Client par pages de 500, avec un ordre stable et sans troncature silencieuse à 1 000 lignes. Une erreur de page fait échouer la demande plutôt que livrer des totaux partiels. L'affichage conserve une pagination de 20 éléments. Les accès et filtres d'organisation restent inchangés.

Textes de sauvegarde corrigés : distinction démonstration locale/compte synchronisé, effet distant de la restauration explicite, consignes PWA réelles, suppression du lien diagnostic inexistant.

Validation : quatre tests ciblés serveur/pagination, intégration HTTP distante complète réussie après modification, build réussi, formulaires Admin 390/1440 et douze écrans métier 390/1440 sans erreur JavaScript ni débordement. Fixtures HTTP nettoyées. Script de contrôle métier enregistré.

Checkpoint précédent 94a8e3c READY ; test PWA et API publique réussi sur le domaine officiel, y compris rechargement hors ligne puis retour réseau.
