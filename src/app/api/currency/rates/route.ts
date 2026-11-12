import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

// Taux de change de référence par rapport au XOF (Franc CFA UEMOA)
const EXCHANGE_RATES_TO_XOF: Record<string, number> = {
  XOF: 1.0,
  XAF: 1.0, // Parité 1:1 CFA CEMAC
  EUR: 655.957, // Parité fixe euro
  USD: 605.5,
  GBP: 765.2,
  CAD: 442.8,
  GNF: 0.07,
  CDF: 0.22,
};

export async function GET() {
  return NextResponse.json({
    success: true,
    baseCurrency: "XOF",
    currencies: SUPPORTED_CURRENCIES,
    ratesToXof: EXCHANGE_RATES_TO_XOF,
    updatedAt: new Date(),
  });
}
