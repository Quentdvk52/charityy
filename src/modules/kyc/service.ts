import { encryptSensitive } from "@/lib/crypto";
import { R2StorageClient } from "@/server/integrations/r2";
import { logAudit } from "@/server/security/audit";
import { hasPermission } from "@/server/auth/permissions";

export type KycDocType = "NATIONAL_ID" | "PASSPORT" | "RESIDENCE_PERMIT" | "DRIVING_LICENSE";
export type KycStatus = "NONE" | "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface KycSubmissionInput {
  userId: string;
  legalName: string;
  birthDate?: Date | null;
  idDocType: KycDocType;
  idDocNumber: string; // Chiffré avant enregistrement
  idFrontKey: string;
  idBackKey?: string | null;
  selfieKey?: string | null;
}

export interface KycRecord {
  id: string;
  userId: string;
  status: KycStatus;
  legalName: string;
  birthDate?: Date | null;
  idDocType: KycDocType;
  idDocNumberEnc: string;
  idFrontKey: string;
  idBackKey?: string | null;
  selfieKey?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  rejectionNote?: string | null;
  createdAt: Date;
}

// Magasin de données pour les dossiers KYC (couplable à Prisma)
const memoryKycStore = new Map<string, KycRecord>();

const r2Client = new R2StorageClient();

/**
 * Crée un dossier de soumission KYC avec chiffrement symétrique immédiat du numéro de pièce.
 */
export function createKycSubmission(input: KycSubmissionInput): KycRecord {
  const id = `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idDocNumberEnc = encryptSensitive(input.idDocNumber);

  const record: KycRecord = {
    id,
    userId: input.userId,
    status: "PENDING",
    legalName: input.legalName,
    birthDate: input.birthDate,
    idDocType: input.idDocType,
    idDocNumberEnc,
    idFrontKey: input.idFrontKey,
    idBackKey: input.idBackKey,
    selfieKey: input.selfieKey,
    createdAt: new Date(),
  };

  memoryKycStore.set(id, record);

  logAudit({
    actorId: input.userId,
    action: "kyc:submitted",
    targetType: "KycSubmission",
    targetId: id,
    meta: { idDocType: input.idDocType },
  });

  return record;
}

/**
 * Génère une URL présignée de 60 secondes pour consulter une pièce d'identité sécurisée.
 * RÈGLE STRICTE : Réservé aux rôles avec permission "kyc:view_sensitive" et audité obligatoirement.
 */
export function getSecureKycDocumentUrl(params: {
  reviewerId: string;
  reviewerRoles: string[];
  submissionId: string;
  documentKey: string;
  clientIp?: string;
}): { success: boolean; url?: string; error?: string } {
  const { reviewerId, reviewerRoles, submissionId, documentKey, clientIp } = params;

  // Contrôle RBAC strict
  const canView = reviewerRoles.some((role) =>
    hasPermission(role as any, "kyc:view_sensitive")
  );

  if (!canView) {
    logAudit({
      actorId: reviewerId,
      action: "kyc:unauthorized_view_attempt",
      targetType: "KycSubmission",
      targetId: submissionId,
      clientIp,
    });
    return {
      success: false,
      error: "Accès refusé : vous n'avez pas l'habilitation nécessaire pour consulter les pièces d'identité.",
    };
  }

  // Vérification que le document appartient bien à la soumission
  const submission = memoryKycStore.get(submissionId);
  if (!submission) {
    return { success: false, error: "Dossier KYC introuvable." };
  }

  const validKeys = [submission.idFrontKey, submission.idBackKey, submission.selfieKey].filter(
    Boolean
  );
  if (!validKeys.includes(documentKey)) {
    return { success: false, error: "Document non rattaché à ce dossier." };
  }

  // Génération de l'URL éphémère (60 secondes)
  const presigned = r2Client.generatePresignedDownloadUrl({
    key: documentKey,
    isPrivate: true,
  });

  // Journalisation d'audit obligatoire
  logAudit({
    actorId: reviewerId,
    action: "kyc:document_viewed",
    targetType: "KycSubmission",
    targetId: submissionId,
    clientIp,
    meta: { documentKey },
  });

  return { success: true, url: presigned.url };
}

/**
 * Revue d'un dossier KYC (Approbation ou Rejet avec motif).
 */
export function reviewKycSubmission(params: {
  reviewerId: string;
  reviewerRoles: string[];
  submissionId: string;
  approved: boolean;
  rejectionNote?: string;
  clientIp?: string;
}): { success: boolean; submission?: KycRecord; error?: string } {
  const { reviewerId, reviewerRoles, submissionId, approved, rejectionNote, clientIp } = params;

  const canReview = reviewerRoles.some((role) =>
    hasPermission(role as any, "kyc:review")
  );

  if (!canReview) {
    return { success: false, error: "Action non autorisée pour vos rôles." };
  }

  const submission = memoryKycStore.get(submissionId);
  if (!submission) {
    return { success: false, error: "Dossier KYC introuvable." };
  }

  submission.status = approved ? "APPROVED" : "REJECTED";
  submission.reviewedById = reviewerId;
  submission.reviewedAt = new Date();
  if (!approved && rejectionNote) {
    submission.rejectionNote = rejectionNote;
  }

  logAudit({
    actorId: reviewerId,
    action: approved ? "kyc:approved" : "kyc:rejected",
    targetType: "KycSubmission",
    targetId: submissionId,
    clientIp,
    meta: { approved, rejectionNote },
  });

  return { success: true, submission };
}
