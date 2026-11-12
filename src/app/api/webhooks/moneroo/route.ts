import { NextResponse } from "next/server";
import { MonerooClient } from "@/server/integrations/moneroo";
import { buildDonationLedgerEntries } from "@/modules/ledger/service";
import { getCampaignById } from "@/modules/campaigns/service";
import { logAudit } from "@/server/security/audit";

// Registre d'idempotence des événements webhooks traités (anti double-crédit)
const processedEvents = new Set<string>();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-moneroo-signature") || "";

    const moneroo = new MonerooClient();

    // 1. Vérification cryptographique HMAC-SHA256 en temps constant
    const isValidSignature = moneroo.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      logAudit({
        action: "security:moneroo_webhook_invalid_signature",
        targetType: "Webhook",
        clientIp: request.headers.get("x-forwarded-for") || undefined,
      });
      return NextResponse.json({ error: "Signature HMAC invalide" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;

    // 2. Protection stricte contre le rejeu (Idempotence)
    if (processedEvents.has(eventId)) {
      return NextResponse.json({ success: true, message: "Événement déjà traité (idempotent)" });
    }

    const eventType = payload.event; // "payment.success"
    const paymentData = payload.data || {};
    const paymentId = paymentData.id;

    if (eventType === "payment.success" && paymentId) {
      // 3. Re-vérification obligatoire auprès de l'API Moneroo côté serveur
      const verification = await moneroo.verifyPayment(paymentId);
      if (!verification.success || verification.status !== "success") {
        return NextResponse.json(
          { error: "Vérification auprès de Moneroo non confirmée" },
          { status: 400 }
        );
      }

      const meta = paymentData.metadata || {};
      const campaignId = meta.campaignId;
      const creatorId = meta.creatorId;
      const currency = paymentData.currency || "XOF";
      const grossAmountMinor = BigInt(paymentData.amount || 0);

      // Calcul des frais
      const processorFeeMinor = BigInt(Math.round(Number(grossAmountMinor) * 0.025));
      const netAfterFee = grossAmountMinor - processorFeeMinor;
      const platformFeeMinor = (netAfterFee * 3n) / 100n;
      const creatorShareMinor = creatorId ? (netAfterFee * 2n) / 100n : 0n;
      const beneficiaryAmountMinor = netAfterFee - platformFeeMinor - creatorShareMinor;

      // 4. Écriture comptable dans le ledger en partie double
      if (campaignId) {
        const ledgerTransaction = buildDonationLedgerEntries({
          paymentId,
          campaignId,
          creatorId,
          currency,
          grossAmountMinor,
          processorFeeMinor,
          platformFeeMinor,
          creatorShareMinor,
          beneficiaryAmountMinor,
        });

        // Mise à jour du montant collecté de la cagnotte
        const campaign = getCampaignById(campaignId);
        if (campaign) {
          campaign.collectedMinor += grossAmountMinor;
        }

        logAudit({
          action: "payment:donation_credited_ledger",
          targetType: "Campaign",
          targetId: campaignId,
          meta: {
            paymentId,
            grossAmountMinor: grossAmountMinor.toString(),
            ledgerKey: ledgerTransaction.idempotencyKey,
          },
        });
      }
    }

    processedEvents.add(eventId);
    return NextResponse.json({ success: true, processed: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de traitement webhook" }, { status: 500 });
  }
}
