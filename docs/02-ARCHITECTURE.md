# 02 - Architecture technique

## 1. Principes
1. Monolithe modulaire Next.js (App Router) déployé sur Vercel : simple à livrer, évolutif ensuite par extraction de services.
2. Séparation stricte : interface (app/), logique métier (src/modules/), accès données (src/server/db), intégrations externes (src/server/integrations).
3. Toute règle métier et toute vérification d'autorisation vivent côté serveur. Le client n'est jamais une source de vérité.
4. Tout flux d'argent passe par le ledger (document 04) et des opérations idempotentes.
5. Tâches lentes ou sensibles (webhooks, e-mails, calculs de commissions, réconciliation, modération automatique) passent par des files (QStash) et des crons.

## 2. Vue d'ensemble

Client (PWA Next.js) -> Edge (middleware : pays, langue, rate limit, en-têtes sécurité) -> Route Handlers / Server Actions -> Modules métier -> Neon PostgreSQL (Prisma)
Intégrations : Moneroo (paiements, reversements, webhooks), Agora (lives, chat), Cloudflare Stream (vidéo), Cloudflare R2 (documents et images privés/publics), Upstash (Redis, rate limit, QStash), Resend (e-mail), SMS OTP (Termii ou Twilio Verify), Meilisearch (recherche), Sentry/PostHog/Axiom (observabilité).

## 3. Structure du dépôt

```
charityy/
  .agent/                 règles, skills, workflows Antigravity
  docs/                   ces documents
  prisma/schema.prisma
  public/                 icônes PWA, manifest, polices locales
  src/
    app/
      [locale]/           pages internationalisées
        (public)/         accueil, découverte, cagnotte, profil public
        (auth)/           connexion, inscription, OTP
        (app)/            espace connecté : créer, portefeuille, notifications
        (admin)/          back-office (accès strict par rôle)
      api/
        webhooks/moneroo/ webhooks signés
        webhooks/cloudflare/
        webhooks/agora/
        cron/             tâches planifiées protégées par secret
    modules/
      auth/ users/ kyc/ videos/ feed/ campaigns/ signatures/
      certification/ payments/ wallet/ ledger/ gifts/ lives/
      boosts/ creators/ moderation/ notifications/ search/ geo/ i18n/ admin/
    server/
      db/                 client Prisma, transactions, helpers
      auth/               session, RBAC, permissions
      integrations/       moneroo.ts, agora.ts, stream.ts, r2.ts, sms.ts, mail.ts
      security/           rate-limit, csrf, upload-validation, crypto, audit
      jobs/               handlers QStash et crons
    components/           ui/ (shadcn), layout/, feed/, campaign/, three/
    lib/                  utilitaires purs, formatage monnaie/date, env.ts (validation zod)
    messages/             fr.json, en.json, etc.
    tests/                unit/, integration/, e2e/
  middleware.ts
  next.config.ts          en-têtes de sécurité, images, PWA
```

Règle d'import : `app` peut importer `modules` et `components` ; `modules` ne peut pas importer `app` ; `server/integrations` n'est importé que depuis `modules` et `server/jobs`. Imposer par ESLint (eslint-plugin-boundaries ou règles no-restricted-imports).

## 4. Flux critiques

### 4.1 Don
1. Le client demande un don (montant, campagne) -> Server Action valide (zod), contrôle campagne active, crée `Payment(status=PENDING)` avec clé d'idempotence.
2. Appel Moneroo `initialize` côté serveur -> redirection vers le checkout Moneroo.
3. Moneroo envoie le webhook -> vérification de signature sur le corps brut -> enregistrement dans `WebhookEvent` (unique par id d'événement) -> job de traitement.
4. Le job re-vérifie le paiement via l'API Moneroo (`verify`), puis dans UNE transaction SQL : passe le paiement à SUCCESS, écrit les lignes de ledger (don, frais, commission, part créateur), met à jour les compteurs.
5. Notification au bénéficiaire et au donateur, reçu généré.

### 4.2 Cagnotte -> activation
Brouillon -> KYC créateur approuvé -> collecte de signatures -> 100 signatures valides -> (option) certification -> activation. Les transitions sont gérées par une machine à états unique (`campaigns/state-machine.ts`) ; aucune mise à jour de statut ailleurs.

### 4.3 Reversement
Demande de retrait -> contrôles (KYC, plafonds, gel éventuel, anti-fraude) -> approbation selon seuil (automatique sous seuil, double validation humaine au-dessus) -> Moneroo `payout` -> webhook -> écritures ledger -> notification.

### 4.4 Live
Création d'une session -> jeton Agora généré côté serveur à durée courte, rôle limité (hôte ou audience) -> chat et cadeaux -> cadeaux = débit wallet + ledger -> enregistrement et replay via Cloudflare/Agora.

## 5. Décisions d'architecture (ADR) que l'agent doit consigner
Chaque choix non prévu dans ces documents est consigné dans `docs/adr/NNNN-titre.md` (contexte, décision, conséquences). Pas de dépendance ajoutée sans ADR court.

## 6. Évolutivité
- Feed : phase 1 requêtes SQL indexées + cache Redis ; phase 2 table de recommandations pré-calculées par cron ; phase 3 moteur dédié.
- Lecture lourde : réplicas de lecture Neon, cache Upstash, CDN.
- Pagination par curseur partout (jamais offset sur les grandes tables).
