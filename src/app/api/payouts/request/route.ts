import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { logAudit } from "@/server/security/audit";

export interface PayoutRequestItem {
  id: string;
  userId: string;
  beneficiaryName: string;
  amountMinor: bigint;
  currency: string;
  phoneOrAccount: string;
  method: "MOBILE_MONEY" | "BANK_TRANSFER";
  status: "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "PAID" | "REJECTED";
  firstApproverId?: string | null;
  firstApprovedAt?: Date | null;
  secondApproverId?: string | null;
  secondApprovedAt?: Date | null;
  createdAt: Date;
}

export const memoryPayouts: PayoutRequestItem[] = [];

const payoutSchema = z.object({
  amount: z.number().int().positive("Montant de retrait invalide"),
  currency: z.string().length(3).default("XOF"),
  phoneOrAccount: z.string().min(8, "Coordonnées de versement obligatoires"),
  method: z.enum(["MOBILE_MONEY", "BANK_TRANSFER"]).default("MOBILE_MONEY"),
});

// Seuil de double approbation obligatoire (1 000 000 FCFA)
export const DOUBLE_APPROVAL_THRESHOLD_XOF = 1_000_000n;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const session = findSession(hashSessionToken(rawToken));
    if (!session) {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 401 });
    }

    // Contrôle KYC obligatoire avant tout retrait (Règle non négociable docs/05 et docs/06)
    if (user.kycStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Votre identité (KYC) doit être validée pour effectuer un retrait de fonds." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = payoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres de retrait invalides" }, { status: 400 });
    }

    const amountMinor = BigInt(parsed.data.amount);
    const requiresDoubleApproval = amountMinor >= DOUBLE_APPROVAL_THRESHOLD_XOF;

    const payout: PayoutRequestItem = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      beneficiaryName: user.displayName,
      amountMinor,
      currency: parsed.data.currency,
      phoneOrAccount: parsed.data.phoneOrAccount,
      method: parsed.data.method,
      status: requiresDoubleApproval ? "UNDER_REVIEW" : "REQUESTED",
      createdAt: new Date(),
    };

    memoryPayouts.push(payout);

    logAudit({
      actorId: user.id,
      action: "payout:requested",
      targetType: "PayoutRequest",
      targetId: payout.id,
      meta: {
        amountMinor: amountMinor.toString(),
        requiresDoubleApproval,
      },
    });

    return NextResponse.json({
      success: true,
      payoutId: payout.id,
      status: payout.status,
      requiresDoubleApproval,
      message: requiresDoubleApproval
        ? "Demande enregistrée. En attente de la double approbation de conformité et finance (> 1 000 000 FCFA)."
        : "Demande enregistrée. Traitement sous 24h.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la demande de retrait." }, { status: 500 });
  }
}
