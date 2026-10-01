# Schéma NR-TRANS — version 1

## Architecture

Application statique ES modules, sans backend métier. `core.js` est indépendant du DOM et du stockage. `storage.js` encapsule IndexedDB. Une future synchronisation devra passer par cet adaptateur et ajouter une résolution des conflits ; elle n’existe pas dans cette version.

Base IndexedDB `nr-trans-local`, version de base 1, object store `state`, clé `main`. Le document complet est écrit dans une seule transaction `readwrite`, après validation. La révision est vérifiée dans la transaction. Une erreur/abandon ne remplace pas l’ancien document. Les modifications d’un autre onglet imposent un rechargement.

Le stockage par document unique simplifie la restauration atomique pour une petite activité. Il est moins adapté à une flotte importante ; il faudra alors répartir les collections en object stores, tout en gardant une transaction multi-stores pour la restauration.

## Document

| Collection / champ | Contenu et relations |
|---|---|
| `schemaVersion`, `revision`, `demo` | Version métier, contrôle d’écriture, signalement du jeu fictif |
| `settings` | Devise, objectif, jours indicatifs, payeur carburant, catégories, date de téléchargement |
| `vehicles[]` | Identité véhicule, achat, kilométrage initial, statut, notes |
| `drivers[]` | Identité, début, statut, mode, salaire, commission, tranche, règle |
| `owners[]` | Identifiants et noms des deux propriétaires |
| `days[]` | Date, `vehicleId`, `driverId`, attendu, reçu, km départ/fin, statut, carburant, payeur, commentaire, incident, snapshot `terms` |
| `expenses[]` | Date, véhicule, catégorie, description, montant, moyen, commentaire |
| `maintenance[]` | Date, véhicule, type, km, coût payé, garage, prochain km/date, commentaire |
| `loans[]` | Véhicule, prêteur, capital, taux, nombre et fréquence des échéances, échéance habituelle, première date, apport/prix/frais prévus |
| `loanPayments[]` | `loanId`, date, numéro d’échéance, capital, intérêts, frais, commentaire |
| `wages[]` | `driverId`, date d’affectation au mois, montant dû, snapshot `terms`, commentaire |
| `driverPayments[]` | `driverId`, date de paiement, montant, commentaire |
| `movements[]` | Date, type, `ownerId` pour apports/retraits, montant, commentaire |

Tous les enregistrements ont un identifiant stable. Cette interface exige un véhicule, un chauffeur, deux propriétaires. Les références des opérations sont validées. Les collections prêt sont extensibles, même si le parcours de création initial reste centré sur un prêt.

## Données dérivées

L’échéancier provient du contrat. Le registre de trésorerie provient des opérations : chaque ligne dérivée contient `source` et `sourceId`. Ils ne sont pas exportés comme copies indépendantes, ce qui empêche leur divergence. La sauvegarde contient toutes les sources nécessaires pour reconstruire exactement échéances, trésorerie, graphiques et totaux.

La rémunération d’une journée est calculée avec ses `terms` conservés. La rémunération fixe est une ligne mensuelle explicite. Les simulations ne sont pas conservées ; ce sont des calculs sans effet comptable. Les filtres de navigation sont transitoires.

Les dates métier sont au format civil `YYYY-MM-DD`. Les timestamps des métadonnées sont ISO 8601 UTC. Les montants non négatifs ont au maximum deux décimales ; les sorties sont signées uniquement dans les calculs dérivés. Les indicateurs de résultat et de trésorerie ne sont pas stockés.

## Sauvegarde

```json
{
  "format": "NR-TRANS",
  "formatVersion": 1,
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "createdAt": "2026-09-18T00:00:00.000Z",
  "data": {"schemaVersion": 1, "revision": 1, "demo": true}
}
```

Extrait de structure seulement : le champ `data` d’un vrai export contient l’ensemble des collections et paramètres. La révision importée n’est pas utilisée pour écraser une révision courante : `save` compare la révision de la session et crée une nouvelle révision locale.

## Validation et migrations

`parseBackup` décode le JSON, contrôle format, versions et date, puis `validate` contrôle les paramètres, collections, identifiants, nombres, dates, snapshots, références, doublons de journées/salaires, kilométrage et capital remboursé. Le résumé et la confirmation précèdent la transaction.

Aucune version antérieure officielle n’existe. La version 0 et toutes les versions inconnues sont refusées sans mutation. Une future version doit ajouter une fonction pure `migrateV1ToV2(copy)`, préserver le fichier original, enchaîner les migrations connues, valider la version cible, demander confirmation puis écrire en une transaction. Ne jamais changer silencieusement la version ni inventer des montants manquants. La version du store IndexedDB et celle du schéma métier sont distinctes.

## Limites

Pas de chiffrement, authentification, synchronisation cloud, pièces jointes ni historique d’audit des anciennes valeurs après modification. L’historique disponible est celui des opérations actuelles. Sauvegarder avant une correction importante. Le diagnostic local utilise un nom de base aléatoire commençant par `nr-trans-diagnostic-`, puis supprime uniquement cette base de test.
