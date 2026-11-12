import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { AgoraRtcClient } from "@/server/integrations/agora";

const tokenSchema = z.object({
  channelName: z.string().min(3),
  role: z.enum(["host", "audience"]).default("audience"),
  liveCampaignId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise pour rejoindre le live." }, { status: 401 });
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
    const parsed = tokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres Agora invalides" }, { status: 400 });
    }

    const { channelName, role, liveCampaignId } = parsed.data;

    // Règle docs/07 : Un live de collecte ne peut être démarré comme "host" que si le compte est vérifié (KYC approuvé)
    if (role === "host" && liveCampaignId) {
      if (user.kycStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Votre compte doit avoir un statut KYC approuvé pour animer un direct solidaire." },
          { status: 403 }
        );
      }
    }

    const agora = new AgoraRtcClient();
    const result = await agora.generateRtcToken({
      channelName,
      userId: user.id,
      role,
      expireSeconds: 3600, // 1 heure renouvelable
    });

    return NextResponse.json({
      success: true,
      token: result.token,
      appId: result.appId,
      channelName: result.channelName,
      role,
      expiresAt: result.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération du jeton de direct Agora." }, { status: 500 });
  }
}
