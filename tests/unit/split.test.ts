import { describe, it, expect } from "vitest";
import { computeSplit } from "@/modules/payments/split";

describe("Moteur financier : computeSplit()", () => {
  it("calcule correctement la ventilation pour un don standard de 10 000 XOF", () => {
    // 10 000 XOF, frais processeur 300 XOF, pas de créateur
    const result = computeSplit({
      grossAmountMinor: 10_000n,
      processorFeeMinor: 300n,
      hasEligibleCreator: false,
    });

    expect(result.grossAmountMinor).toBe(10_000n);
    expect(result.processorFeeMinor).toBe(300n);
    expect(result.netAfterFeeMinor).toBe(9_700n);

    // Commission plateforme 3% de 9 700 = 291 XOF
    expect(result.platformFeeMinor).toBe(291n);
    expect(result.creatorShareMinor).toBe(0n);

    // Montant bénéficiaire = 10 000 - 300 - 291 = 9 409 XOF
    expect(result.beneficiaryAmountMinor).toBe(9_409n);

    // Vérification de conservation totale
    const total =
      result.processorFeeMinor +
      result.platformFeeMinor +
      result.creatorShareMinor +
      result.beneficiaryAmountMinor;
    expect(total).toBe(10_000n);
  });

  it("intègre la rémunération créateur de 2% sur don apporté", () => {
    // 10 000 XOF, frais 300 XOF, créateur apporteur éligible (2% du brut = 200 XOF)
    const result = computeSplit({
      grossAmountMinor: 10_000n,
      processorFeeMinor: 300n,
      hasEligibleCreator: true,
    });

    expect(result.creatorShareMinor).toBe(200n);
    expect(result.platformFeeMinor).toBe(291n);
    // Bénéficiaire = 10 000 - 300 - 291 - 200 = 9 209 XOF
    expect(result.beneficiaryAmountMinor).toBe(9_209n);

    const total =
      result.processorFeeMinor +
      result.platformFeeMinor +
      result.creatorShareMinor +
      result.beneficiaryAmountMinor;
    expect(total).toBe(10_000n);
  });

  it("gère les devises à 2 décimales (ex: 50.00 USD = 5000 cents)", () => {
    const result = computeSplit({
      grossAmountMinor: 5_000n,
      processorFeeMinor: 150n,
      hasEligibleCreator: false,
    });

    expect(result.netAfterFeeMinor).toBe(4_850n);
    // 3% de 4 850 = 145.5 -> division entière BigInt = 145n
    expect(result.platformFeeMinor).toBe(145n);

    const total =
      result.processorFeeMinor +
      result.platformFeeMinor +
      result.creatorShareMinor +
      result.beneficiaryAmountMinor;
    expect(total).toBe(5_000n);
  });

  it("rejette un montant négatif ou nul", () => {
    expect(() =>
      computeSplit({
        grossAmountMinor: 0n,
        processorFeeMinor: 0n,
      })
    ).toThrow("Le montant brut doit être strictement positif");
  });
});
