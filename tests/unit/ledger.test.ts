import { describe, it, expect } from "vitest";
import {
  validateLedgerTransaction,
  buildDonationLedgerEntries,
} from "@/modules/ledger/service";

describe("Moteur de ledger en partie double", () => {
  it("valide une transaction parfaitement équilibrée", () => {
    expect(() =>
      validateLedgerTransaction({
        idempotencyKey: "test_tx_1",
        kind: "DONATION",
        entries: [
          {
            accountId: "acc_proc",
            accountType: "PROCESSOR_CLEARING",
            direction: "DEBIT",
            amountMinor: 5000n,
            currency: "XOF",
          },
          {
            accountId: "acc_camp",
            accountType: "CAMPAIGN_FUNDS",
            direction: "CREDIT",
            amountMinor: 4850n,
            currency: "XOF",
          },
          {
            accountId: "acc_fee",
            accountType: "PLATFORM_REVENUE",
            direction: "CREDIT",
            amountMinor: 150n,
            currency: "XOF",
          },
        ],
      })
    ).not.toThrow();
  });

  it("rejette une transaction déséquilibrée (Débit !== Crédit)", () => {
    expect(() =>
      validateLedgerTransaction({
        idempotencyKey: "test_tx_bad",
        kind: "DONATION",
        entries: [
          {
            accountId: "acc_proc",
            accountType: "PROCESSOR_CLEARING",
            direction: "DEBIT",
            amountMinor: 5000n,
            currency: "XOF",
          },
          {
            accountId: "acc_camp",
            accountType: "CAMPAIGN_FUNDS",
            direction: "CREDIT",
            amountMinor: 4900n, // Manque 100
            currency: "XOF",
          },
        ],
      })
    ).toThrow("Déséquilibre comptable");
  });

  it("construit des écritures canoniques de don équilibrées", () => {
    const tx = buildDonationLedgerEntries({
      paymentId: "pay_123",
      campaignId: "camp_456",
      creatorId: "creator_789",
      currency: "XOF",
      grossAmountMinor: 10_000n,
      processorFeeMinor: 300n,
      platformFeeMinor: 291n,
      creatorShareMinor: 200n,
      beneficiaryAmountMinor: 9_209n,
    });

    expect(tx.entries.length).toBe(5);
    expect(() => validateLedgerTransaction(tx)).not.toThrow();
  });
});
