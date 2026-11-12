import { NextResponse } from "next/server";
import { getFeedVideos } from "@/modules/videos/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = (searchParams.get("tab") || "for_you") as any;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const userCountryCode = request.headers.get("x-user-country") || "CI";
    const userCity = decodeURIComponent(request.headers.get("x-user-city") || "Abidjan");

    const videos = getFeedVideos({
      tab,
      userCountryCode,
      userCity,
      limit,
    });

    // Sérialisation compatible JSON (conversion des BigInt en strings)
    const sanitizedVideos = videos.map((v) => ({
      ...v,
      viewCount: v.viewCount.toString(),
    }));

    return NextResponse.json({
      success: true,
      tab,
      videos: sanitizedVideos,
      count: sanitizedVideos.length,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors du chargement du fil vidéo." }, { status: 500 });
  }
}
