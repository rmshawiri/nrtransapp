# Alertes du cycle d'abonnement — 3 octobre 2026

Migration 20261003113304_subscription_lifecycle_notices appliquée et testée. À l'ouverture en ligne de l'espace Client, le propriétaire déclenche une actualisation des notifications internes : alerte à trois jours de l'échéance, puis alerte d'expiration. Une période suivante couvrant déjà l'échéance supprime le rappel imminent inutile. Les prix, durées et données métier ne sont pas modifiés.

Sécurité : contrôle propriétaire actif côté API et SQL, fonction SECURITY INVOKER à search_path vide, exécution réservée au service serveur. Index unique organisation/événement et verrou d'organisation assurent une seule notification par période et phase. Une répétition conserve l'état lu. Aucun e-mail/SMS/WhatsApp envoyé ; ces alertes sont actualisées lors de la visite, sans prétendre à un envoi planifié en arrière-plan.

Validation : cinq tests locaux et cinq distants réussis (permissions, renouvellement, idempotence, lecture, expiration sans suppression). Tests distants annulés par transaction. Build réussi. Parcours Chrome mobile avec compte temporaire réel : imminent → lecture → rechargement sans doublon → expiration ; compte de recette nettoyé. Le sélecteur du test a été précisé pour distinguer l'alerte du message de bienvenue existant.

Base de reprise confirmée : dépôt propre à 33701f1, GitHub identique, production c07991e READY et HTTP 200. Inventaire court actualisé dans le rapport 27. Suite : interventions Admin directes tracées, puis finitions SEO/accessibilité/documentation/captures. Recette humaine toujours différée.
