import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/server/auth/session";
import { findSession, findUserById } from "@/server/auth/store";
import { memoryPayouts, DOUBLE_APPROVAL_THRESHOLD_XOF } from "@/modules/payouts/service";
import { hasPermission } from "@/server/auth/permissions";
import { logAudit } from "@/server/security/audit";

const approveSchema = z.object({
  payoutId: z.string(),
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const session = findSession(hashSessionToken(rawToken));
    if (!session) {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const approver = findUserById(session.userId);
    if (!approver) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 401 });
    }

    // Contrôle d'habilitation RBAC pour approuver un retrait
    const canApprove = hasPermission(approver.roles as any, "payout:approve");

    if (!canApprove) {
      return NextResponse.json({ error: "Accès refusé : rôle FINANCE ou ADMIN requis." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = approveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { payoutId, decision, rejectionReason } = parsed.data;
    const payout = memoryPayouts.find((p) => p.id === payoutId);

    if (!payout) {
      return NextResponse.json({ error: "Demande de retrait introuvable" }, { status: 404 });
    }

    // Séparation des tâches : celui qui a demandé le retrait ne peut PAS l'approuver (docs/05)
    if (payout.userId === approver.id) {
      return NextResponse.json(
        { error: "Violation de la séparation des tâches : vous ne pouvez pas approuver votre propre retrait." },
        { status: 403 }
      );
    }

    if (decision === "REJECT") {
      payout.status = "REJECTED";
      logAudit({
        actorId: approver.id,
        action: "payout:rejected",
        targetType: "PayoutRequest",
        targetId: payout.id,
        meta: { reason: rejectionReason },
      });
      return NextResponse.json({ success: true, status: payout.status });
    }

    const requiresDouble = payout.amountMinor >= DOUBLE_APPROVAL_THRESHOLD_XOF;

    if (!requiresDouble) {
      // Approbation simple directe
      payout.status = "APPROVED";
      payout.firstApproverId = approver.id;
      payout.firstApprovedAt = new Date();
    } else {
      // Double approbation requise
      if (!payout.firstApproverId) {
        // Première approbation
        payout.firstApproverId = approver.id;
        payout.firstApprovedAt = new Date();
        payout.status = "UNDER_REVIEW";

        logAudit({
          actorId: approver.id,
          action: "payout:first_approval_recorded",
          targetType: "PayoutRequest",
          targetId: payout.id,
        });

        return NextResponse.json({
          success: true,
          status: payout.status,
          message: "Première approbation validée. En attente du second signataire.",
        });
      } else {
        // Deuxième approbation : doit impérativement être une personne distincte
        if (payout.firstApproverId === approver.id) {
          return NextResponse.json(
            { error: "Le second signataire doit être différent du premier approbateur." },
            { status: 403 }
          );
        }

        payout.secondApproverId = approver.id;
        payout.secondApprovedAt = new Date();
        payout.status = "APPROVED";
      }
    }

    logAudit({
      actorId: approver.id,
      action: "payout:final_approved",
      targetType: "PayoutRequest",
      targetId: payout.id,
      meta: {
        firstApproverId: payout.firstApproverId,
        secondApproverId: payout.secondApproverId,
      },
    });

    return NextResponse.json({
      success: true,
      status: payout.status,
      message: "Retrait définitivement approuvé et transmis pour déblocage des fonds.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'approbation du retrait." }, { status: 500 });
  }
}
