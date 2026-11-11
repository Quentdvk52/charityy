import { describe, it, expect } from "vitest";
import { hasPermission, assertPermission } from "@/server/auth/permissions";

describe("Contrôle d'accès RBAC (Permissions)", () => {
  it("autorise un utilisateur standard à signer et donner", () => {
    expect(hasPermission(["USER"], "campaign:sign")).toBe(true);
    expect(hasPermission(["USER"], "campaign:donate")).toBe(true);
  });

  it("interdit à un utilisateur standard de créer une cagnotte sans être CREATOR ou ORG", () => {
    expect(hasPermission(["USER"], "campaign:create")).toBe(false);
  });

  it("interdit au support d'accéder aux pièces d'identité sensibles", () => {
    expect(hasPermission(["SUPPORT"], "kyc:view_sensitive")).toBe(false);
  });

  it("autorise le rôle VERIFIER à examiner le KYC et certifier", () => {
    expect(hasPermission(["VERIFIER"], "kyc:view_sensitive")).toBe(true);
    expect(hasPermission(["VERIFIER"], "kyc:review")).toBe(true);
    expect(hasPermission(["VERIFIER"], "campaign:certify")).toBe(true);
  });

  it("autorise le rôle FINANCE à réconcilier et approuver les retraits", () => {
    expect(hasPermission(["FINANCE"], "payout:review")).toBe(true);
    expect(hasPermission(["FINANCE"], "finance:reconcile")).toBe(true);
  });

  it("lève une erreur avec assertPermission en cas d'accès refusé", () => {
    expect(() =>
      assertPermission(["USER"], "admin:platform_settings")
    ).toThrow("Accès refusé");
  });
});
