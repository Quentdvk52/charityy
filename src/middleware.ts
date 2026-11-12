import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

// Devises par défaut selon le code pays ISO (2 lettres)
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  CI: "XOF",
  SN: "XOF",
  BF: "XOF",
  ML: "XOF",
  BJ: "XOF",
  TG: "XOF",
  NE: "XOF",
  CM: "XAF",
  GA: "XAF",
  CG: "XAF",
  CD: "CDF",
  GN: "GNF",
  FR: "EUR",
  BE: "EUR",
  US: "USD",
  CA: "CAD",
  GB: "GBP",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Détection géographique via les en-têtes Edge de Vercel / Cloudflare
  const countryCode =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "CI"; // Côte d'Ivoire par défaut (zone XOF)

  const city =
    request.headers.get("x-vercel-ip-city") ||
    "Abidjan";

  const currency = COUNTRY_CURRENCY_MAP[countryCode] || "XOF";

  // Détection de la locale acceptée (fr prioritaire)
  const acceptLanguage = request.headers.get("accept-language") || "";
  const locale = acceptLanguage.toLowerCase().startsWith("en") ? "en" : "fr";

  // 2. Protection des routes d'administration `/admin`
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      // Redirection vers la page d'accueil ou de connexion
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_error", "admin_login_required");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Propagation des métadonnées détectées dans les en-têtes de réponse / requête
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-country", countryCode);
  requestHeaders.set("x-user-city", encodeURIComponent(city));
  requestHeaders.set("x-user-currency", currency);
  requestHeaders.set("x-user-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Cookies non sensibles pour synchronisation de l'affichage client
  response.cookies.set("charityy_country", countryCode, { path: "/", sameSite: "lax" });
  response.cookies.set("charityy_currency", currency, { path: "/", sameSite: "lax" });
  response.cookies.set("charityy_locale", locale, { path: "/", sameSite: "lax" });

  return response;
}

export const config = {
  matcher: [
    /*
     * Appliquer le middleware à toutes les routes sauf :
     * - Fichiers statiques (_next/static, _next/image, favicon.ico, images)
     * - Fichiers d'icônes et manifestes
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
