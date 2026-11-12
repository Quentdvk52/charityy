import { NextResponse } from "next/server";
import { getAllCampaigns } from "@/modules/campaigns/service";

// Floutage des coordonnées GPS pour protéger la vie privée des bénéficiaires (docs/05 & docs/07)
function blurCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  // Décalage aléatoire déterministe d'environ 500m à 1km
  const jitterLat = (Math.sin(lat * 100) * 0.008);
  const jitterLng = (Math.cos(lng * 100) * 0.008);
  return {
    lat: Number((lat + jitterLat).toFixed(4)),
    lng: Number((lng + jitterLng).toFixed(4)),
  };
}

export async function GET() {
  const campaigns = getAllCampaigns();

  // Points GPS de référence pour les villes des cagnottes
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    Abidjan: { lat: 5.3600, lng: -4.0083 },
    Dakar: { lat: 14.7167, lng: -17.4677 },
    Cotonou: { lat: 6.3703, lng: 2.4183 },
    Bouaké: { lat: 7.6906, lng: -5.0300 },
    Korhogo: { lat: 9.4580, lng: -5.6296 },
  };

  const mapPins = campaigns
    .filter((c) => c.status === "ACTIVE")
    .map((c) => {
      const baseCoords = cityCoordinates[c.city] || { lat: 5.36, lng: -4.01 };
      const blurred = blurCoordinates(baseCoords.lat, baseCoords.lng);

      return {
        id: c.id,
        title: c.title,
        city: c.city,
        countryCode: c.countryCode,
        isUrgent: c.isUrgent,
        isCertified: c.isCertified,
        goalMinor: c.goalMinor.toString(),
        collectedMinor: c.collectedMinor.toString(),
        position: blurred,
      };
    });

  return NextResponse.json({
    success: true,
    pins: mapPins,
    count: mapPins.length,
    privacyNotice: "Les positions géographiques sont volontairement floutées pour préserver l'intimité des bénéficiaires.",
  });
}
