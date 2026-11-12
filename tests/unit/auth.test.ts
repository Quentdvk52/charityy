import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken,
  generateOtp,
  registerOtp,
  verifyOtp,
} from "@/server/auth/session";

describe("Module Authentification & Sécurité (Étape 1)", () => {
  it("hache et vérifie un mot de passe avec PBKDF2 et sel aléatoire", () => {
    const password = "SecuredPassword2026!";
    const hash = hashPassword(password);

    expect(hash).toContain("pbkdf2$600000$");
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("génère des jetons de session cryptographiquement sûrs et vérifiables par hash", () => {
    const { rawToken, tokenHash } = createSessionToken();

    expect(rawToken.length).toBeGreaterThanOrEqual(32);
    expect(tokenHash.length).toBe(64); // SHA-256 hex
    expect(hashSessionToken(rawToken)).toBe(tokenHash);
  });

  it("génère des codes OTP à 6 chiffres", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("valide un OTP correct et bloque après 5 échecs consécutifs", () => {
    const target = "+2250102030405";
    const otp = "123456";
    registerOtp(target, otp);

    // Essai erroné 1
    const res1 = verifyOtp(target, "000000");
    expect(res1.success).toBe(false);
    expect(res1.error).toContain("1/5");

    // Essais erronés 2, 3, 4
    verifyOtp(target, "111111");
    verifyOtp(target, "222222");
    verifyOtp(target, "333333");

    // Essai erroné 5 -> Blocage
    const res5 = verifyOtp(target, "444444");
    expect(res5.success).toBe(false);

    // Tentative après dépassement
    const res6 = verifyOtp(target, otp);
    expect(res6.success).toBe(false);
    expect(res6.error).toContain("maximal");
  });
});
