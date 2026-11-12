import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { createKycSubmission, KycDocType } from "@/modules/kyc/service";

const kycSubmitSchema = z.object({
  legalName: z.string().min(3, "Nom complet obligatoire"),
  birthDate: z.string().optional(),
  idDocType: z.enum(["NATIONAL_ID", "PASSPORT", "RESIDENCE_PERMIT", "DRIVING_LICENSE"]),
  idDocNumber: z.string().min(4, "Numéro de pièce obligatoire"),
  idFrontKey: z.string().min(5, "Document recto manquant"),
  idBackKey: z.string().optional(),
  selfieKey: z.string().optional(),
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
    const parsed = kycSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données KYC incomplètes", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const submission = createKycSubmission({
      userId: user.id,
      legalName: parsed.data.legalName,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      idDocType: parsed.data.idDocType as KycDocType,
      idDocNumber: parsed.data.idDocNumber,
      idFrontKey: parsed.data.idFrontKey,
      idBackKey: parsed.data.idBackKey,
      selfieKey: parsed.data.selfieKey,
    });

    user.kycStatus = "PENDING";

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: submission.status,
      message: "Dossier KYC transmis avec succès. En attente de vérification documentaire.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la soumission du dossier KYC." }, { status: 500 });
  }
}
