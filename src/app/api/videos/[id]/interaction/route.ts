import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { toggleLikeVideo, addVideoComment, reportVideo } from "@/modules/videos/service";

const interactionSchema = z.object({
  action: z.enum(["like", "comment", "report"]),
  text: z.string().max(500).optional(),
  reason: z.string().max(300).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
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

    const body = await request.json();
    const parsed = interactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { action, text, reason } = parsed.data;

    if (action === "like") {
      const result = toggleLikeVideo(user.id, videoId);
      return NextResponse.json({ success: true, action: "like", ...result });
    }

    if (action === "comment") {
      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: "Le texte du commentaire est requis." }, { status: 400 });
      }
      const comment = addVideoComment(user.id, user.displayName, videoId, text);
      return NextResponse.json({ success: true, action: "comment", comment });
    }

    if (action === "report") {
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json({ error: "Le motif du signalement est requis." }, { status: 400 });
      }
      const report = reportVideo(user.id, videoId, reason);
      return NextResponse.json({
        success: true,
        action: "report",
        message: "Signalement transmis à l'équipe de modération.",
        reportId: report.id,
      });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
