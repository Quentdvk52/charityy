export interface VideoItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  caption?: string | null;
  category?: string | null;
  countryCode?: string | null;
  city?: string | null;
  durationSec?: number | null;
  streamUid?: string | null;
  campaignId?: string | null;
  campaignTitle?: string | null;
  isCertifiedCampaign?: boolean;
  isUrgent?: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: bigint;
  createdAt: Date;
  isSponsored?: boolean;
}

export interface FeedQueryOptions {
  tab: "for_you" | "following" | "local" | "urgencies" | "lives";
  userCountryCode?: string;
  userCity?: string;
  followingUserIds?: string[];
  cursor?: string;
  limit?: number;
}

/**
 * Moteur d'ordonnancement et de calcul de score du fil d'actualité Charityy.
 * Combine proximité, certification, fraîcheur temporelle, urgence et engagement.
 */
export function scoreAndRankFeed(
  videos: VideoItem[],
  options: FeedQueryOptions
): VideoItem[] {
  const { tab, userCountryCode, userCity, followingUserIds = [] } = options;

  let filtered = [...videos];

  if (tab === "following") {
    filtered = filtered.filter((v) => followingUserIds.includes(v.authorId));
  } else if (tab === "local") {
    if (userCountryCode) {
      filtered = filtered.filter((v) => v.countryCode === userCountryCode);
    }
  } else if (tab === "urgencies") {
    filtered = filtered.filter((v) => v.isUrgent);
  }

  // Calcul du score pour chaque vidéo
  const scored = filtered.map((video) => {
    let score = 0;

    // 1. Fraîcheur temporelle (décroissance exponentielle)
    const ageHours = Math.max(
      0.1,
      (Date.now() - video.createdAt.getTime()) / (1000 * 60 * 60)
    );
    const freshnessScore = 100 / Math.pow(ageHours + 2, 1.2);
    score += freshnessScore;

    // 2. Engagement (likes, commentaires, partages)
    const engagementScore =
      video.likeCount * 2 + video.commentCount * 5 + video.shareCount * 10;
    score += engagementScore;

    // 3. Proximité géographique
    if (userCity && video.city && video.city.toLowerCase() === userCity.toLowerCase()) {
      score += 80;
    } else if (userCountryCode && video.countryCode === userCountryCode) {
      score += 40;
    }

    // 4. Label de confiance (Certification de la cagnotte)
    if (video.isCertifiedCampaign) {
      score += 120;
    }

    // 5. Urgence vitale / sociale
    if (video.isUrgent) {
      score += 90;
    }

    return { video, score };
  });

  // Tri par score décroissant
  scored.sort((a, b) => b.score - a.score);

  // Règle de diversité : pas plus de 2 vidéos consécutives du même auteur
  const diverseList: VideoItem[] = [];
  const remaining = scored.map((s) => s.video);

  while (remaining.length > 0) {
    let pickIndex = 0;
    const lastAuthor = diverseList[diverseList.length - 1]?.authorId;
    const secondLastAuthor = diverseList[diverseList.length - 2]?.authorId;

    if (
      lastAuthor &&
      secondLastAuthor &&
      lastAuthor === secondLastAuthor &&
      remaining[0]?.authorId === lastAuthor
    ) {
      // Chercher une vidéo d'un auteur différent
      const diffIndex = remaining.findIndex((v) => v.authorId !== lastAuthor);
      pickIndex = diffIndex !== -1 ? diffIndex : 0;
    }

    const [picked] = remaining.splice(pickIndex, 1);
    if (picked) diverseList.push(picked);
  }

  return diverseList.slice(0, options.limit || 20);
}
