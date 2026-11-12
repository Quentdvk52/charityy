import { describe, it, expect } from "vitest";
import {
  createCampaign,
  signCampaign,
  getCampaignById,
} from "@/modules/campaigns/service";

describe("Module Cagnottes & Signatures (Étape 3)", () => {
  it("crée une cagnotte en DRAFT si le créateur n'a pas de KYC approuvé", () => {
    const campaign = createCampaign({
      authorId: "usr_novice",
      authorName: "Jean Paul",
      title: "Financement études secondaires",
      story: "Aide pour payer les frais d'inscription et fournitures.",
      category: "EDUCATION",
      goalMinor: 500_000n,
      city: "Yamoussoukro",
      countryCode: "CI",
      isKycApproved: false,
    });

    expect(campaign.status).toBe("DRAFT");
  });

  it("crée une cagnotte en AWAITING_SIGNATURES si le créateur est vérifié KYC", () => {
    const campaign = createCampaign({
      authorId: "usr_diallo",
      authorName: "Dr. Diallo",
      title: "Équipement dispensaire rural",
      story: "Achat de concentrateurs d'oxygène pour le centre de santé.",
      category: "SANTE",
      goalMinor: 2_500_000n,
      city: "Bouaké",
      countryCode: "CI",
      isKycApproved: true,
    });

    expect(campaign.status).toBe("AWAITING_SIGNATURES");
  });

  it("refuse qu'un même utilisateur signe deux fois la même campagne", () => {
    const campaign = createCampaign({
      authorId: "usr_diallo",
      authorName: "Dr. Diallo",
      title: "Test multi-signature",
      story: "Description test.",
      category: "SANTE",
      goalMinor: 1_000_000n,
      city: "Abidjan",
      countryCode: "CI",
      isKycApproved: true,
    });

    // Première signature
    const res1 = signCampaign({
      campaignId: campaign.id,
      signerId: "signer_unique_1",
      kind: "COMMUNITY",
    });
    expect(res1.success).toBe(true);

    // Seconde tentative par le même compte
    const res2 = signCampaign({
      campaignId: campaign.id,
      signerId: "signer_unique_1",
      kind: "COMMUNITY",
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("déjà apporté votre signature");
  });

  it("fait basculer la campagne en ACTIVE dès l'atteinte des 100 signatures", () => {
    const campaign = createCampaign({
      authorId: "usr_verified",
      authorName: "Koffi",
      title: "Rénovation maternité",
      story: "Rénovation complète.",
      category: "SANTE",
      goalMinor: 3_000_000n,
      city: "Korhogo",
      countryCode: "CI",
      isKycApproved: true,
    });

    // Injection de 99 signatures
    for (let i = 0; i < 99; i++) {
      signCampaign({
        campaignId: campaign.id,
        signerId: `signer_bulk_${i}`,
        kind: "COMMUNITY",
      });
    }

    expect(campaign.status).toBe("AWAITING_SIGNATURES");

    // 100ème signature -> Déclenchement automatique de validation communautaire
    const res100 = signCampaign({
      campaignId: campaign.id,
      signerId: "signer_bulk_100",
      kind: "COMMUNITY",
    });

    expect(res100.success).toBe(true);
    expect(res100.campaignStatus).toBe("ACTIVE");
    expect(campaign.status).toBe("ACTIVE");
  });
});
