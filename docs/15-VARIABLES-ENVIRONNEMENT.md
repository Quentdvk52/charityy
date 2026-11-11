# 15 - Variables d'environnement

Aucune valeur réelle dans ce fichier ni dans le dépôt. L'agent crée `.env.example` avec ces noms (valeurs vides) et valide l'environnement avec zod au démarrage. Les variables sans préfixe `NEXT_PUBLIC_` ne sont jamais envoyées au navigateur.

```
# Application
NODE_ENV=
APP_URL=
NEXT_PUBLIC_APP_URL=
DEFAULT_LOCALE=fr
DEFAULT_CURRENCY=XOF

# Base de données (Neon)
DATABASE_URL=            # URL poolée
DIRECT_URL=              # URL directe pour migrations

# Authentification
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_APPLE_ID=
AUTH_APPLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=

# Chiffrement applicatif
DATA_ENCRYPTION_KEY=     # 32 octets base64, rotation prévue
DATA_ENCRYPTION_KEY_ID=
HASH_PEPPER=             # hachage des IP/appareils (jamais stockés en clair)

# Moneroo
MONEROO_SECRET_KEY=
MONEROO_WEBHOOK_SECRET=
MONEROO_API_BASE=https://api.moneroo.io/v1   # à confirmer dans la documentation

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PRIVATE=
R2_BUCKET_PUBLIC=
R2_ENDPOINT=
STREAM_API_TOKEN=
STREAM_WEBHOOK_SECRET=
STREAM_SIGNING_KEY_ID=
STREAM_SIGNING_KEY_PEM=

# Agora
NEXT_PUBLIC_AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
AGORA_CHAT_APP_KEY=
AGORA_CHAT_CLIENT_ID=
AGORA_CHAT_CLIENT_SECRET=
AGORA_REST_KEY=
AGORA_REST_SECRET=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Communications
RESEND_API_KEY=
EMAIL_FROM=
SMS_PROVIDER=            # termii | twilio
TERMII_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=

# Recherche, cartes, taux
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
NEXT_PUBLIC_MAPTILER_KEY=
FX_API_KEY=

# Observabilité
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
AXIOM_TOKEN=
AXIOM_DATASET=

# Tâches planifiées
CRON_SECRET=
```

Règles : trois jeux de valeurs (preview, staging, production) ; stockage dans Vercel (variables chiffrées, type "sensitive" pour les secrets) ; rotation au moins annuelle et immédiate en cas de doute ; accès restreint aux personnes nécessaires.
