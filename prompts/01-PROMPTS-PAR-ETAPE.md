# Prompts par étape

Utilisez le prompt de l'étape en cours, après validation de la précédente. Chaque prompt suppose que le prompt maître a été donné.

## Étape 0 - Fondations
Lis docs/12 (étape 0), docs/02, docs/03, docs/05, docs/13 et docs/15. Exécute l'étape 0 : initialise le projet avec les commandes du document 03 (par groupes, build après chaque groupe), configure TypeScript strict, ESLint avec règles de sécurité et frontières de modules, Prettier, husky, gitleaks, Vitest, Playwright, CI GitHub Actions, validation de l'environnement avec zod (src/lib/env.ts) et .env.example, en-têtes de sécurité et CSP avec nonces, journalisation pino, Sentry, Prisma branché sur Neon avec le schéma de référence, tokens de design, scaffolding next-intl (fr, en), PWA minimale avec Serwist, page d'accueil provisoire. Ne demande aucune valeur de secret : liste-moi ce que je dois renseigner. Termine par la checklist de sécurité et le compte rendu.

## Étape 1 - Comptes, authentification, KYC
Lis docs/12 (étape 1), docs/05, docs/10, docs/11, docs/14. Implémente inscription par téléphone (OTP avec limites strictes), e-mail, OAuth, sessions sécurisées avec hash de jeton en base, 2FA TOTP, profils et confidentialité, parcours KYC avec téléversement vers un bucket R2 privé, chiffrement du numéro de pièce, visionneuse réservée aux rôles autorisés avec URL signées de 60 secondes et journal d'audit, RBAC avec permissions fines, détection pays/langue/devise dans le middleware avec sélecteurs. Écris les tests d'accès horizontaux et verticaux. Termine par la checklist de sécurité.

## Étape 2 - Vidéo et fil
Lis docs/12 (étape 2), docs/07 (sections 1 et 2), docs/05, docs/09. Implémente le téléversement direct Cloudflare Stream, le webhook vérifié, le lecteur HLS, le fil vertical avec onglets, abonnements, likes, commentaires, partages, signalements, brouillons, visibilité, pagination par curseur, mode économie de données, file de modération minimale. Vérifie la lecture sur réseau lent simulé et l'inaccessibilité des contenus privés.

## Étape 3 - Cagnottes, signatures, personnes ressources
Lis docs/12 (étape 3), docs/08, docs/05, docs/14. Implémente la machine à états unique des campagnes, la création guidée, le stockage sécurisé des justificatifs avec antivirus, les signatures avec règles de validité et détection de fraude, le parcours personne ressource, les indicateurs de confiance, les mises à jour et dépenses, les pages publiques optimisées SEO. Teste toutes les transitions et les scénarios de fraude.

## Étape 4 - Paiements, ledger, wallet, retraits
Lis docs/12 (étape 4), docs/06, docs/04, docs/05 ET la documentation officielle Moneroo (https://docs.moneroo.io). Avant de coder, liste-moi les points "à confirmer" du document 06 avec ce que la documentation indique réellement. Implémente ensuite l'intégration serveur, les webhooks, le ledger avec triggers d'immuabilité, le wallet, computeSplit() avec tests exhaustifs, la réconciliation, les retraits avec double approbation et plafonds. Écris et exécute tous les tests de la section 7 du document 06. Ne passe rien en production : environnement de test Moneroo uniquement.

## Étape 5 - Certification et back-office
Lis docs/12 (étape 5), docs/11, docs/08 (section 5), docs/06 (section 4), docs/05. Implémente le parcours de certification et le devis, toutes les files du back-office, la gestion des rôles et permissions fines, les paramètres de plateforme versionnés, l'audit consultable. Vérifie que le support ne voit jamais les pièces d'identité et que chaque action sensible est auditée.

## Étape 6 - Lives, chat, cadeaux
Lis docs/12 (étape 6), docs/07 (sections 3 et 4), docs/05, docs/06. Lis la documentation Agora actuelle. Implémente les jetons côté serveur, les lives avec invités, le chat modéré, l'enregistrement et le replay, les cadeaux via wallet, les animations, les classements, le don en direct, les contrôles anti-abus. Teste le débit unique des cadeaux et la fin de live forcée.

## Étape 7 - Géolocalisation, langues, devises
Lis docs/12 (étape 7), docs/10, docs/05. Implémente découverte par rayon, carte MapLibre avec positions floutées, alertes d'urgence, langues supplémentaires dont RTL, traduction automatique des légendes, taux de change et affichage localisé, règles par pays. Vérifie qu'aucune chaîne n'est codée en dur.

## Étape 8 - Monétisation, boosts, notifications, recherche
Lis docs/12 (étape 8), docs/06, docs/07, docs/05. Implémente le tableau de bord créateur, la part créateur de 2 % selon la base définie (confirme-moi la règle de financement avant), les boosts étiquetés, les notifications push et e-mail avec désinscription, la recherche Meilisearch, les rapports de campagne et exports.

## Étape 9 - Expérience, 3D, performance
Lis docs/12 (étape 9), docs/09, docs/13. Implémente la page d'accueil avec globe 3D chargé à la demande et repli statique, les animations finales, l'accessibilité WCAG 2.2 AA, la PWA complète, le SEO et les pages légales intégrées. Mesure Lighthouse mobile et axe-core et corrige jusqu'aux objectifs.

## Étape 10 - Durcissement et production
Lis docs/12 (étape 10), docs/05, docs/13, docs/14. Exécute l'audit de sécurité complet (/audit-securite), prépare les runbooks, les alertes, les tests de charge et de restauration, la configuration domaine/DNS/Cloudflare, et la checklist /pre-deploiement. Liste-moi précisément ce qui reste à valider côté humain (juriste, test d'intrusion, comptes de production, marque).

## Prompt de reprise (si l'agent perd le contexte)
Relis README.md, docs/CHANGELOG-AGENT.md, docs/12 et les règles du dossier .agent. Dis-moi en 10 lignes où nous en sommes, ce qui reste pour l'étape en cours, puis continue sans modifier ce qui est déjà validé.
