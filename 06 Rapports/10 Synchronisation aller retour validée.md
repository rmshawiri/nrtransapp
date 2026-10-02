# Offline → Online → Supabase : recette terminée

2 octobre 2026. Reprise du checkpoint 9902cea, avec le même compte de recette et la même journée. Aucune nouvelle opération financière créée pour recommencer les tests.

## Vérifications obtenues

- Retour réseau détecté, envoi au vrai Supabase et statut « Synchronisé ». Vérification SQL : une seule journée, reçu 4 500 KMF.
- Comparaison du snapshot RLS distant avec IndexedDB : même identifiant et même payload de journée ; reçu 4 500, commission due 900, résultat 3 600 KMF ; file vide.
- Modification autorisée du nom du véhicule depuis le serveur, récupération côté appareil et maintien des relations et totaux. Répétition du même lot : réponse `replayed`, même version et aucune deuxième opération financière.
- Réponse réseau volontairement perdue **après** le commit réel d'une modification de note du véhicule : le serveur possède la version suivante, le navigateur conserve exactement une mutation avec son UUID initial.
- Coupure, rechargement hors ligne, reconnexion : replay du même UUID, file vidée, une seule journée distante, totaux inchangés, cohérence de version et de payload entre IndexedDB et Supabase. Un retry explicite supplémentaire ne change pas la version. Rechargement final validé.
- Requête d'un autre propriétaire ciblant l'organisation de recette : refus 403. Lecteur secondaire avec faux `canWrite`, rôle propriétaire et métadonnées administrateur : écriture et administration refusées ; rôle réel toujours viewer. Version du propriétaire inchangée.

Une session de navigateur temporaire avait expiré pendant l'interruption du travail. La recette a repris sur le même compte avec un profil persistant. Une attente de rechargement a expiré ; la reprise ciblée a retrouvé la mutation encore en attente et a terminé avec succès le scénario de réponse perdue, sans relancer les scénarios déjà réussis.

## Stratégie de conflit

Version optimiste par organisation. Les saisies en attente ne sont jamais remplacées par un pull. En cas de divergence, choix explicite entre versions locale et serveur avec archivage des deux copies. La résolution conserve une condition de version, donc une troisième modification concurrente déclenche un nouveau conflit. Une confirmation retardée ne peut pas faire reculer la version acquittée.

## Tests et outils

9 tests ciblés serveur/IndexedDB réussis après le contrôle explicite d'organisation. Recette HTTP réelle réussie avec les contrôles propriétaire/lecteur secondaire. Scripts Playwright versionné 1.63.0 : `test-browser-roundtrip.mjs` et reprise ciblée `test-browser-recovery.mjs`. Résultat détaillé privé : `.private/roundtrip-result.json`. La compilation et les 58 tests locaux du lot précédent restent valides ; aucun changement de moteur financier depuis.

TLS, RLS et contrôles serveur sont restés actifs. Les comptes temporaires HTTP ont été nettoyés automatiquement ; le compte navigateur est nettoyé à la clôture de ce checkpoint.

Suite : finaliser les parcours Client/Admin, membres secondaires, paramètres commerciaux, multi-conducteurs et recette globale avant déploiement Vercel et valeurs DNS réelles.
