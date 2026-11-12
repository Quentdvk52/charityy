import { NextResponse } from "next/server";
import { z } from "zod";
import { MonerooClient } from "@/server/integrations/moneroo";
import { computeSplit } from "@/modules/payments/split";
import { getCampaignById } from "@/modules/campaigns/service";
import { formatCurrency } from "@/lib/currency";

const initPaymentSchema = z.object({
  amount: z.number().int().min(100, "Montant minimum : 100 FCFA"),
  currency: z.string().length(3).default("XOF"),
  purpose: z.enum(["DONATION", "WALLET_TOPUP", "CERTIFICATION", "GIFT"]).default("DONATION"),
  campaignId: z.string().optional(),
  customer: z
    .object({
      email: z.string().email().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  returnUrl: z.string().url().default("http://localhost:3000"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = initPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres de paiement invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, currency, purpose, campaignId, customer, returnUrl } = parsed.data;

    let description = "Rechargement du wallet solidaire Charityy";
    let creatorId: string | undefined;

    if (purpose === "DONATION" && campaignId) {
      const campaign = getCampaignById(campaignId);
      if (!campaign) {
        return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });
      }
      description = `Don solidaire : ${campaign.title}`;
      creatorId = campaign.authorId;
    }

    // Calcul transparent du split financier (Règles non négociables docs/06)
    const split = computeSplit({
      grossAmountMinor: BigInt(amount),
      processorFeeMinor: BigInt(Math.round(amount * 0.025)), // 2.5% Moneroo
      hasEligibleCreator: !!creatorId,
    });

    const moneroo = new MonerooClient();
    const result = await moneroo.initializePayment({
      amount,
      currency,
      description,
      customer,
      return_url: returnUrl,
      metadata: {
        purpose,
        campaignId,
        creatorId,
        grossAmount: amount.toString(),
        netBeneficiary: split.beneficiaryAmountMinor.toString(),
        platformFee: split.platformFeeMinor.toString(),
        creatorShare: split.creatorShareMinor.toString(),
      },
    });

    if (!result || !result.checkout_url) {
      return NextResponse.json(
        { error: "Échec de l'initialisation Moneroo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkout_url,
      paymentId: result.id,
      split: {
        gross: formatCurrency(split.grossAmountMinor, currency),
        processorFee: formatCurrency(split.processorFeeMinor, currency),
        platformFee: formatCurrency(split.platformFeeMinor, currency),
        creatorShare: formatCurrency(split.creatorShareMinor, currency),
        beneficiaryAmount: formatCurrency(split.beneficiaryAmountMinor, currency),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur lors du paiement." }, { status: 500 });
  }
}
