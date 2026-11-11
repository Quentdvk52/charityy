export const PLATFORM_DEFAULTS = {
  FEE_PLATFORM_RATE: 0.03, // 3% commission on net receipts
  FEE_CREATOR_RATE: 0.02, // 2% creator monetization
  FEE_CERTIFICATION_RATE: 0.05, // 5% of campaign goal
  SIGNATURE_TARGET_TOTAL: 100,
  SIGNATURE_QUOTAS: {
    RELATIVE: 40,
    RESOURCE_PERSON: 30,
    COMMUNITY: 30,
  },
  PAYOUT_SECURITY_DELAY_HOURS: 48,
  PAYOUT_DUAL_APPROVAL_THRESHOLD_XOF: 1_000_000n, // Above 1,000,000 XOF requires two approvals
  MIN_CAMPAIGN_DURATION_DAYS: 3,
  MAX_CAMPAIGN_DURATION_DAYS: 90,
  VIDEO_MAX_DURATION_SEC: 180,
  PRIVATE_URL_EXPIRATION_SEC: 60,
} as const;

export const SUPPORTED_CURRENCIES = {
  XOF: { code: "XOF", exponent: 0, name: "Franc CFA UEMOA", symbol: "FCFA" },
  XAF: { code: "XAF", exponent: 0, name: "Franc CFA CEMAC", symbol: "FCFA" },
  GNF: { code: "GNF", exponent: 0, name: "Franc Guinéen", symbol: "FG" },
  NGN: { code: "NGN", exponent: 2, name: "Naira Nigérian", symbol: "₦" },
  GHS: { code: "GHS", exponent: 2, name: "Cedi Ghanéen", symbol: "GH₵" },
  KES: { code: "KES", exponent: 2, name: "Shilling Kenyan", symbol: "KSh" },
  EUR: { code: "EUR", exponent: 2, name: "Euro", symbol: "€" },
  USD: { code: "USD", exponent: 2, name: "Dollar US", symbol: "$" },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export const USER_ROLES = [
  "USER",
  "CREATOR",
  "ORG_OWNER",
  "MODERATOR",
  "VERIFIER",
  "FINANCE",
  "SUPPORT",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const KYC_LEVELS = {
  LEVEL_0: {
    level: 0,
    name: "Téléphone vérifié",
    rights: "Regarder, commenter, signer, petits dons",
  },
  LEVEL_1: {
    level: 1,
    name: "Email & Profil complété",
    rights: "Dons plus élevés, wallet standard",
  },
  LEVEL_2: {
    level: 2,
    name: "Pièce d'identité vérifiée",
    rights: "Créer une cagnotte, live de collecte",
  },
  LEVEL_3: {
    level: 3,
    name: "Vérification renforcée",
    rights: "Retraits élevés, certification",
  },
} as const;
