export type CampaignStatus =
  | "DRAFT"
  | "AWAITING_SIGNATURES"
  | "IN_REVIEW"
  | "COMMUNITY_VALIDATED"
  | "CERTIFIED"
  | "ACTIVE"
  | "ENDED"
  | "SUSPENDED"
  | "FROZEN"
  | "CLOSED";

export interface TransitionContext {
  validSignatureCount: number;
  isKycApproved: boolean;
  hasMedicalOrEmergencyExemption?: boolean;
  actorRole: string;
  reason?: string;
}

export interface TransitionResult {
  allowed: boolean;
  nextStatus?: CampaignStatus;
  error?: string;
}

/**
 * Transitions permises dans la machine à états des cagnottes Charityy.
 */
const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["AWAITING_SIGNATURES"],
  AWAITING_SIGNATURES: ["COMMUNITY_VALIDATED", "SUSPENDED"],
  COMMUNITY_VALIDATED: ["ACTIVE", "IN_REVIEW", "SUSPENDED"],
  IN_REVIEW: ["CERTIFIED", "COMMUNITY_VALIDATED", "SUSPENDED"],
  CERTIFIED: ["ACTIVE", "SUSPENDED", "FROZEN"],
  ACTIVE: ["ENDED", "SUSPENDED", "FROZEN", "IN_REVIEW"],
  SUSPENDED: ["ACTIVE", "FROZEN", "CLOSED"],
  FROZEN: ["ACTIVE", "CLOSED"],
  ENDED: ["CLOSED"],
  CLOSED: [],
};

/**
 * Valide et applique une transition d'état sur une campagne.
 * Aucune transition n'est autorisée si les règles de confiance (KYC, 100 signatures) ne sont pas satisfaites.
 */
export function validateCampaignTransition(
  currentStatus: CampaignStatus,
  targetStatus: CampaignStatus,
  context: TransitionContext
): TransitionResult {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      error: `Transition interdite : impossible de passer de ${currentStatus} à ${targetStatus}`,
    };
  }

  // Règle 1 : Pour passer de DRAFT à AWAITING_SIGNATURES, le porteur de projet doit avoir un KYC validé
  if (currentStatus === "DRAFT" && targetStatus === "AWAITING_SIGNATURES") {
    if (!context.isKycApproved) {
      return {
        allowed: false,
        error: "L'identité du créateur (KYC) doit être vérifiée avant de lancer la collecte de signatures",
      };
    }
  }

  // Règle 2 : Pour passer à COMMUNITY_VALIDATED ou ACTIVE, il faut 100 signatures valides (ou dérogation médicale/urgence)
  if (
    currentStatus === "AWAITING_SIGNATURES" &&
    targetStatus === "COMMUNITY_VALIDATED"
  ) {
    const hasEnoughSignatures = context.validSignatureCount >= 100;
    const isExempted =
      context.hasMedicalOrEmergencyExemption &&
      ["VERIFIER", "ADMIN", "SUPER_ADMIN"].includes(context.actorRole);

    if (!hasEnoughSignatures && !isExempted) {
      return {
        allowed: false,
        error: `Seuil de signatures non atteint : ${context.validSignatureCount}/100 signatures requises`,
      };
    }
  }

  // Règle 3 : Seul le rôle VERIFIER, ADMIN ou SUPER_ADMIN peut approuver une certification
  if (targetStatus === "CERTIFIED") {
    if (!["VERIFIER", "ADMIN", "SUPER_ADMIN"].includes(context.actorRole)) {
      return {
        allowed: false,
        error: "Seul un vérificateur habilité peut certifier une campagne",
      };
    }
  }

  // Règle 4 : La suspension ou le gel exige un rôle de modération ou de finance avec motif
  if (targetStatus === "SUSPENDED" || targetStatus === "FROZEN") {
    if (
      !["MODERATOR", "FINANCE", "ADMIN", "SUPER_ADMIN"].includes(
        context.actorRole
      )
    ) {
      return {
        allowed: false,
        error: "Permission insuffisante pour suspendre ou geler une campagne",
      };
    }
    if (!context.reason) {
      return {
        allowed: false,
        error: "Un motif explicite est obligatoire pour suspendre ou geler des fonds",
      };
    }
  }

  return {
    allowed: true,
    nextStatus: targetStatus,
  };
}
