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

export interface VideoComment {
  id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

export interface VideoReport {
  id: string;
  videoId: string;
  reporterId: string;
  reason: string;
  status: "OPEN" | "TRIAGED" | "ACTIONED" | "DISMISSED";
  createdAt: Date;
}

// Magasin de données pour les vidéos et interactions
const memoryVideos: VideoItem[] = [
  {
    id: "vid_diallo_aminata",
    authorId: "usr_diallo",
    authorName: "Dr. Mamadou Diallo",
    caption: "Urgence médicale : Soins chirurgicaux pédiatriques pour Aminata. Mobilisons-nous !",
    category: "SANTE_URGENCE",
    countryCode: "CI",
    city: "Abidjan",
    durationSec: 45,
    streamUid: "cloudflare_stream_mock_uid_1",
    campaignId: "camp_diallo_aminata",
    campaignTitle: "Soins pour Aminata",
    isCertifiedCampaign: true,
    isUrgent: true,
    likeCount: 342,
    commentCount: 58,
    shareCount: 112,
    viewCount: 4500n,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000), // il y a 3 heures
  },
  {
    id: "vid_senegal_ecole",
    authorId: "usr_fatou",
    authorName: "Fatou Sow",
    caption: "Rénovation de l'école primaire de Ndande : toitures et manuels scolaires.",
    category: "EDUCATION",
    countryCode: "SN",
    city: "Dakar",
    durationSec: 52,
    streamUid: "cloudflare_stream_mock_uid_2",
    campaignId: "camp_senegal_ecole",
    campaignTitle: "Une école pour Ndande",
    isCertifiedCampaign: false,
    isUrgent: false,
    likeCount: 184,
    commentCount: 22,
    shareCount: 35,
    viewCount: 1200n,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000),
  },
  {
    id: "vid_benin_forage",
    authorId: "usr_koffi",
    authorName: "Koffi Mensah",
    caption: "Accès à l'eau potable : Construction d'un forage solaire à Allada.",
    category: "INFRASTRUCTURE",
    countryCode: "BJ",
    city: "Cotonou",
    durationSec: 60,
    streamUid: "cloudflare_stream_mock_uid_3",
    campaignId: "camp_benin_forage",
    campaignTitle: "Forage Solaire Allada",
    isCertifiedCampaign: true,
    isUrgent: false,
    likeCount: 290,
    commentCount: 41,
    shareCount: 67,
    viewCount: 3100n,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000),
  },
];

const memoryComments: VideoComment[] = [];
const memoryReports: VideoReport[] = [];
const memoryLikes = new Set<string>(); // "userId:videoId"

export function getFeedVideos(options: FeedQueryOptions): VideoItem[] {
  return scoreAndRankFeed(memoryVideos, options);
}

export function getVideoById(id: string): VideoItem | undefined {
  return memoryVideos.find((v) => v.id === id);
}

export function toggleLikeVideo(userId: string, videoId: string): { liked: boolean; count: number } {
  const key = `${userId}:${videoId}`;
  const video = getVideoById(videoId);
  if (!video) throw new Error("Vidéo introuvable");

  if (memoryLikes.has(key)) {
    memoryLikes.delete(key);
    video.likeCount = Math.max(0, video.likeCount - 1);
    return { liked: false, count: video.likeCount };
  } else {
    memoryLikes.add(key);
    video.likeCount += 1;
    return { liked: true, count: video.likeCount };
  }
}

export function addVideoComment(userId: string, authorName: string, videoId: string, text: string): VideoComment {
  const video = getVideoById(videoId);
  if (!video) throw new Error("Vidéo introuvable");

  const comment: VideoComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    videoId,
    authorId: userId,
    authorName,
    text: text.trim(),
    createdAt: new Date(),
  };

  memoryComments.push(comment);
  video.commentCount += 1;
  return comment;
}

export function reportVideo(userId: string, videoId: string, reason: string): VideoReport {
  const video = getVideoById(videoId);
  if (!video) throw new Error("Vidéo introuvable");

  const report: VideoReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    videoId,
    reporterId: userId,
    reason: reason.trim(),
    status: "OPEN",
    createdAt: new Date(),
  };

  memoryReports.push(report);
  return report;
}

