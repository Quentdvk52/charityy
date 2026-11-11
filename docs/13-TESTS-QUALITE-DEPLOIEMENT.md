# 13 - Tests, qualité, CI/CD, déploiement et exploitation

## 1. Pyramide de tests
- Unitaires (Vitest) : calculs financiers, machine à états des campagnes, permissions, validation zod, formatage monnaie. Couverture minimale : 90 % sur `modules/ledger`, `modules/payments`, `modules/wallet`, `server/auth` ; 70 % global.
- Intégration : base PostgreSQL de test (branche Neon éphémère ou conteneur), routes API et Server Actions, webhooks signés simulés.
- E2E (Playwright) : inscription, KYC, création de cagnotte, signature, don (Moneroo en mode test), retrait, certification, live (simulé), parcours admin. Exécutés sur mobile et desktop.
- Accessibilité : axe-core sur les pages clés.
- Sécurité : tests d'accès horizontaux et verticaux (IDOR, escalade de rôle), rejeu de webhooks, injection (SQL, XSS), limites de débit, téléversement de fichiers piégés.
- Charge (k6, https://k6.io) : fil, don, chat de live ; objectifs définis avant lancement.
- Chaos léger : indisponibilité Moneroo, Agora, Redis, base en lecture seule ; l'application dégrade proprement (messages clairs, aucune perte d'argent).

## 2. CI (GitHub Actions)
Étapes obligatoires sur chaque pull request : installation figée, lint, typecheck, tests unitaires et d'intégration, gitleaks, audit des dépendances, build, E2E sur prévisualisation, Lighthouse CI, analyse statique (CodeQL, https://codeql.github.com). Fusion bloquée si une étape échoue.

## 3. Environnements
Local, Preview (par branche), Staging (copie de production avec données fictives, Moneroo en mode test), Production. Variables et clés distinctes ; migrations appliquées d'abord en staging.

## 4. Déploiement
- Vercel relié à GitHub ; déploiements immuables ; promotion de staging vers production ; retour arrière en un clic (`request_rollback`).
- Migrations : `prisma migrate deploy` dans une étape contrôlée, jamais automatique au build de production sans validation humaine.
- Déploiement progressif : drapeaux de fonctionnalités (Vercel Flags ou table `PlatformSetting`) pour activer paiements, lives, retraits pays par pays.
- Crons Vercel : réconciliation, taux de change, expiration des KYC, nettoyage des sessions, relances ; protégés par secret.

## 5. Observabilité
Sentry (erreurs front et back), Axiom (logs structurés), PostHog (produit, avec consentement), métriques métier (dons réussis, échec de paiement par méthode, délai de KYC), tableaux de bord et alertes (échec de webhook, écart de ledger, pic d'erreurs, latence), page de statut publique.

## 6. Exploitation
Runbooks dans `docs/runbooks/` : incident de sécurité, panne Moneroo, panne Agora, fraude massive, fuite de données, restauration de base, rotation de clés, gel d'urgence des fonds. Astreinte et escalade définies avant lancement. Revue post-incident systématique.

## 7. Définition de "terminé" pour toute fonctionnalité
Code relu, tests écrits et verts, sécurité vérifiée (checklist), accessibilité vérifiée, traduit (fr/en minimum), journalisation et audit en place, documentation mise à jour, aucune alerte de lint, critères d'acceptation validés un par un.
