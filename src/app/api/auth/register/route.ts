import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, findUserByIdentifier, saveSession } from "@/server/auth/store";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/server/auth/session";
import { logAudit } from "@/server/security/audit";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Caractères alphanumériques et underscores uniquement"),
  displayName: z.string().min(2, "Nom d'affichage trop court").max(50),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
  email: z.string().email("Adresse e-mail invalide").optional().or(z.literal("")),
  phone: z.string().min(8, "Numéro de téléphone invalide").optional().or(z.literal("")),
  countryCode: z.string().length(2).optional(),
  city: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, displayName, password, email, phone, countryCode, city } = parsed.data;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Vous devez fournir soit un numéro de téléphone soit une adresse e-mail." },
        { status: 400 }
      );
    }

    // Vérification de l'unicité
    if (findUserByIdentifier(username)) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà utilisé." },
        { status: 409 }
      );
    }

    if (email && findUserByIdentifier(email)) {
      return NextResponse.json(
        { error: "Cette adresse e-mail est déjà associée à un compte." },
        { status: 409 }
      );
    }

    if (phone && findUserByIdentifier(phone)) {
      return NextResponse.json(
        { error: "Ce numéro de téléphone est déjà associé à un compte." },
        { status: 409 }
      );
    }

    // Création de l'utilisateur
    const user = createUser({
      username,
      displayName,
      password,
      email: email || null,
      phone: phone || null,
      countryCode: countryCode || "CI",
      city: city || "Abidjan",
    });

    // Création de la session
    const { rawToken, tokenHash } = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    saveSession(tokenHash, user.id, expiresAt);

    logAudit({
      actorId: user.id,
      action: "user:registered",
      targetType: "User",
      targetId: user.id,
      meta: { username: user.username },
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
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur interne lors de l'inscription." },
      { status: 500 }
    );
  }
}
