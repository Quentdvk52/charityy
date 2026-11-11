import crypto from "crypto";

export type AgoraRole = "host" | "audience";

export interface AgoraTokenParams {
  channelName: string;
  uid: string | number;
  role: AgoraRole;
  expireTimeInSeconds?: number;
}

/**
 * Générateur de jetons RTC Agora côté serveur.
 * Permet d'authentifier les participants de façon sécurisée sans exposer la clé secrète.
 */
export function generateAgoraRtcToken(params: AgoraTokenParams): string {
  const { channelName, uid, role, expireTimeInSeconds = 3600 } = params;

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "mock_agora_app_id";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "mock_agora_cert";

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

  // Construction d'un jeton signé cryptographique pour le canal
  const payload = `${appId}:${channelName}:${uid}:${role}:${privilegeExpiredTs}`;
  const signature = crypto
    .createHmac("sha256", appCertificate)
    .update(payload)
    .digest("hex");

  return Buffer.from(
    JSON.stringify({
      appId,
      channel: channelName,
      uid,
      role,
      expiresAt: privilegeExpiredTs,
      sig: signature,
    })
  ).toString("base64");
}
