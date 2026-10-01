# Lot 2 — Socle métier et commercial

1 octobre 2026. Checkpoint précédent vérifié localement et sur GitHub : `9a86084c3b68181c545fed915e032eec9a0fc55b`.

## Développé

Dans `04 Codes/src/domain` : conservation intégrale du moteur historique `legacy-v1.js`, moteur v2 multi-véhicules, validation du kilométrage par véhicule, relations prêt/véhicules avec allocations explicites, répartition déterministe des centimes, synthèses par véhicule sans duplication des prêts, import v1 validé avec comparaison exacte des totaux, sauvegarde v2, empreinte SHA-256 pour détection de réimport.

Socle commercial : huit tarifs officiels, promotions fixes/pourcentage/100 %, dates et restrictions, essai sept jours, renouvellement préservant les jours restants, expiration en lecture seule, contrôle des transitions des commandes. Les changements de forfait restent bloqués par défaut jusqu’à définition de leur politique ; seul un mode différé explicitement configuré est prévu à ce stade.

## Preuves

- 29 tests Node réussis : 17 historiques, 5 flotte/import, 7 commerciaux.
- Navigateur historique : 11/11 diagnostics IndexedDB réussis (persistance, export/import, restauration identique, conflits d’onglets, refus des valeurs invalides).
- Aucun fichier de référence modifié.
- Les tests commerciaux concernent des fonctions pures ; ils ne prouvent pas encore l’atomicité serveur ni les contrôles RLS.

## Infrastructure

La connexion PostgreSQL directe fournie renvoie uniquement une adresse IPv6. Résolution DNS Windows réussie ; connexion à l’adresse retournée : ENETUNREACH. Le fichier a été relu après réponse du propriétaire et ne contient pas de chaîne Session pooler. Il faut obtenir cette dernière via Supabase Connect ou reconnecter le plugin au compte NR-TRANS. Aucune table/fonction/policy distante n’a été modifiée.

## Suite

Construire les espaces et la persistance locale, puis le serveur et le schéma RLS. Les actions commerciales et synchronisations seront obligatoirement revalidées côté serveur. Ce lot constitue un socle testé, pas une plateforme terminée.

Commit du lot : message `feat: preserve finance and add fleet migration and commercial rules` ; SHA vérifiable dans Git.
