import type { UserRole } from "../../lib/constants.ts";

export type Permission =
  // Campagnes & Vidéos
  | "campaign:create"
  | "campaign:update_own"
  | "campaign:sign"
  | "campaign:donate"
  | "campaign:suspend"
  | "campaign:freeze"
  | "campaign:certify"
  | "video:upload"
  | "video:moderate"
  // KYC & Personnes ressources
  | "kyc:submit"
  | "kyc:view_sensitive"
  | "kyc:review"
  | "resource_person:verify"
  // Finances, Wallet & Retraits
  | "wallet:topup"
  | "wallet:spend"
  | "payout:request"
  | "payout:review"
  | "payout:second_approve"
  | "finance:reconcile"
  | "finance:refund"
  // Support & Administration
  | "support:view_tickets"
  | "support:reply"
  | "admin:view_dashboard"
  | "admin:audit_logs"
  | "admin:manage_roles"
  | "admin:platform_settings";

/**
 * Matrice stricte des permissions accordées par rôle.
 * Règle d'or : Refus par défaut. Si une permission n'est pas listée, l'accès est interdit.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    "campaign:sign",
    "campaign:donate",
    "video:upload",
    "kyc:submit",
    "wallet:topup",
    "wallet:spend",
    "support:reply",
  ],
  CREATOR: [
    "campaign:create",
    "campaign:update_own",
    "campaign:sign",
    "campaign:donate",
    "video:upload",
    "kyc:submit",
    "wallet:topup",
    "wallet:spend",
    "payout:request",
    "support:reply",
  ],
  ORG_OWNER: [
    "campaign:create",
    "campaign:update_own",
    "campaign:sign",
    "campaign:donate",
    "video:upload",
    "kyc:submit",
    "wallet:topup",
    "wallet:spend",
    "payout:request",
    "support:reply",
  ],
  MODERATOR: [
    "campaign:sign",
    "campaign:donate",
    "campaign:suspend",
    "video:moderate",
    "admin:view_dashboard",
    "admin:audit_logs",
    "support:view_tickets",
    "support:reply",
  ],
  VERIFIER: [
    "campaign:sign",
    "campaign:donate",
    "campaign:certify",
    "kyc:view_sensitive",
    "kyc:review",
    "resource_person:verify",
    "admin:view_dashboard",
    "admin:audit_logs",
  ],
  FINANCE: [
    "campaign:freeze",
    "payout:review",
    "payout:second_approve",
    "finance:reconcile",
    "finance:refund",
    "admin:view_dashboard",
    "admin:audit_logs",
  ],
  SUPPORT: [
    "support:view_tickets",
    "support:reply",
    "admin:view_dashboard",
  ],
  ADMIN: [
    "campaign:create",
    "campaign:update_own",
    "campaign:sign",
    "campaign:donate",
    "campaign:suspend",
    "campaign:freeze",
    "campaign:certify",
    "video:moderate",
    "kyc:view_sensitive",
    "kyc:review",
    "resource_person:verify",
    "payout:review",
    "finance:reconcile",
    "finance:refund",
    "support:view_tickets",
    "support:reply",
    "admin:view_dashboard",
    "admin:audit_logs",
    "admin:platform_settings",
  ],
  SUPER_ADMIN: [
    "campaign:create",
    "campaign:update_own",
    "campaign:sign",
    "campaign:donate",
    "campaign:suspend",
    "campaign:freeze",
    "campaign:certify",
    "video:moderate",
    "kyc:view_sensitive",
    "kyc:review",
    "resource_person:verify",
    "payout:review",
    "payout:second_approve",
    "finance:reconcile",
    "finance:refund",
    "support:view_tickets",
    "support:reply",
    "admin:view_dashboard",
    "admin:audit_logs",
    "admin:manage_roles",
    "admin:platform_settings",
  ],
};

/**
 * Vérifie si une liste de rôles utilisateur accorde une permission donnée.
 */
export function hasPermission(roles: UserRole[], permission: Permission): boolean {
  if (!roles || roles.length === 0) return false;

  return roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  });
}

/**
 * Exige une permission spécifique, lève une exception en cas de refus.
 */
export function assertPermission(roles: UserRole[], permission: Permission): void {
  if (!hasPermission(roles, permission)) {
    throw new Error(`Accès refusé : la permission ${permission} est requise`);
  }
}
