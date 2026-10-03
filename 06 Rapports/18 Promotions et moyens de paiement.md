# Promotions et moyens de paiement — 3 octobre 2026

Lot terminé : création et édition des promotions avec dates UTC, plafonds globaux/par client, minimum, formules et durées, désactivation conservant les restrictions. Moyens de paiement manuels configurables par Administrateur commercial ; les intégrations carte/Wakati ne peuvent pas être activées artificiellement. Le formulaire de commande utilise les disponibilités distantes.

Migration versionnée 20261002221452_manual_payment_methods appliquée. Neuf tests SQL locaux et neuf distants réussis ; transactions de test annulées. Intégration HTTP réussie : promotion limitée, devis, refus hors formule, désactivation, contrôles d'accès et refus d'activation d'une intégration indisponible. Build réussi. Navigateur authentifié : formulaires promotions et paiements vérifiés en 390 et 1440 px, sans débordement de page, déconnexion disponible sur mobile. Aucun secret ni compte réel affiché dans les preuves.

Reprise : checkpoint initial 6671ee0 confirmé identique sur main local/GitHub, déploiement READY et domaine officiel HTTP 200. Le présent lot doit être publié puis vérifié sur ce domaine. Les tests humains restent différés dans RECETTE UTILISATEUR FINALE.
