# 12 - Feuille de route en étapes (livraison complète et fonctionnelle)

Règles communes à toutes les étapes :
- Une branche par étape, revue puis fusion ; tests et audit de sécurité (checklist du document 05, section 13) obligatoires avant fusion.
- L'étape suivante ne démarre qu'après validation des critères d'acceptation.
- Chaque étape met à jour `docs/CHANGELOG-AGENT.md` : réalisé, décisions (ADR), dette connue, prochaines actions.
- L'agent ne laisse aucun code factice : pas de "TODO" sur un flux critique, pas de données simulées en production.

## Étape 0 - Fondations
Dépôt, TypeScript strict, ESLint (sécurité, frontières de modules), Prettier, husky, gitleaks, Vitest, Playwright, CI GitHub Actions, validation d'environnement, en-têtes de sécurité, CSP de base, journalisation, Sentry, Neon + Prisma branchés, déploiement Vercel de prévisualisation, design tokens, i18n scaffolding (fr/en), PWA minimale, page d'accueil provisoire.
Acceptation : `pnpm build` et `pnpm test` verts en CI ; en-têtes vérifiés (securityheaders.com niveau A) ; aucun secret détecté ; application déployée en prévisualisation.

## Étape 1 - Comptes, authentification, profils, identité (KYC)
Inscription (téléphone OTP, e-mail, OAuth), sessions sécurisées, 2FA, profils, paramètres de confidentialité, parcours KYC avec stockage privé chiffré, RBAC de base, journal d'audit, détection pays/langue/devise (middleware), sélecteurs.
Acceptation : tests d'accès (IDOR) ; limitation de débit sur OTP ; KYC consultable uniquement par rôle autorisé avec journalisation ; suppression de compte fonctionnelle.

## Étape 2 - Vidéo et fil
Téléversement direct Cloudflare Stream, lecteur HLS, fil vertical, abonnements, likes, commentaires, partages, signalements, brouillons, visibilité, recherche de base, pagination par curseur, mode économie de données.
Acceptation : lecture fluide sur 4G simulée ; contenu privé inaccessible sans droit ; webhook Stream vérifié ; fil paginé sans doublons.

## Étape 3 - Cagnottes, signatures, personnes ressources
Création guidée, justificatifs sécurisés, machine à états, signatures avec anti-fraude, parcours personne ressource, indicateurs de confiance, mises à jour et dépenses, pages publiques SEO.
Acceptation : impossible d'activer sans KYC et 100 signatures valides (ou dérogation auditée) ; une signature par compte ; tests de fraude (rafales, doublons d'appareils).

## Étape 4 - Paiements Moneroo, ledger, wallet, retraits
Intégration Moneroo (collecte, webhooks, vérification, payouts), ledger en partie double avec triggers d'immuabilité, wallet, calcul des commissions, reçus, réconciliation, retraits avec double approbation, plafonds.
Acceptation : tous les tests du document 06 section 7 verts ; réconciliation sans écart en environnement de test Moneroo ; aucun solde négatif possible sous charge.

## Étape 5 - Certification et back-office
Parcours de certification, devis 5 %, files de vérification, modération, finance, support, gestion des rôles et permissions fines, paramètres plateforme, audit consultable.
Acceptation : chaque action sensible laisse une trace d'audit ; le support ne voit pas les pièces d'identité ; double approbation effective.

## Étape 6 - Lives, chat, cadeaux
Agora (jetons serveur), lives avec invités, chat modéré, enregistrement et replay, cadeaux avec wallet, animations (Lottie/R3F), classements, don en direct, anti-abus.
Acceptation : jetons non réutilisables hors rôle ; cadeaux débités une seule fois ; fin de live forcée par modération ; test de charge sur le chat.

## Étape 7 - Géolocalisation, i18n complète, devises, carte
Découverte par rayon, carte MapLibre, alertes d'urgence, langues supplémentaires (dont RTL), traduction automatique des légendes, taux de change et affichage localisé, règles par pays.
Acceptation : changement de pays/langue/devise cohérent partout ; positions floutées ; aucun texte codé en dur.

## Étape 8 - Monétisation, boosts, notifications, recherche
Tableau de bord créateur (2 %), boosts payants, mises en avant, notifications push et e-mail, recherche avancée Meilisearch, rapports de campagne, exports.
Acceptation : calculs de part créateur testés ; boosts étiquetés "Sponsorisé" ; désabonnement aux notifications effectif.

## Étape 9 - Expérience, 3D et performance
Page d'accueil avec 3D (globe), animations finales, accessibilité WCAG 2.2 AA, optimisation des performances, PWA complète (hors-ligne partiel, installation), SEO, pages légales.
Acceptation : Lighthouse mobile supérieur à 85 ; axe-core sans erreur critique ; 3D désactivée sur appareils faibles.

## Étape 10 - Durcissement et mise en production
Revue de sécurité complète, test d'intrusion externe, correction, tests de charge, tests de restauration, runbooks, monitoring et alertes, configuration domaine/DNS/Cloudflare, CGU et politique de confidentialité validées par un juriste, plan de lancement progressif (bêta fermée puis pays par pays), marque (logo, domaine, identité) finalisée.
Acceptation : checklist `/pre-deploiement` entièrement cochée ; validation juridique obtenue pour le wallet et la collecte dans les pays ouverts ; plan de retour arrière testé.

## Après lancement
Application mobile native (Expo/React Native), IA de détection de fraude, vérification terrain, programmes de parrainage, marketplace de projets, partenariats ONG, paiements internationaux étendus.
