import { CampaignStatus, validateCampaignTransition } from "./state-machine";
import { computeSignatureProgress, SignatureRecord, SignerKind } from "@/modules/signatures/service";
import { hashWithPepper } from "@/lib/crypto";
import { logAudit } from "@/server/security/audit";

export interface CampaignItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  title: string;
  story: string;
  category: string;
  goalMinor: bigint;
  currency: string;
  collectedMinor: bigint;
  status: CampaignStatus;
  city: string;
  countryCode: string;
  isCertified: boolean;
  isUrgent: boolean;
  signatures: SignatureRecord[];
  createdAt: Date;
}

export interface CreateCampaignInput {
  authorId: string;
  authorName: string;
  authorRole?: string;
  title: string;
  story: string;
  category: string;
  goalMinor: bigint;
  currency?: string;
  city: string;
  countryCode: string;
  isUrgent?: boolean;
  isKycApproved: boolean;
}

// Magasin de données pour les cagnottes
const memoryCampaigns: CampaignItem[] = [
  {
    id: "camp_diallo_aminata",
    authorId: "usr_diallo",
    authorName: "Dr. Mamadou Diallo",
    authorRole: "Chirurgien pédiatrique (Personne Ressource Vérifiée)",
    title: "Urgence médicale : Soins chirurgicaux pédiatriques pour Aminata",
    story:
      "Aminata, 6 ans, souffre d'une cardiopathie congénitale nécessitant une intervention chirurgicale urgente. Devis hospitalier et examens vérifiés par l'équipe Charityy.",
    category: "SANTE_URGENCE",
    goalMinor: 5_000_000n, // 5 000 000 FCFA
    currency: "XOF",
    collectedMinor: 3_450_000n,
    status: "ACTIVE",
    city: "Abidjan",
    countryCode: "CI",
    isCertified: true,
    isUrgent: true,
    signatures: Array.from({ length: 82 }, (_, i) => ({
      id: `sig_${i}`,
      campaignId: "camp_diallo_aminata",
      signerId: `user_${i}`,
      kind: (i < 35 ? "RELATIVE" : i < 60 ? "RESOURCE_PERSON" : "COMMUNITY") as SignerKind,
      createdAt: new Date(),
    })),
    createdAt: new Date(),
  },
  {
    id: "camp_senegal_ecole",
    authorId: "usr_fatou",
    authorName: "Fatou Sow",
    title: "Une école pour Ndande",
    story: "Rénovation de 3 classes et don de fournitures scolaires pour 150 enfants.",
    category: "EDUCATION",
    goalMinor: 2_000_000n,
    currency: "XOF",
    collectedMinor: 750_000n,
    status: "ACTIVE",
    city: "Dakar",
    countryCode: "SN",
    isCertified: false,
    isUrgent: false,
    signatures: Array.from({ length: 104 }, (_, i) => ({
      id: `sig_sn_${i}`,
      campaignId: "camp_senegal_ecole",
      signerId: `user_sn_${i}`,
      kind: "COMMUNITY" as SignerKind,
      createdAt: new Date(),
    })),
    createdAt: new Date(),
  },
];

export function getAllCampaigns(): CampaignItem[] {
  return memoryCampaigns;
}

export function getCampaignById(id: string): CampaignItem | undefined {
  return memoryCampaigns.find((c) => c.id === id);
}

/**
 * Création guidée d'une cagnotte solidaire
 */
export function createCampaign(input: CreateCampaignInput): CampaignItem {
  const id = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // État initial : DRAFT ou AWAITING_SIGNATURES si KYC approuvé
  const initialStatus: CampaignStatus = input.isKycApproved
    ? "AWAITING_SIGNATURES"
    : "DRAFT";

  const campaign: CampaignItem = {
    id,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    title: input.title,
    story: input.story,
    category: input.category,
    goalMinor: input.goalMinor,
    currency: input.currency || "XOF",
    collectedMinor: 0n,
    status: initialStatus,
    city: input.city,
    countryCode: input.countryCode,
    isCertified: false,
    isUrgent: !!input.isUrgent,
    signatures: [],
    createdAt: new Date(),
  };

  memoryCampaigns.push(campaign);

  logAudit({
    actorId: input.authorId,
    action: "campaign:created",
    targetType: "Campaign",
    targetId: id,
    meta: { title: input.title, initialStatus },
  });

  return campaign;
}

/**
 * Signature citoyenne avec anti-fraude (un vote par utilisateur, hash d'appareil et IP)
 */
export function signCampaign(params: {
  campaignId: string;
  signerId: string;
  kind: SignerKind;
  comment?: string;
  deviceId?: string;
  clientIp?: string;
}): { success: boolean; progress?: any; campaignStatus?: CampaignStatus; error?: string } {
  const campaign = getCampaignById(params.campaignId);
  if (!campaign) {
    return { success: false, error: "Cagnotte introuvable" };
  }

  // 1. Vérification d'unicité de signature par compte
  const alreadySigned = campaign.signatures.some((s) => s.signerId === params.signerId);
  if (alreadySigned) {
    return { success: false, error: "Vous avez déjà apporté votre signature à cette cause." };
  }

  // 2. Calcul des empreintes anti-sybil avec poivre secret
  const deviceHash = params.deviceId ? hashWithPepper(params.deviceId) : null;
  const ipHash = params.clientIp ? hashWithPepper(params.clientIp) : null;

  // Détection de grappes d'appareils suspects
  if (deviceHash) {
    const deviceCount = campaign.signatures.filter((s) => s.deviceHash === deviceHash).length;
    if (deviceCount >= 3) {
      logAudit({
        actorId: params.signerId,
        action: "signature:suspected_sybil_device",
        targetType: "Campaign",
        targetId: params.campaignId,
        meta: { deviceHash, count: deviceCount + 1 },
      });
      return {
        success: false,
        error: "Un nombre trop élevé de signatures provient de cet appareil. Vérification requise.",
      };
    }
  }

  const newSignature: SignatureRecord = {
    id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    campaignId: params.campaignId,
    signerId: params.signerId,
    kind: params.kind,
    comment: params.comment || null,
    deviceHash,
    ipHash,
    createdAt: new Date(),
  };

  campaign.signatures.push(newSignature);

  // 3. Calcul de la progression
  const progress = computeSignatureProgress(campaign.signatures);

  // 4. Passage automatique vers COMMUNITY_VALIDATED puis ACTIVE dès le seuil de 100 signatures
  if (campaign.status === "AWAITING_SIGNATURES" && progress.totalValid >= 100) {
    const transition = validateCampaignTransition(
      campaign.status,
      "COMMUNITY_VALIDATED",
      {
        validSignatureCount: progress.totalValid,
        isKycApproved: true,
        actorRole: "SYSTEM",
      }
    );

    if (transition.allowed) {
      campaign.status = "COMMUNITY_VALIDATED";
      logAudit({
        action: "campaign:community_validated_auto",
        targetType: "Campaign",
        targetId: campaign.id,
        meta: { signaturesCount: progress.totalValid },
      });

      // Activation immédiate pour recevoir des dons
      campaign.status = "ACTIVE";
    }
  }

  return {
    success: true,
    progress,
    campaignStatus: campaign.status,
  };
}
