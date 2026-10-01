# NR-TRANS — Rapport de livraison

## État

Application locale construite, code et build statique fournis. **Validation des calculs réussie ; validation complète en navigateur non obtenue dans cet environnement.** Il ne faut pas assimiler cette livraison à une recette finale de tous les parcours.

## Fonctions implémentées

- Choix initial entre démonstration sur trois mois et base vide.
- Tableau de bord, comparaison mensuelle, attendu/réel, alertes entretien/prêt et sauvegarde.
- Versements : formulaire, modification, suppression confirmée, recherche, filtres, incidents, kilométrage et snapshot de commission.
- Dépenses, catégories personnalisées, entretiens et rappels.
- Chauffeur : commissions, salaires mensuels dus, paiements, avances et solde.
- Prêt : contrat, calcul d’échéance, échéancier, paiements partiels, capital restant.
- Trésorerie dérivée sans copie des mouvements automatiques ; apports et retraits des deux propriétaires.
- Simulation indépendante, trois scénarios, seuil tenant compte des tranches complètes.
- Rapports filtrables et feuille de style d’impression.
- Sauvegarde JSON complète, validation, résumé avant restauration, confirmation, transaction IndexedDB, protection contre écriture d’un onglet obsolète.
- Réinitialisations avec saisie renforcée, mode démonstration visible.
- Manifest, icônes, service worker, serveur local et lanceur Windows.
- Page de diagnostic avec onze vérifications IndexedDB isolées, à exécuter sur l’appareil cible.

## Vérifications exécutées

**17 tests automatisés Node.js réussis** :

1. Commission proportionnelle, tranches complètes, arrondis, mode fixe.
2. Distinction résultat / trésorerie, carburant, modification et suppression de sources.
3. Salaire dû distinct du salaire payé.
4. Conservation de la règle historique après modification des paramètres.
5. Capital du prêt, intérêts, frais et paiement partiel.
6. Échéances sans taux / avec taux et dates de fin de mois.
7. Apports / retraits sans impact sur le résultat.
8. Filtres de période et solde cumulé.
9. Simulation proportionnelle et fixe.
10. Démonstration → opérations supplémentaires → export JSON → base vide → restauration → égalité exacte des totaux et retour des opérations.
11. JSON malformé, version ancienne, données incomplètes et valeurs négatives refusés.
12. Références, doublons, dates et kilométrage invalides refusés.
13. Capital remboursé au-delà du montant emprunté refusé.
14. Démonstration et base vierge valides.
15. Seuil avec commissions par tranches complètes, y compris le premier palier atteint.
16. Salaire mensuel dupliqué refusé.
17. Dernière échéance ajustée pour solder les arrondis, aucune échéance supposée payée.

Vérification syntaxique des modules JavaScript, génération du dossier `dist/` et contrôle HTTP des ressources locales effectués. Stack JavaScript native : aucun compilateur TypeScript n’est utilisé.

## Vérifications non exécutées / limites de preuve

Le navigateur distant a refusé l’accès à l’adresse locale. Aucun navigateur local exécutable n’était disponible ; son téléchargement n’a pas abouti. Par conséquent, les éléments suivants sont **implémentés mais non vérifiés en situation réelle ici** :

- clics et validations des formulaires ;
- rendu bureau/mobile et impression ;
- transaction IndexedDB dans un vrai navigateur, persistance après fermeture complète et conflit entre onglets ;
- téléchargement réel du JSON puis sélection du fichier pour import ;
- installation PWA, cache et rechargement sans réseau ;
- lanceurs BAT / PowerShell sous Windows.

Le scénario critique sauvegarde/effacement/restauration est passé sur les fonctions métier avec un fichier JSON en mémoire. Il ne remplace pas le même scénario par les boutons de l’interface dans le navigateur cible. Le diagnostic fourni doit aussi être exécuté sur cet appareil.

## Choix à connaître avant usage réel

- Les versements représentent les sommes reçues par les propriétaires ; la commission est payée séparément.
- Les salaires fixes sont enregistrés explicitement chaque mois. Un mois omis peut surévaluer le résultat.
- Résultat d’exploitation avant amortissement et fiscalité non saisie ; pas de comptabilité générale complète.
- Prêt : contrat et mouvements réels distincts ; pas de rééchelonnement automatique après remboursement anticipé.
- Première interface : un véhicule, un chauffeur, deux propriétaires.
- Les opérations modifiées n’ont pas de journal d’audit des anciennes valeurs ; les sauvegardes conservent des états antérieurs.
- Pas de service cloud, publication ni transfert de données financières.

## Recette à terminer avant de saisir les comptes réels

1. Démarrer le lanceur Windows et ouvrir la démonstration.
2. Exécuter le diagnostic depuis Sauvegarde.
3. Ajouter, modifier, supprimer une journée fictive et une dépense.
4. Exporter un JSON, noter les indicateurs, réinitialiser, restaurer le fichier téléchargé et comparer.
5. Couper Internet, recharger et vérifier une nouvelle saisie ; fermer puis rouvrir le navigateur.
6. Vérifier l’impression et, si nécessaire, le téléphone.
7. Après validation, sauvegarder puis choisir Tout effacer pour passer à la base réelle.
