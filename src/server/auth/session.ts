import crypto from "crypto";
import { hashWithPepper } from "@/lib/crypto";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export { SESSION_COOKIE_NAME };

export interface SessionData {
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ipHash?: string;
  deviceId?: string;
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  roles: string[];
  kycStatus: string;
  countryCode?: string | null;
  city?: string | null;
  locale: string;
}

// Configuration des sessions
export const SESSION_DURATION_DAYS = 30;
export const OTP_EXPIRATION_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Hache un mot de passe de manière robuste avec salt et PBKDF2 (SHA-512, 600 000 itérations).
 * Format de sortie : "pbkdf2$iterations$salt$hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 600_000;
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Vérifie un mot de passe en temps constant.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") {
      return false;
    }
    const iterations = parseInt(parts[1]!, 10);
    const salt = parts[2]!;
    const expectedHash = parts[3]!;

    const actualHash = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(actualHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Génère un jeton de session aléatoire de 256 bits et son hash SHA-256 pour stockage en base.
 */
export function createSessionToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

/**
 * Calcule le hash d'un jeton brut reçu pour vérification en base.
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Génère un code OTP numérique à 6 chiffres pour validation SMS/Email.
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Structure de stockage mémoire pour les OTP (remplaçable par Upstash Redis / DB).
 */
export interface OtpRecord {
  target: string; // Téléphone ou e-mail normalisé
  otpHash: string;
  attempts: number;
  expiresAt: Date;
}

const memoryOtpStore = new Map<string, OtpRecord>();

/**
 * Enregistre un OTP avec expiration et compteur de tentatives.
 */
export function registerOtp(target: string, otp: string): void {
  const otpHash = hashWithPepper(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  memoryOtpStore.set(target, {
    target,
    otpHash,
    attempts: 0,
    expiresAt,
  });
}

/**
 * Valide un OTP en appliquant la limite d'essais et l'expiration.
 */
export function verifyOtp(
  target: string,
  candidateOtp: string
): { success: boolean; error?: string } {
  const record = memoryOtpStore.get(target);

  if (!record) {
    return { success: false, error: "Code expiré ou introuvable. Veuillez renvoyer un code." };
  }

  if (new Date() > record.expiresAt) {
    memoryOtpStore.delete(target);
    return { success: false, error: "Le code de validation a expiré." };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    memoryOtpStore.delete(target);
    return {
      success: false,
      error: "Nombre maximal de tentatives dépassé pour ce code. Demandez-en un nouveau.",
    };
  }

  record.attempts += 1;
  const candidateHash = hashWithPepper(candidateOtp);

  const isValid = crypto.timingSafeEqual(
    Buffer.from(candidateHash),
    Buffer.from(record.otpHash)
  );

  if (isValid) {
    memoryOtpStore.delete(target);
    return { success: true };
  }

  return {
    success: false,
    error: `Code invalide. Tentative ${record.attempts}/${MAX_OTP_ATTEMPTS}.`,
  };
}
