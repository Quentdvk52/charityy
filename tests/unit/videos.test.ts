import { describe, it, expect } from "vitest";
import {
  getFeedVideos,
  toggleLikeVideo,
  addVideoComment,
  reportVideo,
  getVideoById,
} from "@/modules/videos/service";

describe("Module Vidéo & Fil d'actualité (Étape 2)", () => {
  it("classe et filtre les vidéos selon l'onglet (Pour toi, Local, Urgences)", () => {
    // 1. Onglet Urgences
    const urgencies = getFeedVideos({ tab: "urgencies" });
    expect(urgencies.length).toBeGreaterThan(0);
    expect(urgencies.every((v) => v.isUrgent)).toBe(true);

    // 2. Onglet Local (Côte d'Ivoire)
    const localCI = getFeedVideos({ tab: "local", userCountryCode: "CI" });
    expect(localCI.every((v) => v.countryCode === "CI")).toBe(true);

    // 3. Onglet Pour toi
    const forYou = getFeedVideos({ tab: "for_you" });
    expect(forYou.length).toBeGreaterThan(0);
  });

  it("gère l'ajout et le retrait de likes sans solde négatif", () => {
    const video = getVideoById("vid_diallo_aminata")!;
    const initialLikes = video.likeCount;

    // Like
    const res1 = toggleLikeVideo("user_test_1", "vid_diallo_aminata");
    expect(res1.liked).toBe(true);
    expect(res1.count).toBe(initialLikes + 1);

    // Unlike
    const res2 = toggleLikeVideo("user_test_1", "vid_diallo_aminata");
    expect(res2.liked).toBe(false);
    expect(res2.count).toBe(initialLikes);
  });

  it("ajoute un commentaire et met à jour le compteur", () => {
    const video = getVideoById("vid_diallo_aminata")!;
    const initialCount = video.commentCount;

    const comment = addVideoComment(
      "user_test_2",
      "Kouamé",
      "vid_diallo_aminata",
      "Que Dieu accorde la guérison à Aminata !"
    );

    expect(comment.id).toBeDefined();
    expect(video.commentCount).toBe(initialCount + 1);
  });

  it("enregistre un signalement pour la file de modération", () => {
    const report = reportVideo(
      "user_test_3",
      "vid_diallo_aminata",
      "Suspicion d'usurpation de titre médical"
    );

    expect(report.id).toBeDefined();
    expect(report.status).toBe("OPEN");
  });
});
