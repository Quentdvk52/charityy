# 03 - Stack technologique, bibliothèques et installation

Règle : l'agent installe la dernière version stable de chaque paquet, vérifie sa date de publication (ne pas utiliser une version publiée il y a moins de 14 jours), fige la version exacte dans `package.json` (pas de `^` pour les paquets sensibles) et commit le lockfile. Les noms de paquets ci-dessous sont à confirmer sur npm avant installation ; si un nom a changé, consigner un ADR.

Gestionnaire : pnpm (https://pnpm.io/installation). Node.js LTS actuelle (https://nodejs.org).

## 1. Socle

| Besoin | Techno | Installation / lien |
|--------|--------|---------------------|
| Framework | Next.js (App Router), dernière version stable | `pnpm create next-app@latest charityy --ts --tailwind --eslint --app --src-dir --import-alias "@/*"` ; https://nextjs.org/docs |
| UI | React (fourni par Next) | https://react.dev |
| Langage | TypeScript strict | `"strict": true`, `noUncheckedIndexedAccess: true` ; https://www.typescriptlang.org |
| Style | Tailwind CSS | https://tailwindcss.com/docs |
| Composants | shadcn/ui (Radix) | `pnpm dlx shadcn@latest init` ; https://ui.shadcn.com |
| Validation | Zod | `pnpm add zod` ; https://zod.dev |
| Formulaires | React Hook Form | `pnpm add react-hook-form @hookform/resolvers` ; https://react-hook-form.com |
| Données client | TanStack Query | `pnpm add @tanstack/react-query` ; https://tanstack.com/query |
| État local | Zustand | `pnpm add zustand` ; https://zustand.docs.pmnd.rs |
| Dates | date-fns | `pnpm add date-fns` |
| Icônes (usage fonctionnel seulement) | lucide-react | `pnpm add lucide-react` |

## 2. Animations et 3D

| Besoin | Bibliothèque | Installation / lien |
|--------|--------------|---------------------|
| Animations UI, transitions de pages, micro-interactions | Motion (ex Framer Motion) | `pnpm add motion` (ou `framer-motion`) ; https://motion.dev |
| Animations scénarisées, défilement | GSAP + ScrollTrigger | `pnpm add gsap @gsap/react` ; https://gsap.com/docs |
| Défilement fluide | Lenis | `pnpm add lenis` ; https://lenis.darkroom.engineering |
| 3D | Three.js | `pnpm add three @types/three` ; https://threejs.org |
| 3D dans React | React Three Fiber | `pnpm add @react-three/fiber` ; https://r3f.docs.pmnd.rs |
| Aides 3D (caméra, modèles, lumières) | Drei | `pnpm add @react-three/drei` ; https://drei.docs.pmnd.rs |
| Effets 3D (bloom, flou) | Postprocessing | `pnpm add @react-three/postprocessing postprocessing` |
| Animations vectorielles légères | Lottie | `pnpm add lottie-react` ; https://lottiefiles.com |
| Confettis de succès de don | canvas-confetti | `pnpm add canvas-confetti` |
| Particules / globe de fond | Three.js points ou `cobe` (globe léger) | `pnpm add cobe` ; https://cobe.vercel.app |
| Modèles 3D compressés | glTF + Draco/Meshopt | https://gltf.pmnd.rs (conversion en composant R3F) |
| Graphiques | Recharts | `pnpm add recharts` ; https://recharts.org |
| Cartes | MapLibre GL + react-map-gl | `pnpm add maplibre-gl react-map-gl` ; https://maplibre.org ; tuiles : MapTiler ou OpenStreetMap selon licence |

Règles 3D : chargement différé (`next/dynamic`, `ssr: false`), désactivation sur appareils faibles ou si `prefers-reduced-motion`, budget de 150 Ko JS supplémentaire par scène, jamais de 3D sur le fil vidéo ni sur les écrans de don (performance et réassurance).

## 3. Données et backend

| Besoin | Techno | Installation / lien |
|--------|--------|---------------------|
| Base de données | Neon PostgreSQL | https://neon.tech ; `pnpm add @neondatabase/serverless` |
| ORM | Prisma | `pnpm add prisma @prisma/client` puis `pnpm prisma init` ; https://www.prisma.io/docs |
| Authentification | Auth.js (next-auth v5) | `pnpm add next-auth@beta` ; https://authjs.dev (alternative : Clerk, https://clerk.com) |
| Hachage | argon2 (préféré) | `pnpm add argon2` (ou `@node-rs/argon2`) |
| Jetons | jose | `pnpm add jose` |
| Stockage fichiers | Cloudflare R2 (API S3) | `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` ; https://developers.cloudflare.com/r2 |
| Vidéo (transcodage, HLS) | Cloudflare Stream | https://developers.cloudflare.com/stream (alternative : Mux, https://www.mux.com) |
| Lecteur vidéo | hls.js ou lecteur Stream | `pnpm add hls.js` |
| Live et chat | Agora | `pnpm add agora-rtc-sdk-ng agora-token` ; https://docs.agora.io ; chat : https://docs.agora.io/en/agora-chat/overview/product-overview |
| Paiements | Moneroo (API REST) | https://docs.moneroo.io ; appels via `fetch` côté serveur uniquement |
| Redis, rate limit, files | Upstash | `pnpm add @upstash/redis @upstash/ratelimit @upstash/qstash` ; https://upstash.com |
| E-mail | Resend | `pnpm add resend` ; https://resend.com |
| SMS OTP | Termii (Afrique) ou Twilio Verify | https://www.termii.com ; https://www.twilio.com/verify |
| Notifications push | Web Push (VAPID) + OneSignal ou FCM | `pnpm add web-push` ; https://onesignal.com |
| Recherche | Meilisearch | `pnpm add meilisearch` ; https://www.meilisearch.com |
| Traitement d'images | sharp | `pnpm add sharp` |
| Nettoyage HTML | isomorphic-dompurify | `pnpm add isomorphic-dompurify` |
| Journaux | pino | `pnpm add pino` |
| Montants | dinero.js v2 ou entiers BigInt maison | `pnpm add dinero.js@alpha` (à confirmer) ; sinon utilitaires internes |
| Taux de change | API de taux (open.er-api.com ou fixer) stockés en base, rafraîchis par cron | https://www.exchangerate-api.com/docs/free |
| Géolocalisation IP | En-têtes Vercel (`x-vercel-ip-country`, `x-vercel-ip-city`) ou `geolocation()` | `pnpm add @vercel/functions` ; https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package |

## 4. Internationalisation, PWA, SEO

| Besoin | Techno | Installation / lien |
|--------|--------|---------------------|
| i18n | next-intl | `pnpm add next-intl` ; https://next-intl.dev |
| Formatage monnaie/langue | Intl natif | rien à installer |
| PWA | Serwist (successeur maintenu de next-pwa) | `pnpm add @serwist/next && pnpm add -D serwist` ; https://serwist.pages.dev |
| SEO | Metadata API Next, sitemap dynamique, JSON-LD | natif |
| Compression/OG | `@vercel/og` | natif Next (`next/og`) |

## 5. Qualité, sécurité, observabilité

| Besoin | Outil | Installation / lien |
|--------|-------|---------------------|
| Lint | ESLint + plugin sécurité | `pnpm add -D eslint-plugin-security eslint-plugin-boundaries` |
| Format | Prettier | `pnpm add -D prettier` |
| Tests unitaires | Vitest | `pnpm add -D vitest @vitest/coverage-v8` ; https://vitest.dev |
| Tests composants | Testing Library | `pnpm add -D @testing-library/react @testing-library/jest-dom` |
| Tests E2E | Playwright | `pnpm create playwright` ; https://playwright.dev |
| Accessibilité | axe-core | `pnpm add -D @axe-core/playwright` |
| Audit dépendances | pnpm audit, OSV-Scanner, Dependabot/Renovate | https://google.github.io/osv-scanner |
| Secrets | gitleaks (pré-commit) | https://github.com/gitleaks/gitleaks |
| Hooks git | husky + lint-staged | `pnpm add -D husky lint-staged` |
| Erreurs | Sentry | `pnpm dlx @sentry/wizard@latest -i nextjs` ; https://docs.sentry.io/platforms/javascript/guides/nextjs |
| Analytics | PostHog (avec consentement) | `pnpm add posthog-js posthog-node` ; https://posthog.com/docs |
| Logs | Axiom | https://axiom.co/docs/send-data/vercel |
| CI/CD | GitHub Actions + Vercel | https://docs.github.com/actions ; https://vercel.com/docs |
| Pare-feu, DNS, WAF | Cloudflare | https://developers.cloudflare.com/waf |

## 6. Commandes de démarrage (ordre)
```
pnpm create next-app@latest charityy --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd charityy
pnpm dlx shadcn@latest init
pnpm add zod react-hook-form @hookform/resolvers @tanstack/react-query zustand date-fns lucide-react next-intl
pnpm add motion gsap @gsap/react lenis three @react-three/fiber @react-three/drei lottie-react canvas-confetti
pnpm add prisma @prisma/client @neondatabase/serverless next-auth@beta argon2 jose
pnpm add @upstash/redis @upstash/ratelimit @upstash/qstash resend sharp isomorphic-dompurify pino
pnpm add -D vitest @vitest/coverage-v8 @playwright/test eslint-plugin-security eslint-plugin-boundaries prettier husky lint-staged
pnpm prisma init
```
L'agent exécute ces commandes par groupes, lance `pnpm build` après chaque groupe, et consigne tout écart.

## 7. Skills Antigravity à utiliser
Les skills du dossier `.agent/skills/` (charityy-securite, charityy-paiements, charityy-design, charityy-video-live) sont à charger systématiquement pour les tâches correspondantes. Si vous ajoutez des skills communautaires, installez-les uniquement depuis des sources de confiance et relisez leur contenu : un skill est du code exécutable par l'agent.
