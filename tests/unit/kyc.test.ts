import { describe, it, expect } from "vitest";
import {
  createKycSubmission,
  getSecureKycDocumentUrl,
  reviewKycSubmission,
} from "@/modules/kyc/service";
import { decryptSensitive } from "@/lib/crypto";

describe("Module KYC & Sécurité Documentaire (Étape 1)", () => {
  const sampleInput = {
    userId: "usr_test_aicha",
    legalName: "Aïcha Traoré",
    idDocType: "NATIONAL_ID" as const,
    idDocNumber: "CI-2024-889900",
    idFrontKey: "kyc/usr_test_aicha/front_id.jpg",
    idBackKey: "kyc/usr_test_aicha/back_id.jpg",
  };

  it("chiffre le numéro de document avec AES-256-GCM lors de la soumission", () => {
    const submission = createKycSubmission(sampleInput);

    expect(submission.id).toBeDefined();
    expect(submission.status).toBe("PENDING");
    // Ne doit jamais être stocké en clair
    expect(submission.idDocNumberEnc).not.toBe(sampleInput.idDocNumber);

    // Déchiffrement réussi avec la clé symétrique
    const decrypted = decryptSensitive(submission.idDocNumberEnc);
    expect(decrypted).toBe(sampleInput.idDocNumber);
  });

  it("interdit la génération d'URL de visualisation à un rôle non habilité (anti-fuite)", () => {
    const submission = createKycSubmission(sampleInput);

    const unauthorizedResult = getSecureKycDocumentUrl({
      reviewerId: "usr_simple_user",
      reviewerRoles: ["USER"],
      submissionId: submission.id,
      documentKey: submission.idFrontKey,
    });

    expect(unauthorizedResult.success).toBe(false);
    expect(unauthorizedResult.error).toContain("Accès refusé");
  });

  it("autorise un rôle VERIFIER à obtenir une URL signée de 60 secondes", () => {
    const submission = createKycSubmission(sampleInput);

    const authorizedResult = getSecureKycDocumentUrl({
      reviewerId: "usr_verifier_1",
      reviewerRoles: ["VERIFIER"],
      submissionId: submission.id,
      documentKey: submission.idFrontKey,
    });

    expect(authorizedResult.success).toBe(true);
    expect(authorizedResult.url).toBeDefined();
    expect(authorizedResult.url).toContain("sig=");
    expect(authorizedResult.url).toContain("exp=");
  });

  it("permet la validation ou le rejet documenté par un vérificateur", () => {
    const submission = createKycSubmission(sampleInput);

    const reviewRes = reviewKycSubmission({
      reviewerId: "usr_verifier_1",
      reviewerRoles: ["VERIFIER"],
      submissionId: submission.id,
      approved: true,
    });

    expect(reviewRes.success).toBe(true);
    expect(reviewRes.submission?.status).toBe("APPROVED");
    expect(reviewRes.submission?.reviewedById).toBe("usr_verifier_1");
  });
});
