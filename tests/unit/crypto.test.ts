import { describe, it, expect } from "vitest";
import {
  encryptSensitive,
  decryptSensitive,
  hashWithPepper,
  verifyHmacSignature,
} from "@/lib/crypto";

describe("Module Cryptographique de Sécurité", () => {
  it("chiffre et déchiffre une pièce d'identité avec AES-256-GCM sans altération", () => {
    const rawIdNumber = "CI-2026-9876543210-AB";
    const encrypted = encryptSensitive(rawIdNumber);

    expect(encrypted).not.toBe(rawIdNumber);
    expect(typeof encrypted).toBe("string");

    const decrypted = decryptSensitive(encrypted);
    expect(decrypted).toBe(rawIdNumber);
  });

  it("génère des empreintes anonymisées et reproductibles avec hashWithPepper", () => {
    const ip = "197.234.221.45";
    const hash1 = hashWithPepper(ip);
    const hash2 = hashWithPepper(ip);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toContain(ip);
    expect(hash1.length).toBe(64); // SHA-256 hex
  });

  it("vérifie une signature HMAC-SHA256 valide et rejette une fausse signature", () => {
    const secret = "test_webhook_secret_key";
    const payload = JSON.stringify({ event: "payment.success", id: "pay_123" });

    // Calcul d'une signature correcte
    const crypto = require("crypto");
    const validSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    expect(verifyHmacSignature(payload, validSig, secret)).toBe(true);
    expect(
      verifyHmacSignature(payload, "invalid_tampered_signature_hex", secret)
    ).toBe(false);
  });
});
