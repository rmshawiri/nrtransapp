# NR-TRANS — Gestion familiale de transport

Application locale en français, sans compte, serveur distant, télémétrie ni dépendance réseau. Version 1.0.0.

## Démarrage sous Windows

1. Extraire **tout le dossier** de l’archive ZIP dans un emplacement stable, par exemple `Bureau/Gestion de TRANSPORT/NR-TRANS`.
2. Double-cliquer sur `LANCER_NR_TRANS.bat`.
3. Le navigateur s’ouvre sur `http://127.0.0.1:8765`. Garder la fenêtre serveur ouverte.
4. Choisir **Explorer la démonstration** ou **Commencer avec une base vide**.
5. Renseigner les paramètres avant de saisir les opérations réelles.

Le lanceur utilise Node.js s’il est déjà installé ; sinon Windows PowerShell et les composants .NET de Windows. Aucune installation npm n’est nécessaire pour utiliser l’application. Le script PowerShell n’écoute que l’interface locale de l’ordinateur. La dérogation de politique PowerShell du lanceur est limitée au processus lancé ; aucune politique système n’est modifiée.

Le lanceur Windows est fourni mais n’a pas pu être exécuté dans l’environnement Linux de construction. Si le lancement échoue, le message d’erreur reste visible. Ne pas désactiver les protections système pour le faire fonctionner. Alternative si Node.js est disponible : ouvrir un terminal dans le dossier et exécuter `node server.mjs`.

**Ne pas ouvrir directement `app/index.html` par double-clic** : les modules JavaScript, IndexedDB et la PWA nécessitent une origine HTTP locale stable.

## Linux / macOS ou lancement avec Node.js

Avec Node.js 20 ou supérieur :

```sh
node server.mjs
```

Ouvrir ensuite `http://127.0.0.1:8765`. Le serveur est limité à cet ordinateur. Aucun accès Internet n’est nécessaire.

## Hors ligne et installation

Tous les fichiers nécessaires sont dans `app/`. Le lanceur sert ces fichiers localement et fonctionne sans Internet, même au premier lancement. Le service worker met aussi les ressources en cache après le premier chargement réussi.

Selon le navigateur, utiliser son bouton **Installer l’application**. La disponibilité du bouton dépend du navigateur ; le lanceur reste utilisable dans tous les cas. Le cache doit être chargé une première fois avant de pouvoir relancer la PWA sans serveur. Après un changement du code, le développeur doit changer la version du cache dans `sw.js`.

Utiliser toujours **le même navigateur, le même profil et `http://127.0.0.1:8765`**. `localhost`, un autre port ou un autre profil constituent une base distincte. Les données ne sont pas enregistrées dans le dossier de l’application : elles sont dans IndexedDB du navigateur. La navigation privée n’est pas adaptée à une conservation durable.

## Premiers réglages

- Véhicule : nom, immatriculation, marque, modèle, achat, kilométrage initial, statut.
- Chauffeur : identité, début, statut, salaire fixe ou commission.
- Exploitation : objectif, jours indicatifs, devise, payeur du carburant.
- Propriétaires : deux noms et suivi des apports / retraits.
- Catégories : personnalisables, sauf les paiements du prêt et du chauffeur qui ont des modules dédiés.

L’interface gère un véhicule et un chauffeur. Les relations utilisent des identifiants pour permettre une évolution future vers une flotte. Ne pas remplacer l’identité d’un chauffeur par celle d’une autre personne si l’historique doit rester attribué au premier.

## Règles financières retenues

### Versements et commissions

« Recette » désigne **le versement reçu par les propriétaires**, pas l’ensemble des billets payés par les passagers au chauffeur. Le montant reçu est saisi intégralement. La commission est une somme **due en supplément**, à payer séparément dans Chauffeur.

Commission proportionnelle : `versement / tranche × commission`. Par tranches complètes : `floor(versement / tranche) × commission`, journée par journée, sans report des fractions au lendemain. Les valeurs 5 000 / 1 000 sont modifiables ; les libellés illustrent simplement l’exemple initial.

Les journées conservent leur objectif, leur règle de commission et leur payeur de carburant. Un changement de paramètres ne modifie pas les anciennes journées. Modifier le montant d’une ancienne journée recalcule sa commission avec **sa règle historique**.

Une seule journée par date et véhicule. Les dates manquantes ne sont ni du repos ni des absences. Une journée non travaillée doit avoir un versement attendu et reçu égal à zéro. Les kilomètres doivent rester chronologiques.

### Salaire fixe

Enregistrer **une ligne “Salaire mensuel dû” par mois** dans Chauffeur. Le salaire n’est pas automatiquement comptabilisé au passage d’un mois. Ce choix évite de supposer des droits sur des mois d’absence ou des mois partiels. La ligne conserve le montant et la règle de salaire au moment de la saisie. Un prorata peut être saisi et expliqué en commentaire. La date de cette ligne détermine la période du rapport où la charge apparaît.

Une alerte signale les mois contenant des journées en mode fixe sans salaire enregistré. Pour un mois sans aucune journée, le propriétaire doit décider et saisir l’éventuel salaire dû.

Les paiements sont indépendants de la rémunération due. Un reste à payer négatif indique une avance. Une commission n’est jamais automatiquement marquée payée.

### Résultat et trésorerie

- Résultat d’exploitation = versements − dépenses payées − entretiens payés − carburant payé par les propriétaires − commissions acquises − salaires dus enregistrés − intérêts/frais du prêt payés.
- Ce résultat est **avant amortissement du véhicule et fiscalité non saisie** ; il ne constitue pas un bilan comptable complet.
- Trésorerie = entrées réelles − sorties réelles depuis le début jusqu’à la fin de période.
- Les apports et retraits ne modifient pas le résultat.
- L’achat du véhicule et le remboursement du capital modifient la trésorerie, pas le résultat.
- Le carburant payé par le chauffeur reste informatif. Le carburant payé par les propriétaires est déjà déduit via la journée : ne pas le saisir à nouveau comme dépense.
- Chaque entretien est considéré payé à sa date. Ne pas recréer la même dépense dans Dépenses.
- Les montants sont arrondis à deux décimales. La devise est une unité d’affichage, sans conversion de change.

Les mouvements issus des modules sont **calculés depuis leur source** ; aucun registre dupliqué n’est conservé. Modifier ou supprimer une opération actualise immédiatement son effet. Pour “Autre entrée / sortie”, réserver ces types aux mouvements de trésorerie non classés ; les revenus d’activité se saisissent dans Versements et les charges d’activité dans Dépenses.

### Prêt

Échéancier à annuités constantes, taux nominal annuel divisé par 12 ou 52. Durée exprimée en nombre d’échéances. L’échéance peut être calculée ou saisie manuellement. La dernière échéance rembourse le solde restant, éventuellement avec un montant de rattrapage si les échéances manuelles sont faibles. Frais contractuels exclus du calcul automatique.

Le prêt n’enregistre automatiquement **ni l’achat, ni le déblocage, ni l’apport, ni les frais, ni les remboursements**. Saisir leurs mouvements réels. Les frais contractuels sont informatifs jusqu’à leur paiement.

Chaque paiement précise date, numéro d’échéance, capital, intérêts, frais. Vérifier ces montants avec le reçu du prêteur. Les échéances passées restent impayées tant qu’aucun paiement n’est enregistré. Les paiements partiels sont permis. Le capital remboursé ne peut pas dépasser le capital initial.

Le solde du prêt est réel ; l’échéancier est contractuel. Les remboursements anticipés ne recalculent pas un nouvel échéancier bancaire. Les frais payés ne soldent pas le capital ou les intérêts de l’échéance.

### Simulation

Trois scénarios : versement journalier −20 %, identique, +20 %. Les autres hypothèses restent inchangées. Le net disponible déduit la mensualité complète et n’est pas assimilé au résultat comptable. Le seuil couvre charges, chauffeur et prêt. Les simulations ne sont pas persistées et ne modifient jamais les données réelles.

## Sauvegarder, restaurer, réinitialiser

- **Sauvegarde → Télécharger une sauvegarde** : JSON complet, paramètres et règles historiques inclus. Vérifier le fichier dans Téléchargements, puis le copier dans un dossier sûr / clé USB.
- La date affichée atteste le **déclenchement du téléchargement**, pas la conservation effective du fichier.
- **Restaurer une sauvegarde** : choisir un JSON NR-TRANS, lire son résumé, confirmer. La restauration remplace intégralement les données ; elle ne fusionne pas deux bases.
- Formats invalides, versions inconnues, valeurs incohérentes ou références absentes : refus avant écriture.
- Écriture transactionnelle IndexedDB : en cas d’échec, ancienne base conservée. Une révision empêche d’écraser les modifications d’un autre onglet obsolète.
- **Tout effacer** et **Réinitialiser avec la démonstration** exigent de saisir `REINITIALISER`.
- La base vierge garde des fiches neutres et des valeurs de réglage initiales, mais aucune opération réelle ou fictive.
- Ne pas stocker le JSON publiquement : il contient vos données financières en clair.

## Rapports

Périodes jour, semaine, mois, année, historique ou dates personnalisées. Rapport imprimable via le navigateur, exportable en PDF avec “Enregistrer au format PDF”. Les tableaux détaillent les chiffres mensuels et le solde cumulé.

## Vérification dans votre navigateur

Dans **Sauvegarde**, ouvrir **Vérifier le stockage et la restauration sur cet appareil**. Onze vérifications utilisent une base temporaire séparée : persistance, export/relecture, refus des imports invalides, réinitialisation, restauration avec égalité exacte des totaux, conflit d’écriture. Elles ne touchent jamais votre base principale.

Pour la vérification hors ligne réelle : charger NR-TRANS, couper Internet, recharger, ajouter une opération fictive, fermer/réouvrir puis vérifier sa présence. Tester également la restauration d’un fichier effectivement téléchargé via l’interface. Garder une sauvegarde avant toute manipulation de données réelles.

## Développement, build et tests

Aucune dépendance npm pour les fonctions essentielles. JavaScript ES modules, CSS, HTML et APIs du navigateur ; pas de TypeScript ni de transpilation.

```sh
npm test
npm run build
npm start
```

`npm run build` copie les ressources autonomes dans `dist/`. `npm test` exécute 17 tests métier Node.js. Ils sont passés dans l’environnement de construction. Les tests visuels, les formulaires réels, le service worker dans un navigateur et le lanceur Windows n’ont pas pu être exécutés ici : voir `RAPPORT_LIVRAISON.md`.

## Structure

- `app/core.js` : calculs, validation complète, démonstration, format de sauvegarde.
- `app/storage.js` : transactions IndexedDB et contrôle de révision.
- `app/app.js` : écrans et formulaires.
- `app/style.css` : styles bureau, mobile, impression.
- `app/sw.js`, manifest et icônes : cache local et PWA.
- `app/diagnostic.*` : contrôles de stockage isolés, à lancer dans le navigateur.
- `server.mjs` : serveur HTTP local Node.js.
- `LANCER_NR_TRANS.*` : démarrage Windows et alternative PowerShell.
- `tests/finance.test.mjs` : tests automatisés des calculs et de la sauvegarde.
- `SCHEMA.md` : modèle de données et évolution.
- `dist/` : ressources prêtes à servir localement.
