# Captures finales NR-TRANS

Exactement quatre PNG PC et quatre PNG Mobile, capturés dans la démonstration locale avec les mêmes données fictives. Aucun compte réel ni secret. Rendu à densité 2 ; largeurs de navigateur 1440 px et 390 px, puis recadrage sur les régions utiles. Ce ne sont pas des captures du bureau ni du navigateur complet.

1. `1-dashboard.png` : indicateurs financiers ; sur PC, graphique et objectifs également.
2. `2-fleet.png` : fiche du véhicule, statut, versements et résultat.
3. `3-cash.png` : entrées, sorties et solde ; sur PC, premières lignes du registre.
4. `4-reports.png` : synthèse de période ; sur mobile, extrait lisible des trois premiers indicateurs.

Les montants décrivent le jeu de démonstration, pas des performances commerciales réelles. Les huit fichiers ont été ouverts et inspectés après cadrage. Le script `04 Codes/scripts/capture-final.mjs` permet de les reproduire avec une prévisualisation locale ; les données dépendent de la date du jeu de démonstration. Les service workers sont bloqués uniquement dans le contexte éphémère de capture pour éviter un bandeau de mise à jour pendant la prise de vue ; le contrôle PWA est effectué séparément.
