import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { getCampaignById, signCampaign } from "@/modules/campaigns/service";
import { computeSignatureProgress, SignerKind } from "@/modules/signatures/service";

const signSchema = z.object({
  kind: z.enum(["RELATIVE", "RESOURCE_PERSON", "COMMUNITY"]),
  comment: z.string().max(280).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const campaign = getCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });
    }

    const progress = computeSignatureProgress(campaign.signatures);

    return NextResponse.json({
      success: true,
      campaignId,
      status: campaign.status,
      progress,
      recentSignatures: campaign.signatures.slice(-10).map((s) => ({
        id: s.id,
        kind: s.kind,
        comment: s.comment,
        createdAt: s.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la lecture des signatures." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise pour signer." }, { status: 401 });
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
    const parsed = signSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Type de signataire invalide" }, { status: 400 });
    }

    const clientIp = request.headers.get("x-forwarded-for") || undefined;
    const deviceId = request.headers.get("user-agent") || undefined;

    const result = signCampaign({
      campaignId,
      signerId: user.id,
      kind: parsed.data.kind as SignerKind,
      comment: parsed.data.comment,
      deviceId,
      clientIp,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Signature enregistrée avec succès.",
      progress: result.progress,
      campaignStatus: result.campaignStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
