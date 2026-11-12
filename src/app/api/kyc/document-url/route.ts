import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { getSecureKycDocumentUrl } from "@/modules/kyc/service";

const querySchema = z.object({
  submissionId: z.string().min(1),
  documentKey: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const session = findSession(hashSessionToken(rawToken));
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = querySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const result = getSecureKycDocumentUrl({
      reviewerId: user.id,
      reviewerRoles: user.roles,
      submissionId: parsed.data.submissionId,
      documentKey: parsed.data.documentKey,
      clientIp: request.headers.get("x-forwarded-for") || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      expiresInSeconds: 60,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération de l'URL sécurisée." }, { status: 500 });
  }
}
