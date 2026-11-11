import test from "node:test";
import assert from "node:assert/strict";

// 1. Test computeSplit
import { computeSplit } from "../src/modules/payments/split.ts";

test("computeSplit: Don de 10 000 XOF", () => {
  const result = computeSplit({
    grossAmountMinor: 10_000n,
    processorFeeMinor: 300n,
    hasEligibleCreator: false,
  });

  assert.equal(result.grossAmountMinor, 10_000n);
  assert.equal(result.processorFeeMinor, 300n);
  assert.equal(result.netAfterFeeMinor, 9_700n);
  assert.equal(result.platformFeeMinor, 291n);
  assert.equal(result.beneficiaryAmountMinor, 9_409n);

  const total =
    result.processorFeeMinor +
    result.platformFeeMinor +
    result.creatorShareMinor +
    result.beneficiaryAmountMinor;
  assert.equal(total, 10_000n);
});

test("computeSplit: Don avec 2% créateur éligible", () => {
  const result = computeSplit({
    grossAmountMinor: 10_000n,
    processorFeeMinor: 300n,
    hasEligibleCreator: true,
  });

  assert.equal(result.creatorShareMinor, 200n);
  assert.equal(result.platformFeeMinor, 291n);
  assert.equal(result.beneficiaryAmountMinor, 9_209n);

  const total =
    result.processorFeeMinor +
    result.platformFeeMinor +
    result.creatorShareMinor +
    result.beneficiaryAmountMinor;
  assert.equal(total, 10_000n);
});

// 2. Test validateCampaignTransition
import { validateCampaignTransition } from "../src/modules/campaigns/state-machine.ts";

test("stateMachine: Interdiction sans KYC", () => {
  const res = validateCampaignTransition("DRAFT", "AWAITING_SIGNATURES", {
    validSignatureCount: 0,
    isKycApproved: false,
    actorRole: "USER",
  });
  assert.equal(res.allowed, false);
});

test("stateMachine: Validation à 100 signatures", () => {
  const res = validateCampaignTransition("AWAITING_SIGNATURES", "COMMUNITY_VALIDATED", {
    validSignatureCount: 100,
    isKycApproved: true,
    actorRole: "USER",
  });
  assert.equal(res.allowed, true);
  assert.equal(res.nextStatus, "COMMUNITY_VALIDATED");
});

// 3. Test validateLedgerTransaction
import { validateLedgerTransaction, buildDonationLedgerEntries } from "../src/modules/ledger/service.ts";

test("ledger: Équilibre Débit = Crédit", () => {
  const tx = buildDonationLedgerEntries({
    paymentId: "pay_test_01",
    campaignId: "camp_test_01",
    creatorId: "creator_amadou",
    currency: "XOF",
    grossAmountMinor: 10_000n,
    processorFeeMinor: 300n,
    platformFeeMinor: 291n,
    creatorShareMinor: 200n,
    beneficiaryAmountMinor: 9_209n,
  });

  assert.doesNotThrow(() => validateLedgerTransaction(tx));
});

// 4. Test Permissions
import { hasPermission } from "../src/server/auth/permissions.ts";

test("permissions: Refus par défaut pour USER", () => {
  assert.equal(hasPermission(["USER"], "campaign:sign"), true);
  assert.equal(hasPermission(["USER"], "kyc:view_sensitive"), false);
  assert.equal(hasPermission(["VERIFIER"], "kyc:view_sensitive"), true);
  assert.equal(hasPermission(["FINANCE"], "payout:review"), true);
});

// 5. Test Crypto
import { encryptSensitive, decryptSensitive, hashWithPepper } from "../src/lib/crypto.ts";

test("crypto: Chiffrement et déchiffrement AES-256-GCM", () => {
  const secretId = "NUM-PASSPORT-SN-87654";
  const encrypted = encryptSensitive(secretId);
  assert.notEqual(encrypted, secretId);
  const decrypted = decryptSensitive(encrypted);
  assert.equal(decrypted, secretId);
});

test("crypto: Hachage IP sécurisé", () => {
  const ip = "41.202.219.10";
  const h1 = hashWithPepper(ip);
  const h2 = hashWithPepper(ip);
  assert.equal(h1, h2);
  assert.equal(h1.length, 64);
});
