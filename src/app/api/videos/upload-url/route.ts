import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { StreamClient } from "@/server/integrations/stream";

const uploadSchema = z.object({
  maxDurationSeconds: z.number().int().min(10).max(180).default(180),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise pour publier une vidéo." }, { status: 401 });
    }

    const session = findSession(hashSessionToken(rawToken));
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée." }, { status: 401 });
    }

    const user = findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = uploadSchema.safeParse(body);
    const maxDuration = parsed.success ? parsed.data.maxDurationSeconds : 180;

    const streamClient = new StreamClient();
    const uploadData = await streamClient.createDirectUploadUrl(maxDuration);

    return NextResponse.json({
      success: true,
      uploadURL: uploadData.uploadURL,
      uid: uploadData.uid,
      authorId: user.id,
      maxDurationSeconds: maxDuration,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération de l'URL de téléversement." }, { status: 500 });
  }
}
