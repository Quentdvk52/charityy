import { describe, it, expect } from "vitest";
import { formatCurrency, toMinorUnits, fromMinorUnits } from "@/lib/currency";

describe("Gestion des devises et unités mineures", () => {
  it("formate correctement le Franc CFA (XOF) sans décimales", () => {
    const formatted = formatCurrency(10_000n, "XOF", "fr-FR");
    expect(formatted).toContain("10");
    expect(formatted).toContain("000");
  });

  it("formate correctement l'Euro (EUR) avec 2 décimales", () => {
    const formatted = formatCurrency(1550n, "EUR", "fr-FR");
    expect(formatted).toContain("15,50");
  });

  it("convertit les montants décimaux en unités mineures entières (BigInt)", () => {
    expect(toMinorUnits(5000, "XOF")).toBe(5000n); // 0 décimales
    expect(toMinorUnits(15.5, "EUR")).toBe(1550n); // 2 décimales
    expect(toMinorUnits("99.99", "USD")).toBe(9999n);
  });

  it("reconvertit les unités mineures en montant décimal pour affichage", () => {
    expect(fromMinorUnits(5000n, "XOF")).toBe(5000);
    expect(fromMinorUnits(1550n, "EUR")).toBe(15.5);
  });
});
