import crypto from "crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Chiffre une chaîne sensible (ex: numéro de pièce d'identité, coordonnées bancaires) avec AES-256-GCM.
 * Format de sortie : base64(iv + authTag + ciphertext)
 */
export function encryptSensitive(plainText: string): string {
  const key = Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Déchiffre une chaîne chiffrée avec AES-256-GCM.
 */
export function decryptSensitive(cipherTextBase64: string): string {
  const key = Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");
  const combined = Buffer.from(cipherTextBase64, "base64");

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Ciphertext trop court ou invalide");
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hache une adresse IP ou un identifiant d'appareil avec un sel/poivre secret (HASH_PEPPER).
 * Ne stocke JAMAIS les adresses IP en clair pour respecter le RGPD et la vie privée.
 */
export function hashWithPepper(data: string): string {
  return crypto
    .createHmac("sha256", env.HASH_PEPPER)
    .update(data)
    .digest("hex");
}

/**
 * Vérification de signature HMAC en temps constant pour les webhooks Moneroo ou Cloudflare.
 */
export function verifyHmacSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Génère une clé idempotente cryptographiquement sûre.
 */
export function generateIdempotencyKey(prefix = "idem"): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}
