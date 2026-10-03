# Cockpit commercial et fiches clients — 3 octobre 2026

Dashboard : clients et nouveaux inscrits du mois, essais/Avancé/VIP actifs, organisations expirées, paiements à vérifier, total des commandes approuvées, promotions en cours, avis en attente et évolution des périodes payantes. Retour au dashboard recharge les données. Statistiques utilisent les mêmes définitions.

Fiches clients : nom/téléphone du profil, état du propriétaire, lecteurs actifs, noms/plaques des véhicules et commandes. Projection serveur explicite des véhicules limitée à id, organisation, nom et plaque ; aucune opération métier retournée. Commandes/paiements Admin : recherche et filtre de statut, libellés français, moyen de paiement visible. Respect de hidden pour masquer réellement les résultats filtrés.

Validation : indicateurs testés avec périodes expirées/actives/futures et paiements non approuvés exclus du total ; build et intégration HTTP réussis. Formulaires Admin PC/mobile validés ; dashboard, fiches disponibles et filtre de commandes contrôlés sur mobile. Le checkpoint e0bd387 est READY ; ses douze écrans métier ont été contrôlés en production PC/mobile.
