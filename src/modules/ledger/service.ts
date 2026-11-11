export type LedgerAccountType =
  | "USER_WALLET"
  | "CAMPAIGN_FUNDS"
  | "CREATOR_EARNINGS"
  | "PLATFORM_REVENUE"
  | "PAYMENT_FEES"
  | "PROCESSOR_CLEARING"
  | "RESERVE";

export interface LedgerEntryDraft {
  accountId: string;
  accountType: LedgerAccountType;
  ownerId?: string | null;
  direction: "DEBIT" | "CREDIT";
  amountMinor: bigint;
  currency: string;
}

export interface CreateTransactionDraft {
  idempotencyKey: string;
  kind: "DONATION" | "TOPUP" | "GIFT" | "FEE" | "PAYOUT" | "REFUND" | "ADJUSTMENT";
  paymentId?: string;
  payoutId?: string;
  description?: string;
  entries: LedgerEntryDraft[];
}

/**
 * Moteur de validation comptable en partie double.
 * Vérifie l'égalité stricte Débit = Crédit et l'absence de solde négatif.
 */
export function validateLedgerTransaction(draft: CreateTransactionDraft): void {
  if (!draft.entries || draft.entries.length < 2) {
    throw new Error("Une transaction de ledger doit comporter au moins 2 écritures");
  }

  // Regroupement par devise
  const balancesByCurrency: Record<string, { debits: bigint; credits: bigint }> = {};

  for (const entry of draft.entries) {
    if (entry.amountMinor <= 0n) {
      throw new Error("Chaque montant d'écriture doit être strictement positif");
    }

    if (!balancesByCurrency[entry.currency]) {
      balancesByCurrency[entry.currency] = { debits: 0n, credits: 0n };
    }

    const cur = balancesByCurrency[entry.currency]!;
    if (entry.direction === "DEBIT") {
      cur.debits += entry.amountMinor;
    } else if (entry.direction === "CREDIT") {
      cur.credits += entry.amountMinor;
    } else {
      throw new Error(`Direction d'écriture invalide : ${entry.direction}`);
    }
  }

  // Vérification de l'équilibre pour chaque devise impliquée
  for (const [currency, totals] of Object.entries(balancesByCurrency)) {
    if (totals.debits !== totals.credits) {
      throw new Error(
        `Déséquilibre comptable en partie double pour la devise ${currency} : Débits=${totals.debits}, Crédits=${totals.credits}`
      );
    }
  }
}

/**
 * Construit les écritures de ledger canoniques pour un don complété.
 * Exemple : Don brut 10 000 XOF, Frais Moneroo 300 XOF, Commission 291 XOF, Part créateur 200 XOF, Bénéficiaire 9 209 XOF.
 */
export function buildDonationLedgerEntries(params: {
  paymentId: string;
  campaignId: string;
  creatorId?: string | null;
  currency: string;
  grossAmountMinor: bigint;
  processorFeeMinor: bigint;
  platformFeeMinor: bigint;
  creatorShareMinor: bigint;
  beneficiaryAmountMinor: bigint;
}): CreateTransactionDraft {
  const {
    paymentId,
    campaignId,
    creatorId,
    currency,
    grossAmountMinor,
    processorFeeMinor,
    platformFeeMinor,
    creatorShareMinor,
    beneficiaryAmountMinor,
  } = params;

  const entries: LedgerEntryDraft[] = [
    // 1. Débit du compte de compensation Moneroo (argent encaissé)
    {
      accountId: `acc_proc_${currency}`,
      accountType: "PROCESSOR_CLEARING",
      direction: "DEBIT",
      amountMinor: grossAmountMinor,
      currency,
    },
    // 2. Crédit net au fonds de la campagne
    {
      accountId: `acc_camp_${campaignId}_${currency}`,
      accountType: "CAMPAIGN_FUNDS",
      ownerId: campaignId,
      direction: "CREDIT",
      amountMinor: beneficiaryAmountMinor,
      currency,
    },
    // 3. Frais de paiement processeur
    {
      accountId: `acc_fees_${currency}`,
      accountType: "PAYMENT_FEES",
      direction: "CREDIT",
      amountMinor: processorFeeMinor,
      currency,
    },
    // 4. Commission de la plateforme
    {
      accountId: `acc_platform_${currency}`,
      accountType: "PLATFORM_REVENUE",
      direction: "CREDIT",
      amountMinor: platformFeeMinor,
      currency,
    },
  ];

  // 5. Part créateur optionnelle
  if (creatorShareMinor > 0n) {
    entries.push({
      accountId: `acc_creator_${creatorId || "unassigned"}_${currency}`,
      accountType: "CREATOR_EARNINGS",
      ownerId: creatorId || null,
      direction: "CREDIT",
      amountMinor: creatorShareMinor,
      currency,
    });
  }

  const draft: CreateTransactionDraft = {
    idempotencyKey: `tx_donation_${paymentId}`,
    kind: "DONATION",
    paymentId,
    description: `Don pour la cagnotte ${campaignId}`,
    entries,
  };

  validateLedgerTransaction(draft);
  return draft;
}
