export interface PayoutRequestItem {
  id: string;
  userId: string;
  beneficiaryName: string;
  amountMinor: bigint;
  currency: string;
  phoneOrAccount: string;
  method: "MOBILE_MONEY" | "BANK_TRANSFER";
  status: "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "PAID" | "REJECTED";
  firstApproverId?: string | null;
  firstApprovedAt?: Date | null;
  secondApproverId?: string | null;
  secondApprovedAt?: Date | null;
  createdAt: Date;
}

// Magasin en mémoire pour les demandes de retraits
export const memoryPayouts: PayoutRequestItem[] = [];

// Seuil de double approbation obligatoire (1 000 000 FCFA)
export const DOUBLE_APPROVAL_THRESHOLD_XOF = 1_000_000n;
