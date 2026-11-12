import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { processGiftTransaction } from "@/modules/lives/service";
import { logAudit } from "@/server/security/audit";

const giftSchema = z.object({
  receiverId: z.string().min(1),
  giftId: z.string().min(1),
  channelName: z.string().optional(),
});

// Solde wallet de démonstration en mémoire
const userWallets = new Map<string, bigint>();

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise pour offrir un cadeau." }, { status: 401 });
    }

    const session = findSession(hashSessionToken(rawToken));
    if (!session) {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = giftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres de cadeau invalides" }, { status: 400 });
    }

    const currentBalance = userWallets.get(user.id) ?? 50_000n; // Solde initial offert pour la démo

    const result = processGiftTransaction({
      senderId: user.id,
      receiverId: parsed.data.receiverId,
      giftId: parsed.data.giftId,
      senderWalletBalanceMinor: currentBalance,
    });

    if (!result.success || !result.gift) {
      return NextResponse.json({ error: result.error || "Solde insuffisant" }, { status: 400 });
    }

    userWallets.set(user.id, result.newSenderBalanceMinor);

    logAudit({
      actorId: user.id,
      action: "live:gift_sent",
      targetType: "Gift",
      targetId: result.gift.id,
      meta: {
        receiverId: parsed.data.receiverId,
        priceMinor: result.gift.priceMinor.toString(),
        newBalance: result.newSenderBalanceMinor.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      gift: {
        id: result.gift.id,
        name: result.gift.name,
        priceMinor: result.gift.priceMinor.toString(),
        currency: result.gift.currency,
      },
      newBalanceMinor: result.newSenderBalanceMinor.toString(),
      message: `Cadeau ${result.gift.name} envoyé avec succès !`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi du cadeau." }, { status: 500 });
  }
}
