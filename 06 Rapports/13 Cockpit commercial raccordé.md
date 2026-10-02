# Cockpit commercial raccordé — 2 octobre 2026

Lot conservé après reprise : écrans Admin Commandes/Paiements, justificatifs privés, décisions validation/refus, Codes promo (création simple sans restrictions), Avis (approbation/refus/masquage) et Paramètres (capacité lecteurs et changement de formule à expiration). Autorisation serveur par rôle nr_admins puis contrôle RPC en base. Les tarifs officiels restent inchangés.

Validation : build de production réussi ; sept tests PostgreSQL distants réussis incluant création promotion 100 %, refus pour lecteur et modération réservée admin, avec rollback des fixtures. Intégration HTTP réelle complète réussie et contrôles 403 sur les trois nouvelles actions commerciales pour un client. Chargement navigateur des cinq panneaux avec session Admin réelle réussi, sans mutation commerciale de production.

Le premier administrateur est déjà provisionné et sa connexion production validée. Ne pas le recréer. Identifiants uniquement dans le fichier local sécurisé. Le domaine HTTPS et le DNS sont déjà fonctionnels. Le propriétaire confirme avoir corrigé Site URL et Redirect URL Supabase le 2 octobre ; vérifier les liens générés sur le domaine avant de tester confirmation/récupération via e-mail. Aucun e-mail reçu n’a encore été vérifié.

Déploiement : après commit et push, exécuter node scripts/deploy-vercel.mjs depuis 04 Codes ou le chemin complet depuis la racine, attendre READY puis vérifier le domaine officiel. Le script refuse un workspace modifié. Le déploiement Git natif est désactivé car le dossier 04 Codes contient un espace incompatible avec les noms de fonctions générés par cette intégration.

Reprise : tests Auth réels complets (inscription, réception/confirmation, récupération et reconnexion), expérience dédiée des invités, modification des véhicules autorisés des lecteurs existants, espace Client profil/commandes reprenables après rechargement, puis notifications/moyens de paiement et finition cockpit. Corriger l’idempotence côté formulaire de commande (conserver la même clé après réponse réseau perdue) et l’écran de paiement après activation gratuite par coupon. Le backend idempotent a déjà été validé.

Le contrôle de quota a indiqué 100 % de la fenêtre avancée ; priorité au checkpoint et à la publication stable de ce lot, sans ouvrir de nouveau gros chantier.
