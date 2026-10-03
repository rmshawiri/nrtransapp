# Avis publics et cache PWA — 3 octobre 2026

Endpoint public GET limité à douze avis approuvés et quatre champs publics (auteur, note, commentaire, date). Aucun identifiant de compte/organisation retourné, aucun droit anonyme ajouté aux tables. La Landing masque la section vide et échappe le contenu des avis. Aucun témoignage de démonstration publié.

Polices limitées aux jeux latins ; manifest ajouté au précache. Correction du chargement hors ligne des ressources statiques versionnées lorsque la réponse comporte Vary : recherche par chemin dans le cache courant avec ignoreVary. Réservé à la liste explicite des ressources statiques ; API et origines externes toujours exclues.

Validation : test unitaire endpoint public (projection, filtre, limite, refus POST), build, HTTP réel, Chrome mobile avec installation du service worker, cache inspecté sans API, rechargement hors ligne puis retour réseau réussis. Il ne s'agit pas d'une validation humaine de l'installation système. Script de non-régression enregistré : scripts/test-pwa-browser.mjs.

Checkpoint précédent 9eec2ca confirmé READY et listes Admin vérifiées sur le domaine officiel. La recette humaine reste différée.
