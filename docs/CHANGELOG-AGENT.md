# Journal de bord de l'agent Charityy

## Version 1.0.0 — 11 Novembre 2026

### 1. Analyse Comparative et Alignement Stratégique
- **Comparaison exhaustive** menée entre l'Archive GPT (`Charityy-Archive gpt.zip`) et le Dossier Antigravity (`charityy-dossier-antigravity.zip`).
- **Convergences majeures consolidées** : Vision produit solidaire, modèle Moneroo exclusif au lancement, FCFA (XOF) en devise de référence interne, stockage strict des montants en entiers mineurs (BigInt), ledger en partie double immuable, seuil de 100 signatures, certification à 5%, hébergement hermétique des pièces sensibles sur R2 privé avec URL de 60s, et séparation des tâches d'administration.
- **Compléments de cadrage juridique et de gouvernance (issus de GPT)** : Précision du rôle d'intermédiaire sans séquestre, procédure de dérogation d'urgence pour les détresses vitales, avertissements obligatoires sur la portée des signatures et de la certification, protocole de réponse aux incidents et gestion des litiges.
- **Compléments d'ingénierie (issus d'Antigravity)** : Schéma Prisma de 441 lignes complet, modèle mathématique `computeSplit()`, machine à états de campagne, matrice RBAC des 11 rôles, règles `.agent/rules` et compétences `.agent/skills`.

### 2. Développements Locaux Réalisés
- **Socle & Configuration** : `package.json`, `tsconfig.json` strict, `next.config.ts` durci avec en-têtes de sécurité, `tailwind.config.ts` conforme à la direction artistique sobre (noir, blanc, gris clair).
- **Sécurité & Cryptographie** : Chiffrement symétrique AES-256-GCM (`src/lib/crypto.ts`), hachage d'adresses IP et d'appareils avec poivre secret (`hashWithPepper`), vérification de signature HMAC-SHA256 en temps constant.
- **Moteur Financier & Ledger** :
  - `src/modules/payments/split.ts` : Fonction pure `computeSplit()` calculant la déduction Moneroo, les 3% net plateforme, les 2% créateur et le net bénéficiaire avec conservation totale.
  - `src/modules/ledger/service.ts` : Moteur de validation comptable en partie double (égalité stricte Débit = Crédit par devise).
  - `src/lib/currency.ts` : Gestion des exposants de devises (XOF sans décimales, USD/EUR avec 2 décimales).
- **Machine à États des Cagnottes** : `src/modules/campaigns/state-machine.ts` régissant les transitions (DRAFT -> AWAITING_SIGNATURES -> COMMUNITY_VALIDATED -> ACTIVE -> CERTIFIED -> CLOSED).
- **Moteur de Signatures** : `src/modules/signatures/service.ts` avec suivi des quotas (40 proches, 30 personnes ressources, 30 communauté) et détection anti-sybil par empreinte d'appareil.
- **Contrôle d'Accès RBAC** : `src/server/auth/permissions.ts` avec matrice rôle x action et refus par défaut.
- **Intégrations Externes** :
  - `src/server/integrations/moneroo.ts` : Client Moneroo officiel (initialisation, vérification serveur, reversements, webhooks avec mock local).
  - `src/server/integrations/stream.ts` : Direct Creator Upload Cloudflare Stream.
  - `src/server/integrations/r2.ts` : Bucket privé et URLs pré-signées de 60 secondes.
  - `src/server/integrations/agora.ts` : Génération de jetons RTC Agora côté serveur.
- **Interface & Expérience Mobile-First** : `src/app/page.tsx` intégrant le fil vidéo, le calcul transparent du don, la signature citoyenne, le direct solidaire avec cadeaux et la console d'administration.
- **Amorçage & Internationalisation** : `prisma/seed.ts`, `src/messages/fr.json` et `src/messages/en.json`.
- **Suite de Tests Unitaires** : Tests complets dans `tests/unit/` (split, machine à états, ledger, permissions, cryptographie, devises).

### 3. Dette Connue & Prochaines Actions
- Validation formelle par les conseils juridiques du schéma de flux Moneroo pour le statut de non-détention de fonds.
- Branchement des clés de production réelles dès que les comptes marchands Moneroo et Cloudflare sont validés.

## Version 1.1.0 — 12 Novembre 2026 (Étape 1 : Comptes, Auth & KYC)

### 1. Authentification & Sessions Sécurisées
- **Hachage PBKDF2 avec sel** (`src/server/auth/session.ts`) : 600 000 itérations SHA-512, vérification en temps constant contre les attaques temporelles.
- **Gestion des sessions** : Cookies `HttpOnly`, `Secure`, `SameSite=Lax` avec hash SHA-256 stocké côté serveur.
- **Service OTP anti-bruteforce** : Codes à 6 chiffres, expiration à 5 minutes, blocage strict après 5 échecs.
- **Routes API d'authentification** : Inscription (`/api/auth/register`), Connexion (`/api/auth/login`), Déconnexion (`/api/auth/logout`), Profil actif (`/api/auth/me`), et validation OTP (`/api/auth/otp`).

### 2. Parcours KYC & Protection des Pièces Justificatives
- **Chiffrement symétrique au repos** : Numéro de pièce d'identité chiffré en AES-256-GCM (`encryptSensitive`) dès la soumission (`/api/kyc/submit`).
- **Visionneuse sécurisée éphémère** (`/api/kyc/document-url`) : URLs signées R2 d'une durée stricte de 60 secondes, réservées aux rôles avec permission `kyc:view_sensitive` (VERIFIER, ADMIN, SUPER_ADMIN), interdites au support, avec journalisation d'audit systématique.
- **Revue documentaire** : Approbation ou rejet motivé avec traçabilité de l'agent vérificateur.

### 3. Middleware & Géolocalisation
- **`src/middleware.ts`** : Détection automatique du pays (`x-vercel-ip-country`), de la ville, de la langue et mapping de la devise locale (XOF, XAF, EUR, USD, etc.).
- **Protection des accès admin** : Redirection automatique si tentative d'accès sans session active.

### 4. Tests Unitaires Validés
- `tests/unit/auth.test.ts` (PBKDF2, sessions, OTP et limites de tentatives).
- `tests/unit/kyc.test.ts` (Chiffrement AES-256-GCM, contrôle d'accès vertical/horizontal, URLs signées 60s).

## Version 2.0.0 — 12 Novembre 2026 (Livraison Intégrale des Étapes 2 à 10)

### 1. Vidéo & Fil d'Actualité (Étape 2)
- **Moteur de recommandation** (`src/modules/videos/service.ts`) : Algorithme multi-critères combinant fraîcheur temporelle, proximité géographique, certification et urgence vitale, avec règle anti-monopole (max 2 vidéos consécutives par auteur).
- **API du fil vidéo** (`/api/feed`) : 4 flux spécialisés (`for_you`, `local`, `urgencies`, `lives`).
- **Upload Stream** (`/api/videos/upload-url`) : Direct creator upload Cloudflare Stream avec plafonnement à 180s.
- **Interactions sociales** (`/api/videos/[id]/interaction`) : Gestion des likes, des commentaires et signalements pour modération.

### 2. Cagnottes, Signatures Citoyennes & Confiance (Étape 3)
- **Gestion des cagnottes** (`/api/campaigns`) : Création guidée avec contrôle KYC préalable, gestion des objectifs et des devises.
- **Signatures citoyennes anti-sybil** (`/api/campaigns/[id]/signatures`) : Quotas cibles (40 proches, 30 personnes ressources, 30 communauté), unicité de vote par compte, hachage d'appareil/IP avec poivre pour contrer les fermes de faux comptes.
- **Validation communautaire automatique** : Transition automatique `AWAITING_SIGNATURES -> COMMUNITY_VALIDATED -> ACTIVE` dès le franchissement des 100 signatures valides.

### 3. Paiements Moneroo, Ledger en Partie Double, Wallet & Retraits (Étape 4)
- **Tunnel de don Moneroo** (`/api/payments/init`) : Calcul transparent du split financier avant paiement.
- **Webhook Moneroo sécurisé** (`/api/webhooks/moneroo`) : Vérification cryptographique HMAC-SHA256 en temps constant, protection anti-rejeu par registre d'idempotence, re-vérification du statut de la transaction auprès de l'API Moneroo et écriture canonique dans le ledger (Débit = Crédit).
- **Gestion des retraits et double approbation** (`/api/payouts/request` et `/api/payouts/approve`) : Règle stricte imposant 2 signataires distincts (FINANCE puis ADMIN) pour tout versement supérieur ou égal à 1 000 000 FCFA avec interdiction d'approuver son propre retrait.

### 4. Directs Solidaires Agora RTC & Cadeaux Virtuels (Étape 6)
- **Génération de jetons Agora RTC** (`/api/live/agora-token`) : Jetons serveur éphémères (1 heure), obligation de KYC approuvé pour démarrer un live de collecte.
- **Cadeaux virtuels** (`/api/live/gifts/send`) : Débit direct du wallet avec écriture ledger en temps réel.

### 5. Géolocalisation, Devises, PWA & Conformité Légale (Étapes 7, 8, 9, 10)
- **API de conversion de devises** (`/api/currency/rates`) : Taux de référence XOF vers XAF, EUR, USD, GNF, CDF, CAD, GBP.
- **Carte des urgences avec floutage GPS** (`/api/urgencies/map`) : Décalage aléatoire pour préserver l'intimité des bénéficiaires.
- **PWA complète** : Manifeste (`public/manifest.json`) et Service Worker (`public/sw.js`) pour fonctionnement hors-ligne partiel.
- **Pages légales & Transparence** : CGU (`/cgu`), Politique de confidentialité (`/confidentialite`), et `/.well-known/security.txt`.
- **Rapport d'audit de sécurité** : Fiche complète consignée dans `docs/audits/audit-securite-final.md`.


