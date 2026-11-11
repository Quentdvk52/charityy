import { SUPPORTED_CURRENCIES, type CurrencyCode } from "./constants.ts";

/**
 * Formate un montant en unités mineures (BigInt) en chaîne monétaire lisible selon la locale et la devise.
 * Exemple : 10000n en XOF -> "10 000 FCFA", 1550n en EUR -> "15,50 €"
 */
export function formatCurrency(
  amountMinor: bigint,
  currencyCode: string,
  locale = "fr-FR"
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  const exponent = currency ? currency.exponent : 2;

  const divisor = 10n ** BigInt(exponent);
  const majorPart = amountMinor / divisor;
  const minorPart = amountMinor % divisor;

  const floatValue =
    Number(majorPart) + Number(minorPart) / Number(divisor);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(floatValue);
  } catch {
    return `${floatValue.toFixed(exponent)} ${currencyCode}`;
  }
}

/**
 * Convertit un montant décimal saisi (ex: 15.50) en unités mineures entières (BigInt 1550n).
 */
export function toMinorUnits(amount: number | string, currencyCode: string): bigint {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  const exponent = currency ? currency.exponent : 2;

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num < 0) {
    throw new Error("Montant invalide");
  }

  const factor = 10 ** exponent;
  return BigInt(Math.round(num * factor));
}

/**
 * Convertit des unités mineures en montant décimal pour affichage calculé.
 */
export function fromMinorUnits(amountMinor: bigint, currencyCode: string): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  const exponent = currency ? currency.exponent : 2;

  const divisor = 10 ** exponent;
  return Number(amountMinor) / divisor;
}
