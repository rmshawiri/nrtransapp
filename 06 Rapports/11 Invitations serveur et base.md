# Invitations : serveur et base

Checkpoint du 2 octobre 2026. Reprise conservant le checkpoint 6809a3e, vérifié directement sur GitHub. Une migration non suivie restait dans le workspace ; aucun fichier réinitialisé.

Migration 20261002033524_member_and_admin_workflows appliquée au projet NR-TRANS avec le mécanisme versionné existant. Ajout des invitations, annulation, acceptation par adresse confirmée, révocation et restrictions véhicule. Capacité secondaire configurable : aucune limite commerciale inventée. Fonctions commerciales de configuration, promotion et modération préparées ; interfaces encore à raccorder.

Validation : huit tests locaux ciblés réussis, puis six tests PostgreSQL distants réussis. Isolation des invitations par RLS, rejet du mauvais destinataire et des jetons invalides/expirés/annulés, acceptation idempotente, doublons de véhicules neutralisés, refus de promotion propriétaire/admin, révocation sans création d’un nouvel essai. Fixtures et configuration de test annulées par rollback. Aucun audit initial rejoué.

Adaptateur serveur : endpoints invitation, acceptation avant onboarding, annulation et modification des accès. Identité exclusivement issue de la session vérifiée. Un membre inactif ne reçoit plus un libellé de rôle admin par défaut.

Point de reprise : raccorder les interfaces Client et le parcours inscription/acceptation ; vérifier le parcours HTTP complet ; provisionner le premier administrateur depuis le fichier sécurisé puis raccorder les fonctions commerciales. Le compte administrateur n’est pas encore provisionné. Déploiement Vercel et DNS restent à réaliser. Aucun secret copié dans ce rapport.
