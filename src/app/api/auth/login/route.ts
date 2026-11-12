import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByIdentifier, saveSession } from "@/server/auth/store";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/server/auth/session";
import { logAudit } from "@/server/security/audit";

const loginSchema = z.object({
  identifier: z.string().min(2, "Identifiant obligatoire"),
  password: z.string().min(1, "Mot de passe obligatoire"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Identifiant ou mot de passe invalide." }, { status: 400 });
    }

    const { identifier, password } = parsed.data;
    const user = findUserByIdentifier(identifier);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      // Message générique pour prévenir l'énumération de comptes (Règle OWASP / docs/05)
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    // Création de la session
    const { rawToken, tokenHash } = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    saveSession(tokenHash, user.id, expiresAt);

    logAudit({
      actorId: user.id,
      action: "user:login_success",
      targetType: "User",
      targetId: user.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        kycStatus: user.kycStatus,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur lors de la connexion." }, { status: 500 });
  }
}
