import { PLATFORM_DEFAULTS } from "../../lib/constants.ts";

export interface SplitInput {
  grossAmountMinor: bigint;
  processorFeeMinor: bigint;
  hasEligibleCreator?: boolean;
  platformRate?: number; // Défaut: 3%
  creatorRate?: number; // Défaut: 2%
}

export interface SplitResult {
  grossAmountMinor: bigint;
  processorFeeMinor: bigint;
  netAfterFeeMinor: bigint;
  platformFeeMinor: bigint;
  creatorShareMinor: bigint;
  beneficiaryAmountMinor: bigint;
}

/**
 * Calcule la répartition financière stricte d'un don conformément aux règles de Charityy.
 * Toutes les opérations sont en unités mineures (BigInt).
 *
 * Règle d'or : Somme(frais + plateforme + créateur + bénéficiaire) === montant brut.
 */
export function computeSplit(input: SplitInput): SplitResult {
  const {
    grossAmountMinor,
    processorFeeMinor,
    hasEligibleCreator = false,
    platformRate = PLATFORM_DEFAULTS.FEE_PLATFORM_RATE,
    creatorRate = PLATFORM_DEFAULTS.FEE_CREATOR_RATE,
  } = input;

  if (grossAmountMinor <= 0n) {
    throw new Error("Le montant brut doit être strictement positif");
  }

  if (processorFeeMinor < 0n || processorFeeMinor > grossAmountMinor) {
    throw new Error("Frais de paiement invalides ou supérieurs au montant brut");
  }

  // 1. Net après frais de processeur (Moneroo)
  const netAfterFeeMinor = grossAmountMinor - processorFeeMinor;

  // 2. Commission plateforme : 3% sur le net
  // Calcul précis : (net * rate_num) / rate_den avec arrondi entier
  const platformRateBasis = 10_000n; // 100% = 10 000
  const platformRatePoints = BigInt(Math.round(platformRate * 10_000));
  let platformFeeMinor = (netAfterFeeMinor * platformRatePoints) / platformRateBasis;

  // 3. Part créateur éligible : 2% sur l'activité apportée (assiette brute)
  let creatorShareMinor = 0n;
  if (hasEligibleCreator) {
    const creatorRatePoints = BigInt(Math.round(creatorRate * 10_000));
    creatorShareMinor = (grossAmountMinor * creatorRatePoints) / platformRateBasis;

    // Protection anti-marge négative : si creatorShare dépasse la marge plateforme,
    // on s'assure qu'elle ne détruit pas les fonds dus au bénéficiaire.
  }

  // 4. Montant revenant au bénéficiaire
  let beneficiaryAmountMinor =
    grossAmountMinor - processorFeeMinor - platformFeeMinor - creatorShareMinor;

  if (beneficiaryAmountMinor < 0n) {
    // Si la déduction dépasse le disponible, on réajuste pour ne pas débiter le bénéficiaire
    beneficiaryAmountMinor = 0n;
    creatorShareMinor = 0n;
    platformFeeMinor = netAfterFeeMinor;
  }

  // 5. Règle d'intégrité comptable : somme exacte
  const totalAllocated =
    processorFeeMinor + platformFeeMinor + creatorShareMinor + beneficiaryAmountMinor;
  const discrepancy = grossAmountMinor - totalAllocated;

  if (discrepancy !== 0n) {
    // Tout résidu d'arrondi est attribué à la plateforme
    platformFeeMinor += discrepancy;
  }

  return {
    grossAmountMinor,
    processorFeeMinor,
    netAfterFeeMinor,
    platformFeeMinor,
    creatorShareMinor,
    beneficiaryAmountMinor,
  };
}
