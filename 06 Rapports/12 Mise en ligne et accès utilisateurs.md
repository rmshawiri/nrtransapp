# Mise en ligne et accès utilisateurs — 2 octobre 2026

NR-TRANS est accessible en HTTPS sur https://nr-trans.morashawiri.com. Projet Vercel nr-trans créé et relié au dépôt GitHub. Variables Supabase installées chiffrées, sans valeur dans Git. CNAME prioritaire réellement fourni par Vercel : aa7d6ea2679015fc.vercel-dns-017.com. Intervention Hostinger confirmée par le propriétaire ; propagation DNS et configuration Vercel vérifiées.

Premier déploiement stable f0a21cf. Build de production réussi. Routes publiques vérifiées en HTTP et navigateur. Sans session, /app, /client et /admin redirigent vers /connexion ; API admin renvoie 401. Connexion du premier administrateur et accès à son dashboard vérifiés réellement en production. Identifiants conservés uniquement dans le fichier sécurisé local.

L’intégration Git native Vercel ne gère pas les noms de fonctions sous le dossier avec espace 04 Codes. Le script scripts/deploy-vercel.mjs envoie uniquement les fichiers applicatifs suivis, sans ce préfixe, à partir d’un workspace propre et du commit HEAD. Les déploiements Git automatiques sont désactivés par configuration pour éviter les builds invalides ; chaque lot suit push puis ce script, puis contrôle READY et tests en ligne.

Interface Utilisateurs raccordée : invitations, véhicules autorisés, liens à transmettre, statuts, annulation, révocation/réactivation. Acceptation avant onboarding avec adresse confirmée contrôlée en base. Le lien est conservé dans le retour de confirmation Auth. Aucune limite secondaire inventée : un paramétrage commercial explicite reste nécessaire.

Migration complémentaire 20261002084630_subscription_clock appliquée : la sélection de l’abonnement actif utilise désormais l’horloge PostgreSQL. Le test HTTP avait révélé un écart d’horloge inférieur à une seconde masquant un essai créé à l’instant.

Tests réussis : build, deux tests serveur, six tests locaux invitations, intégration HTTP réelle complète (sessions, isolation, tarifs, justificatifs privés, refus propriétaire/lecteur sur admin, refus synchronisation lecteur, révocation session), formulaire navigateur invitation (véhicule, lien, annulation), connexion Admin navigateur en production.

Reste : expérience inscription spécifique aux invités, modification des périmètres des lecteurs existants, paramétrage Auth des confirmations sur domaine officiel, interface commerciale complète et tests du parcours final. Aucun envoi automatique d’invitation par e-mail. Les captures de recette ne sont pas les huit captures finales demandées.
