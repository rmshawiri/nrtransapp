# Suivi multi-conducteurs — 2 octobre 2026

Le checkpoint a552589 a été déployé READY puis sa recette commerciale complète a réussi sur https://nr-trans.morashawiri.com : Client mobile, Admin PC, création/reprise, déclaration, approbation répétée sans doublon, refus/resoumission et renouvellement. Fixtures nettoyées. Le propriétaire reporte la vérification de réception/clic des e-mails à sa recette finale ; continuer les autres travaux sans relancer cette demande.

Correction métier : la fiche d’un conducteur utilisait les agrégats de tous les conducteurs. Les rémunérations, versements, jours travaillés et paiements sont maintenant isolés par conducteur et par véhicule sélectionné. Les alertes de salaire fixe manquant distinguent les conducteurs. Les règles historiques de calcul et snapshots ne sont pas modifiés. Le calcul indicatif de commission dans le formulaire utilise le conducteur effectivement sélectionné.

Paramètres : les champs propriétaires suivent la collection existante, sans hypothèse de deux propriétaires exactement.

Validation : 23 tests ciblés conducteurs/flotte/règles historiques réussis ; build réussi ; navigateur 390 et 1440 px : ajout d’un second conducteur, sélection, quatre indicateurs à zéro sans contamination des données du premier, absence de débordement horizontal, ouverture des paramètres propriétaires. Une attente de test a été corrigée de detached à hidden pour une modale fermée restant dans le DOM.

Suite : notifications Client/Admin, gestion complète des restrictions promotions et moyens de paiement, finition du parcours invitations, PWA/performance/design et recette globale. Les captures finales ne sont pas encore réalisées.
