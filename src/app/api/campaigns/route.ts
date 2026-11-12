import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { getAllCampaigns, createCampaign } from "@/modules/campaigns/service";

const createCampaignSchema = z.object({
  title: z.string().min(5, "Titre trop court").max(120),
  story: z.string().min(20, "Veuillez détailler l'histoire de la cagnotte").max(3000),
  category: z.string().min(3),
  goalAmount: z.number().positive("L'objectif doit être supérieur à zéro"),
  currency: z.string().length(3).default("XOF"),
  city: z.string().min(2),
  countryCode: z.string().length(2),
  isUrgent: z.boolean().default(false),
});

export async function GET() {
  try {
    const campaigns = getAllCampaigns();

    // Sérialisation JSON sûre des BigInt
    const sanitized = campaigns.map((c) => ({
      ...c,
      goalMinor: c.goalMinor.toString(),
      collectedMinor: c.collectedMinor.toString(),
      signatureCount: c.signatures.length,
    }));

    return NextResponse.json({ success: true, campaigns: sanitized });
  } catch {
    return NextResponse.json({ error: "Erreur lors du chargement des cagnottes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise pour créer une cagnotte." }, { status: 401 });
    }

    const session = findSession(hashSessionToken(rawToken));
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée." }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données de cagnotte invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const isKycApproved = user.kycStatus === "APPROVED";

    const campaign = createCampaign({
      authorId: user.id,
      authorName: user.displayName,
      authorRole: user.roles.includes("CREATOR") ? "Créateur de cause" : undefined,
      title: parsed.data.title,
      story: parsed.data.story,
      category: parsed.data.category,
      goalMinor: BigInt(parsed.data.goalAmount),
      currency: parsed.data.currency,
      city: parsed.data.city,
      countryCode: parsed.data.countryCode,
      isUrgent: parsed.data.isUrgent,
      isKycApproved,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      status: campaign.status,
      message: isKycApproved
        ? "Cagnotte créée et ouverte à la collecte de signatures."
        : "Cagnotte créée en brouillon. Votre KYC doit être validé pour ouvrir les signatures.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création de la cagnotte." }, { status: 500 });
  }
}
