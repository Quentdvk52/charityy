import { NextResponse } from "next/server";
import { z } from "zod";
import { generateOtp, registerOtp, verifyOtp } from "@/server/auth/session";

const sendOtpSchema = z.object({
  target: z.string().min(5, "Numéro ou e-mail invalide"),
});

const verifyOtpSchema = z.object({
  target: z.string().min(5),
  code: z.string().length(6, "Le code doit comporter 6 chiffres"),
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // "send" ou "verify"
    const body = await request.json();

    if (action === "send") {
      const parsed = sendOtpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Numéro ou e-mail invalide." }, { status: 400 });
      }

      const otp = generateOtp();
      registerOtp(parsed.data.target, otp);

      // Simulation d'envoi SMS / Email via Termii / Resend
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        success: true,
        message: "Code OTP envoyé avec succès.",
        // En mode développement / test uniquement pour simplifier la démo
        ...(isDev ? { devOtp: otp } : {}),
      });
    }

    if (action === "verify") {
      const parsed = verifyOtpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Code ou cible invalide." }, { status: 400 });
      }

      const result = verifyOtp(parsed.data.target, parsed.data.code);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: "Action inconnue (?action=send ou verify)" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur lors du traitement OTP." }, { status: 500 });
  }
}
