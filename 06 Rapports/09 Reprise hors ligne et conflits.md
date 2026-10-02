# Hors ligne et conflits — checkpoint du 2 octobre 2026

Branche main, précédent checkpoint 5f5551d vérifié sur GitHub. Trois migrations distantes installées et conservées sans réécriture.

## Lot sauvegardé

IndexedDB version 2 conserve la file et les données existantes. Les snapshots distants sont récupérés sans écraser une file en attente. Un conflit conserve les deux versions ; choix explicite de la version locale ou serveur, archivage atomique et téléchargement de sauvegardes restaurables. Une confirmation tardive ne fait pas reculer la version serveur. Révision locale contrôlée lors de la résolution.

Reprise hors ligne du propriétaire sur un appareil déjà authentifié, identité de stockage distincte par compte et organisation, expiration locale en lecture seule. Au retour réseau, l'identité et l'organisation sont revérifiées avant tout envoi. Les autorisations serveur restent obligatoires. Le lecteur secondaire utilise une vue limitée par RLS.

PWA : cache de production, proposition de mise à jour différée tant qu'un formulaire ou une file est en attente. Exports conservés en lecture seule, import répété détecté par empreinte, données fictives refusées dans un compte réel.

## Résultats obtenus

58 tests locaux réussis ; compilation de production réussie. Recette navigateur sur la version compilée et compte Auth temporaire réel : coupure réseau, rechargement, saisie d'une journée, nouveau rechargement. Reçu 4 500 KMF, commission due 900 KMF, résultat 3 600 KMF ; saisie conservée.

Retour réseau effectué : statut navigateur « Synchronisé ». Vérification directe dans PostgreSQL distant : exactement une journée non supprimée pour ce compte de recette, montant reçu 4 500 KMF.

## Point de reprise exact

Compléter la comparaison identifiant/payload IndexedDB ↔ Supabase, le retry du même lot, le rechargement après synchronisation et le scénario serveur → appareil. Simuler une réponse perdue après commit puis vérifier la reprise sans doublon. Le compte de recette navigateur est encore présent à cette étape pour terminer ces vérifications ; le supprimer ensuite avec le script de nettoyage ciblé. Ne pas recréer le scénario déjà réussi.
