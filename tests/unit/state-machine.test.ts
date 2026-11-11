import { describe, it, expect } from "vitest";
import { validateCampaignTransition } from "@/modules/campaigns/state-machine";

describe("Machine à états des cagnottes Charityy", () => {
  it("interdit de passer à AWAITING_SIGNATURES sans KYC vérifié", () => {
    const result = validateCampaignTransition("DRAFT", "AWAITING_SIGNATURES", {
      validSignatureCount: 0,
      isKycApproved: false,
      actorRole: "USER",
    });

    expect(result.allowed).toBe(false);
    expect(result.error).toContain("KYC");
  });

  it("autorise AWAITING_SIGNATURES si le KYC est approuvé", () => {
    const result = validateCampaignTransition("DRAFT", "AWAITING_SIGNATURES", {
      validSignatureCount: 0,
      isKycApproved: true,
      actorRole: "CREATOR",
    });

    expect(result.allowed).toBe(true);
    expect(result.nextStatus).toBe("AWAITING_SIGNATURES");
  });

  it("bloque la validation communautaire si moins de 100 signatures", () => {
    const result = validateCampaignTransition(
      "AWAITING_SIGNATURES",
      "COMMUNITY_VALIDATED",
      {
        validSignatureCount: 99,
        isKycApproved: true,
        actorRole: "USER",
      }
    );

    expect(result.allowed).toBe(false);
    expect(result.error).toContain("99/100");
  });

  it("autorise la validation communautaire dès 100 signatures valides", () => {
    const result = validateCampaignTransition(
      "AWAITING_SIGNATURES",
      "COMMUNITY_VALIDATED",
      {
        validSignatureCount: 100,
        isKycApproved: true,
        actorRole: "USER",
      }
    );

    expect(result.allowed).toBe(true);
    expect(result.nextStatus).toBe("COMMUNITY_VALIDATED");
  });

  it("autorise une dérogation d'urgence médicale par un administrateur", () => {
    const result = validateCampaignTransition(
      "AWAITING_SIGNATURES",
      "COMMUNITY_VALIDATED",
      {
        validSignatureCount: 15,
        isKycApproved: true,
        hasMedicalOrEmergencyExemption: true,
        actorRole: "ADMIN",
      }
    );

    expect(result.allowed).toBe(true);
  });

  it("refuse la certification par un rôle non habilité (ex: USER)", () => {
    const result = validateCampaignTransition("IN_REVIEW", "CERTIFIED", {
      validSignatureCount: 100,
      isKycApproved: true,
      actorRole: "USER",
    });

    expect(result.allowed).toBe(false);
    expect(result.error).toContain("vérificateur");
  });
});
