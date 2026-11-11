import { PLATFORM_DEFAULTS } from "../../lib/constants.ts";

export type SignerKind = "RELATIVE" | "RESOURCE_PERSON" | "COMMUNITY";

export interface SignatureRecord {
  id: string;
  campaignId: string;
  signerId: string;
  kind: SignerKind;
  relation?: string | null;
  comment?: string | null;
  deviceHash?: string | null;
  ipHash?: string | null;
  verifiedAt?: Date | null;
  invalidatedAt?: Date | null;
  createdAt: Date;
}

export interface SignatureProgress {
  totalValid: number;
  targetTotal: number;
  relativeCount: number;
  resourcePersonCount: number;
  communityCount: number;
  isCompleted: boolean;
  percentage: number;
}

/**
 * Calcule la progression détaillée des 100 signatures d'une campagne.
 */
export function computeSignatureProgress(
  signatures: SignatureRecord[],
  targetTotal = PLATFORM_DEFAULTS.SIGNATURE_TARGET_TOTAL
): SignatureProgress {
  const validSignatures = signatures.filter((s) => !s.invalidatedAt);

  let relativeCount = 0;
  let resourcePersonCount = 0;
  let communityCount = 0;

  for (const sig of validSignatures) {
    if (sig.kind === "RELATIVE") relativeCount++;
    else if (sig.kind === "RESOURCE_PERSON") resourcePersonCount++;
    else if (sig.kind === "COMMUNITY") communityCount++;
  }

  const totalValid = validSignatures.length;
  const isCompleted = totalValid >= targetTotal;
  const percentage = Math.min(100, Math.round((totalValid / targetTotal) * 100));

  return {
    totalValid,
    targetTotal,
    relativeCount,
    resourcePersonCount,
    communityCount,
    isCompleted,
    percentage,
  };
}

/**
 * Détecte les anomalies et risques de signatures frauduleuses (ex: même appareil, rafale).
 */
export function detectSuspiciousSignatures(
  signatures: SignatureRecord[]
): { suspiciousIds: string[]; reason: string }[] {
  const alerts: { suspiciousIds: string[]; reason: string }[] = [];

  // 1. Détection par empreinte d'appareil (deviceHash)
  const deviceMap: Record<string, string[]> = {};
  for (const s of signatures) {
    if (s.deviceHash) {
      if (!deviceMap[s.deviceHash]) deviceMap[s.deviceHash] = [];
      deviceMap[s.deviceHash]!.push(s.id);
    }
  }

  for (const [deviceHash, ids] of Object.entries(deviceMap)) {
    if (ids.length > 2) {
      alerts.push({
        suspiciousIds: ids,
        reason: `Même appareil utilisé pour ${ids.length} signatures distinctes (${deviceHash.substring(0, 8)}...)`,
      });
    }
  }

  return alerts;
}
