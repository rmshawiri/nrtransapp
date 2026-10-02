# Parcours Client commercial — 2 octobre 2026

Reprise de 679e8eb, workspace propre, sans réaudit des fondations. Réception et clic des e-mails de confirmation/récupération reportés à la recette du propriétaire à sa demande. Redirections officielles déjà vérifiées. Ne pas affirmer que la livraison réelle des e-mails est validée.

Modifications : commandes reprenables depuis l’historique Client via /paiement?order= ; détail protégé par organisation, instructions réelles du moyen de paiement, statut lisible, déclaration renouvelable et conservation du justificatif existant. Une commande validée/offerte n’affiche plus de formulaire de paiement. Clé d’idempotence conservée après perte de réponse et rechargement, isolée par organisation et contenu. Profil Client éditable, historique des abonnements, statut expiré explicite, dashboard Admin affichant les compteurs commerciaux réels.

Invitations : inscription dédiée au lecteur sans choix d’abonnement ; édition des véhicules autorisés depuis une modale, en utilisant le RPC existant. Capacité commerciale inchangée/configurable. Aucun envoi automatique d’e-mail d’invitation ajouté.

Tests : trois tests unitaires ciblés ; build réussi ; intégration HTTP réelle avec isolation du détail de commande A/B ; recette navigateur Client mobile 390 px et Admin PC 1440 px contre Supabase réel : création, rechargement, déclaration, approbation, replay sans double abonnement, refus, nouvelle déclaration, renouvellement préservant le reliquat et historique. Données temporaires nettoyées. Inscription invité vérifiée à 390 et 1440 px sans débordement ; édition du périmètre lecteur vérifiée par formulaire navigateur.

Script reproductible : scripts/test-commercial-browser.mjs, origine par défaut officielle, surcharge NR_TEST_ORIGIN pour recette locale. Il crée un compte Auth temporaire confirmé pour les tests commerciaux ; ce mécanisme ne constitue pas une preuve de réception des e-mails d’inscription. Nettoyage limité aux organisations créées par ce test.

Après publication : exécuter ce scénario sur le domaine officiel. Suite : notifications et paiements Client plus détaillés, restrictions complètes promotions/moyens de paiement, multi-conducteurs et paramètres métier, PWA/design. Toujours conserver les tarifs officiels, règles financières et RLS déjà validés.
