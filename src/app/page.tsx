"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { computeSplit } from "@/modules/payments/split";
import { computeSignatureProgress } from "@/modules/signatures/service";
import { formatCurrency } from "@/lib/currency";
import { DEFAULT_GIFT_CATALOG, processGiftTransaction } from "@/modules/lives/service";

// Interface des publications vidéo courtes & cagnottes du fil TikTok
interface CampaignItem {
  id: string;
  uniqueKey?: string;
  handle: string;
  title: string;
  story: string;
  authorName: string;
  authorRole: string;
  city: string;
  countryCode: string;
  category: "MEDICAL" | "WATER" | "EDUCATION" | "MATERNITY" | "DISASTER";
  categoryLabel: string;
  currency: string;
  goalMinor: bigint;
  collectedMinor: bigint;
  isCertified: boolean;
  isUrgent: boolean;
  hasLive: boolean;
  liveHostName?: string;
  liveViewers?: number;
  bgGradient: string;
  durationLabel: string;
  signaturesCount: number;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount: number;
  commentsList: Array<{ user: string; text: string; time: string }>;
}

// Données initiales pour le fil vidéo court
const BASE_CAMPAIGNS: CampaignItem[] = [
  {
    id: "camp_urgence_diallo",
    handle: "dr_diallo",
    title: "Urgence vitale : Chirurgie pédiatrique à cœur ouvert pour Aminata",
    story:
      "Aminata, 6 ans, a besoin d'une intervention chirurgicale immédiate au CHU. Devis médical et pièces cliniques certifiés.",
    authorName: "Dr. Mamadou Diallo",
    authorRole: "Chirurgien pédiatrique",
    city: "Abidjan",
    countryCode: "CI",
    category: "MEDICAL",
    categoryLabel: "🚨 Urgence Médicale",
    currency: "XOF",
    goalMinor: 5_000_000n,
    collectedMinor: 3_850_000n,
    isCertified: true,
    isUrgent: true,
    hasLive: true,
    liveHostName: "Dr. Mamadou Diallo",
    liveViewers: 142,
    bgGradient: "from-red-950 via-neutral-900 to-black",
    durationLabel: "0:48",
    signaturesCount: 92,
    likesCount: 2480,
    commentsCount: 184,
    sharesCount: 620,
    commentsList: [
      { user: "Arminel NOUATIN", text: "Je soutiens de tout cœur cette opération. Don effectué !", time: "Il y a 5m" },
      { user: "Awa Traoré", text: "Courage à la petite Aminata et merci au Dr. Diallo.", time: "Il y a 20m" },
      { user: "Dr. Koffi", text: "Dossier médical et devis clinique validés.", time: "Il y a 1h" },
    ],
  },
  {
    id: "camp_eau_benin",
    handle: "arminel_benin",
    title: "Accès eau potable : Forage solaire pour 3 200 écoliers à Zè",
    story:
      "Les enfants parcourent 4 km par jour pour trouver de l'eau. Ce château d'eau solaire alimentera l'école et le dispensaire.",
    authorName: "Arminel NOUATIN",
    authorRole: "Coordination Citoyenne",
    city: "Zè / Cotonou",
    countryCode: "BJ",
    category: "WATER",
    categoryLabel: "💧 Eau & Climat",
    currency: "XOF",
    goalMinor: 7_500_000n,
    collectedMinor: 5_620_000n,
    isCertified: true,
    isUrgent: false,
    hasLive: false,
    bgGradient: "from-cyan-950 via-neutral-900 to-black",
    durationLabel: "1:15",
    signaturesCount: 100,
    likesCount: 1920,
    commentsCount: 96,
    sharesCount: 410,
    commentsList: [
      { user: "Quentin DAVAKAN", text: "Projet exemplaire et vérifié. Bravo pour l'engagement terrain !", time: "Il y a 10m" },
      { user: "Sœur Jeanne", text: "Le dispensaire de Zè attend ce raccordement avec impatience.", time: "Il y a 2h" },
    ],
  },
  {
    id: "camp_ecole_senegal",
    handle: "fatima_sow",
    title: "Éducation : Reconstruction de 3 salles de classe détruites",
    story:
      "Suite aux intempéries, 140 écoliers étudient sous des bâches. Financement de toitures en alu et tables-bancs neufs.",
    authorName: "Fatima Sow",
    authorRole: "Comité Parents d'Élèves",
    city: "Thiès / Dakar",
    countryCode: "SN",
    category: "EDUCATION",
    categoryLabel: "📚 Éducation",
    currency: "XOF",
    goalMinor: 3_200_000n,
    collectedMinor: 1_650_000n,
    isCertified: false,
    isUrgent: false,
    hasLive: false,
    bgGradient: "from-amber-950 via-neutral-900 to-black",
    durationLabel: "0:56",
    signaturesCount: 64,
    likesCount: 940,
    commentsCount: 48,
    sharesCount: 175,
    commentsList: [
      { user: "Moussa Diop", text: "J'ai signé en tant que personne ressource de Thiès !", time: "Il y a 40m" },
      { user: "Aminata B.", text: "Nos enfants méritent d'étudier dans la dignité.", time: "Il y a 3h" },
    ],
  },
  {
    id: "camp_maternite_togo",
    handle: "dr_mensah",
    title: "Santé Maternelle : 2 couveuses pour les bébés prématurés",
    story:
      "La maternité manque de couveuses vitales. Réduisons ensemble la mortalité néonatale avec du matériel aux normes.",
    authorName: "Dr. Koffi Mensah",
    authorRole: "Pédiatre Référent",
    city: "Lomé",
    countryCode: "TG",
    category: "MATERNITY",
    categoryLabel: "👶 Maternité",
    currency: "XOF",
    goalMinor: 4_200_000n,
    collectedMinor: 2_950_000n,
    isCertified: true,
    isUrgent: true,
    hasLive: true,
    liveHostName: "Dr. Koffi Mensah",
    liveViewers: 86,
    bgGradient: "from-purple-950 via-neutral-900 to-black",
    durationLabel: "1:02",
    signaturesCount: 88,
    likesCount: 1540,
    commentsCount: 82,
    sharesCount: 330,
    commentsList: [
      { user: "Yawa A.", text: "Sauver des nouveau-nés est la plus noble des causes.", time: "Il y a 20m" },
      { user: "Arminel NOUATIN", text: "Don solidaire envoyé via mon wallet Bénin.", time: "Il y a 45m" },
    ],
  },
  {
    id: "camp_sinistres_cameroun",
    title: "Urgence Sinistrés : Secours et relogement pour 45 familles inondées",
    handle: "solidarite_littoral",
    story:
      "Distribution de kits d'urgence, vivres et abris temporaires après les inondations du quartier Makèpè.",
    authorName: "Collectif Littoral",
    authorRole: "Secours Citoyens",
    city: "Douala",
    countryCode: "CM",
    category: "DISASTER",
    categoryLabel: "🚨 Urgence Sinistrés",
    currency: "XOF",
    goalMinor: 6_000_000n,
    collectedMinor: 4_900_000n,
    isCertified: true,
    isUrgent: true,
    hasLive: true,
    liveHostName: "Collectif Littoral",
    liveViewers: 215,
    bgGradient: "from-orange-950 via-neutral-900 to-black",
    durationLabel: "0:42",
    signaturesCount: 98,
    likesCount: 3120,
    commentsCount: 210,
    sharesCount: 890,
    commentsList: [
      { user: "Samuel E.", text: "Présent sur le terrain avec les bénévoles. Merci aux donateurs !", time: "Il y a 5m" },
      { user: "Chantal M.", text: "Kits alimentaires bien distribués aux mamans ce matin.", time: "Il y a 30m" },
    ],
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"for_you" | "local" | "urgencies" | "lives">("for_you");
  const [feedItems, setFeedItems] = useState<CampaignItem[]>(() =>
    BASE_CAMPAIGNS.map((item, idx) => ({ ...item, uniqueKey: `${item.id}_${idx}` }))
  );
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem>(BASE_CAMPAIGNS[0]!);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // État utilisateur connecté
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
    username: string;
    roles: string[];
    email?: string | null;
  } | null>(null);

  // Modales
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserSpaceModal, setShowUserSpaceModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Formulaire d'authentification sécurisé (aucun mot de passe ni identifiant public)
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Portefeuille utilisateur
  const [userWalletBalance, setUserWalletBalance] = useState<bigint>(50000n);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);

  // Création de cagnotte
  const [newTitle, setNewTitle] = useState("");
  const [newGoal, setNewGoal] = useState<number>(3000000);
  const [newCategory, setNewCategory] = useState<"MEDICAL" | "WATER" | "EDUCATION" | "MATERNITY" | "DISASTER">("EDUCATION");
  const [newCity, setNewCity] = useState("Cotonou, Bénin");
  const [newStory, setNewStory] = useState("");

  // Don
  const [donationAmount, setDonationAmount] = useState<number>(10000);
  const [selectedMethod, setSelectedMethod] = useState<"mobile_money" | "card">("mobile_money");
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Live & Cadeaux
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Bienvenue dans le direct solidaire.",
    "Merci à tous les donateurs et signataires !",
  ]);
  const [liveChatInput, setLiveChatInput] = useState("");
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);

  // Commentaires
  const [newCommentInput, setNewCommentInput] = useState("");

  const feedRef = useRef<HTMLDivElement>(null);

  // Vérifier la session au démarrage
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const showNotification = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  };

  // Scroll infini (ajoute de nouveaux éléments quand on approche du bas)
  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      // Duplication et génération infinie continue façon TikTok
      setFeedItems((prev) => {
        const nextBatch = BASE_CAMPAIGNS.map((c, i) => ({
          ...c,
          uniqueKey: `${c.id}_gen_${Date.now()}_${i}`,
        }));
        return [...prev, ...nextBatch];
      });
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      showNotification("Vous êtes déconnecté.");
    } catch {}
  };

  // Connexion sécurisée
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: authIdentifier, password: authPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Identifiant ou mot de passe incorrect.");
        setAuthLoading(false);
        return;
      }

      setCurrentUser(data.user);
      setShowAuthModal(false);
      setAuthLoading(false);
      setAuthIdentifier("");
      setAuthPassword("");
      showNotification(`Bienvenue, ${data.user.displayName} !`);
    } catch {
      setAuthError("Erreur réseau lors de la connexion.");
      setAuthLoading(false);
    }
  };

  // Like dynamique
  const handleLike = (uniqueKey: string) => {
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.uniqueKey === uniqueKey) {
          const isLiked = !item.isLiked;
          return {
            ...item,
            isLiked,
            likesCount: isLiked ? item.likesCount + 1 : item.likesCount - 1,
          };
        }
        return item;
      })
    );
  };

  // Commentaire dynamique
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;

    const authorName = currentUser?.displayName || "Citoyen Solidaire";
    const newEntry = {
      user: authorName,
      text: newCommentInput.trim(),
      time: "À l'instant",
    };

    setFeedItems((prev) =>
      prev.map((c) =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              commentsCount: c.commentsCount + 1,
              commentsList: [newEntry, ...c.commentsList],
            }
          : c
      )
    );

    setSelectedCampaign((prev) => ({
      ...prev,
      commentsCount: prev.commentsCount + 1,
      commentsList: [newEntry, ...prev.commentsList],
    }));

    setNewCommentInput("");
  };

  // Signer
  const handleSignCampaign = () => {
    setFeedItems((prev) =>
      prev.map((c) =>
        c.id === selectedCampaign.id && c.signaturesCount < 100
          ? { ...c, signaturesCount: c.signaturesCount + 1 }
          : c
      )
    );
    setSelectedCampaign((prev) => ({
      ...prev,
      signaturesCount: Math.min(100, prev.signaturesCount + 1),
    }));
    setShowSignatureModal(false);
    showNotification("✍️ Signature citoyenne enregistrée avec succès !");
  };

  // Recharger le portefeuille
  const handleRechargeWallet = (amount: number, providerName: string) => {
    setUserWalletBalance((prev) => prev + BigInt(amount));
    setRechargeSuccess(`+${amount.toLocaleString()} FCFA crédités via ${providerName} !`);
    setTimeout(() => setRechargeSuccess(null), 4000);
  };

  // Créer une nouvelle cagnotte
  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStory.trim()) return;

    const categoryLabels: Record<string, string> = {
      MEDICAL: "🚨 Urgence Médicale",
      WATER: "💧 Eau & Climat",
      EDUCATION: "📚 Éducation",
      MATERNITY: "👶 Maternité",
      DISASTER: "🚨 Urgence Sinistrés",
    };

    const newCamp: CampaignItem = {
      id: `camp_${Date.now()}`,
      uniqueKey: `camp_${Date.now()}_new`,
      handle: currentUser?.username || "citoyen_benin",
      title: newTitle.trim(),
      story: newStory.trim(),
      authorName: currentUser?.displayName || "Porteur Citoyen",
      authorRole: "Porteur Vérifié",
      city: newCity,
      countryCode: "BJ",
      category: newCategory,
      categoryLabel: categoryLabels[newCategory] || "Solidarité",
      currency: "XOF",
      goalMinor: BigInt(newGoal),
      collectedMinor: 0n,
      isCertified: false,
      isUrgent: newCategory === "MEDICAL" || newCategory === "DISASTER",
      hasLive: false,
      bgGradient: "from-emerald-950 via-neutral-900 to-black",
      durationLabel: "0:45",
      signaturesCount: 1,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      commentsList: [],
    };

    setFeedItems((prev) => [newCamp, ...prev]);
    setSelectedCampaign(newCamp);
    setShowCreateCampaignModal(false);
    setNewTitle("");
    setNewStory("");
    showNotification("🎉 Votre cagnotte a été publiée dans le fil TikTok !");
  };

  // Envoyer un cadeau en direct
  const handleSendGift = (giftId: string) => {
    const result = processGiftTransaction({
      senderId: currentUser?.id || "usr_guest",
      receiverId: "creator_diallo",
      giftId,
      senderWalletBalanceMinor: userWalletBalance,
    });

    if (result.success) {
      setUserWalletBalance(result.newSenderBalanceMinor);
      setActiveGiftAnimation(`🎁 ${result.gift.name} offert (-${result.gift.priceMinor} XOF)`);
      setChatMessages((prev) => [
        ...prev,
        `🎁 ${currentUser?.displayName || "Vous"} a offert un ${result.gift.name}.`,
      ]);
      setTimeout(() => setActiveGiftAnimation(null), 3000);
    } else {
      alert(result.error);
    }
  };

  // Message chat en direct
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    setChatMessages((prev) => [...prev, `${currentUser?.displayName || "Vous"} : ${liveChatInput.trim()}`]);
    setLiveChatInput("");
  };

  // Filtrage par onglet
  const filteredFeed = feedItems.filter((c) => {
    if (activeTab === "urgencies") return c.isUrgent;
    if (activeTab === "lives") return c.hasLive;
    if (activeTab === "local") return c.city.includes("Abidjan") || c.city.includes("Bénin") || c.city.includes("Cotonou");
    return true;
  });

  const splitBreakdown = computeSplit({
    grossAmountMinor: BigInt(donationAmount),
    processorFeeMinor: BigInt(Math.round(donationAmount * 0.025)),
    hasEligibleCreator: true,
  });

  const signatureProgress = computeSignatureProgress(
    Array.from({ length: selectedCampaign.signaturesCount }, (_, i) => ({
      id: `sig_${i}`,
      campaignId: selectedCampaign.id,
      signerId: `usr_${i}`,
      kind: (i < 40 ? "RELATIVE" : i < 70 ? "RESOURCE_PERSON" : "COMMUNITY") as any,
      createdAt: new Date(),
    }))
  );

  const isAdmin = currentUser?.roles.some((r) => ["SUPER_ADMIN", "ADMIN", "FINANCE", "VERIFIER"].includes(r));

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-black text-white overflow-hidden flex flex-col select-none shadow-2xl">
      {/* TOAST FLOTTANT */}
      {activeToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white/90 text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur animate-fade-in">
          {activeToast}
        </div>
      )}

      {/* 1. EN-TÊTE TRANSPARENT FLOTTANT SUR LA VIDÉO FAÇON TIKTOK */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-3 py-2.5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tighter text-base text-white">CHARITYY</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        </div>

        {/* ONGLETS FLOTTANTS CENTRAUX */}
        <nav className="flex items-center gap-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab("for_you")}
            className={`transition ${activeTab === "for_you" ? "text-white border-b-2 border-white pb-0.5" : "text-neutral-400 hover:text-white"}`}
          >
            Pour toi
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`transition ${activeTab === "local" ? "text-white border-b-2 border-white pb-0.5" : "text-neutral-400 hover:text-white"}`}
          >
            Local
          </button>
          <button
            onClick={() => setActiveTab("urgencies")}
            className={`transition ${activeTab === "urgencies" ? "text-red-400 border-b-2 border-red-500 pb-0.5 font-extrabold" : "text-neutral-400 hover:text-white"}`}
          >
            Urgences
          </button>
          <button
            onClick={() => setActiveTab("lives")}
            className={`transition ${activeTab === "lives" ? "text-red-500 border-b-2 border-red-500 pb-0.5 font-extrabold flex items-center gap-1" : "text-neutral-400 hover:text-white"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Lives
          </button>
        </nav>

        {/* ACCÈS COMPTE / ESPACE CONNECTÉ */}
        <div>
          {currentUser ? (
            <button
              onClick={() => (isAdmin ? setShowAdminModal(true) : setShowUserSpaceModal(true))}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow backdrop-blur transition ${
                isAdmin ? "bg-red-600/90 hover:bg-red-600 text-white" : "bg-emerald-600/90 hover:bg-emerald-600 text-white"
              }`}
            >
              <span>{isAdmin ? "👑 Admin" : "👤 Espace"}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[11px] font-bold bg-white text-black px-3 py-1 rounded-full hover:bg-neutral-200 transition shadow"
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* 2. FIL VIDÉO VERTICAL INFINI AVEC DÉFILEMENT MAGNÉTIQUE (SNAP TIKTOK) */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar relative"
      >
        {filteredFeed.map((camp) => {
          const progressPercent = Math.min(100, Math.round((Number(camp.collectedMinor) / Number(camp.goalMinor)) * 100));

          return (
            <section
              key={camp.uniqueKey}
              className="h-full w-full snap-start snap-always relative flex flex-col justify-between overflow-hidden bg-neutral-950"
            >
              {/* ARRIÈRE-PLAN VIDÉO LÉGER & FLUIDE (SIMULÉ, NON CHARGÉ POUR ÉCONOMIE DE DONNÉES) */}
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className={`absolute inset-0 bg-gradient-to-b ${camp.bgGradient} flex items-center justify-center cursor-pointer`}
              >
                {/* Décor cinématique d'onde vidéo */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-black/60 opacity-80" />
                <div className="absolute top-20 right-4 text-[10px] font-mono bg-black/50 text-neutral-400 px-2 py-0.5 rounded-full border border-white/10">
                  {camp.durationLabel} • Mode Léger
                </div>

                {!isPlaying && (
                  <div className="w-16 h-16 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-2xl text-white backdrop-blur shadow-2xl animate-scale-in">
                    ▶
                  </div>
                )}
              </div>

              {/* OVERLAY D'INFORMATIONS SUPÉRIEURES */}
              <div className="relative z-10 pt-14 px-4 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white">
                    {camp.categoryLabel}
                  </span>
                  {camp.isCertified && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/80 text-white flex items-center gap-1 shadow">
                      ✓ Certifiée
                    </span>
                  )}
                </div>

                {camp.hasLive && (
                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setShowLiveModal(true);
                    }}
                    className="pointer-events-auto bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE ({camp.liveViewers})
                  </button>
                )}
              </div>

              {/* COLONNE D'ACTIONS LATÉRALE DROITE (STYLE TIKTOK) */}
              <div className="absolute right-2.5 bottom-28 z-30 flex flex-col items-center gap-3.5 pointer-events-auto">
                {/* Avatar Auteur */}
                <div className="relative mb-1">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-neutral-800 flex items-center justify-center text-xs font-bold shadow-md">
                    {camp.authorName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                    +
                  </div>
                </div>

                {/* Like */}
                <button
                  onClick={() => handleLike(camp.uniqueKey || camp.id)}
                  className="flex flex-col items-center gap-0.5 group"
                >
                  <div className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-xl transition transform active:scale-125 ${
                    camp.isLiked ? "text-red-500" : "text-white"
                  }`}>
                    {camp.isLiked ? "❤️" : "🤍"}
                  </div>
                  <span className="text-[10px] font-bold text-white shadow-sm">
                    {camp.likesCount >= 1000 ? `${(camp.likesCount / 1000).toFixed(1)}k` : camp.likesCount}
                  </span>
                </button>

                {/* Commentaires */}
                <button
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setShowCommentsModal(true);
                  }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg text-white transition active:scale-110">
                    💬
                  </div>
                  <span className="text-[10px] font-bold text-white shadow-sm">{camp.commentsCount}</span>
                </button>

                {/* Signatures citoyennes */}
                <button
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setShowSignatureModal(true);
                  }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg text-amber-400 transition active:scale-110">
                    ✍️
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 shadow-sm">{camp.signaturesCount}/100</span>
                </button>

                {/* Partage */}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showNotification("↗️ Lien de la cause copié dans le presse-papiers !");
                  }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg text-white transition active:scale-110">
                    ↗️
                  </div>
                  <span className="text-[10px] font-bold text-white shadow-sm">{camp.sharesCount}</span>
                </button>

                {/* Son */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-xs text-neutral-300"
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
              </div>

              {/* OVERLAY D'INFORMATIONS DU BAS (SUR LA VIDÉO FAÇON TIKTOK) */}
              <div className="relative z-20 pb-4 px-4 pr-16 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 space-y-2 pointer-events-auto">
                {/* Auteur & Ville */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">@{camp.handle}</span>
                  <span className="text-[11px] text-neutral-300">• 📍 {camp.city}</span>
                </div>

                {/* Titre et description compacte */}
                <h3 className="font-bold text-xs text-white leading-snug line-clamp-2">
                  {camp.title}
                </h3>
                <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                  {camp.story} <span className="text-sky-400 font-semibold">#solidarite #charityy #don</span>
                </p>

                {/* Barre de collecte financière transparente */}
                <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/15 space-y-1.5 shadow-lg">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <div>
                      <span className="font-extrabold text-emerald-400 font-mono text-xs">
                        {formatCurrency(camp.collectedMinor, camp.currency)}
                      </span>
                      <span className="text-neutral-400"> / {formatCurrency(camp.goalMinor, camp.currency)}</span>
                    </div>
                    <span className="font-mono font-bold text-white text-[11px]">{progressPercent}%</span>
                  </div>

                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* GRAND BOUTON SOLIDAIRE PRINCIPAL */}
                <div className="pt-0.5">
                  {camp.hasLive ? (
                    <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setShowLiveModal(true);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      REJOINDRE LE LIVE ({camp.liveViewers} spectateurs)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setShowDonateModal(true);
                      }}
                      className="w-full bg-white text-black hover:bg-neutral-200 font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <span>🤝</span> Faire un don solidaire (Moneroo)
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* MODAL 1 : CONNEXION SÉCURISÉE (AUCUNE DONNÉE DE TEST VISIBLE) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-6 space-y-4 border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Connexion à votre espace</h3>
                <span className="text-[10px] text-neutral-400">Accédez à votre compte en toute sécurité</span>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-neutral-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-300 font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Email ou Numéro de téléphone
                </label>
                <input
                  type="text"
                  required
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  placeholder="votre.email@exemple.com ou +229..."
                  className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-white text-black py-2.5 rounded-lg font-bold text-xs hover:bg-neutral-200 transition disabled:opacity-50"
              >
                {authLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-neutral-800">
              <Link
                href="/login"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Accéder à la page complète de connexion / inscription
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : COMMENTAIRES EN BOTTOM SHEET TIKTOK */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-t-2xl p-4 space-y-3 border-t border-neutral-800 max-h-[70vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2.5">
              <div>
                <h4 className="font-bold text-xs text-white">Commentaires ({selectedCampaign.commentsCount})</h4>
                <span className="text-[10px] text-neutral-400 truncate block max-w-[280px]">
                  {selectedCampaign.title}
                </span>
              </div>
              <button onClick={() => setShowCommentsModal(false)} className="text-neutral-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {selectedCampaign.commentsList.map((comm, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-black/40 border border-neutral-800 space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-white">{comm.user}</span>
                    <span className="text-[10px] text-neutral-500">{comm.time}</span>
                  </div>
                  <p className="text-neutral-300">{comm.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-neutral-800">
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Ajouter un commentaire solidaire..."
                className="flex-1 bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-white text-black font-bold text-xs px-4 py-2 rounded-xl">
                Publier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : TUNNEL DE DON MONEROO & SPLIT TRANSPARENT */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Faire un don solidaire</h3>
                <span className="text-[10px] text-neutral-400 block truncate max-w-[280px]">
                  Pour : {selectedCampaign.title}
                </span>
              </div>
              <button onClick={() => setShowDonateModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            {donationSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-sm">Don validé & inscrit au Grand Livre</h4>
                <p className="text-xs text-neutral-400">
                  L&apos;écriture comptable a été enregistrée de façon immuable dans le ledger en partie double.
                </p>
                <button
                  onClick={() => {
                    setDonationSuccess(false);
                    setShowDonateModal(false);
                  }}
                  className="w-full bg-white text-black py-2.5 rounded-lg font-bold text-xs"
                >
                  Retourner au fil
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Montant :</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2000, 5000, 10000, 25000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`py-2 text-xs font-mono rounded-lg border transition ${
                          donationAmount === amt
                            ? "border-white bg-white text-black font-bold"
                            : "border-neutral-800 bg-neutral-800 text-white"
                        }`}
                      >
                        {amt.toLocaleString()} F
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Moyen de paiement :</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMethod("mobile_money")}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition ${
                        selectedMethod === "mobile_money"
                          ? "border-emerald-500 bg-emerald-500/10 font-bold"
                          : "border-neutral-800 text-neutral-400"
                      }`}
                    >
                      📱 Mobile Money (Wave, MTN, Orange, Moov)
                    </button>
                    <button
                      onClick={() => setSelectedMethod("card")}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition ${
                        selectedMethod === "card"
                          ? "border-emerald-500 bg-emerald-500/10 font-bold"
                          : "border-neutral-800 text-neutral-400"
                      }`}
                    >
                      💳 Carte Bancaire (Visa, Mastercard)
                    </button>
                  </div>
                </div>

                {/* Ventilation financière transparente */}
                <div className="bg-black/40 p-3 rounded-xl text-xs space-y-1 border border-neutral-800">
                  <div className="font-bold text-neutral-300">Ventilation du don :</div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Montant versé :</span>
                    <span className="font-mono font-semibold">{formatCurrency(splitBreakdown.grossAmountMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Frais processeur Moneroo :</span>
                    <span className="font-mono">-{formatCurrency(splitBreakdown.processorFeeMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Frais plateforme (3%) :</span>
                    <span className="font-mono">-{formatCurrency(splitBreakdown.platformFeeMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Part créateur (2%) :</span>
                    <span className="font-mono">-{formatCurrency(splitBreakdown.creatorShareMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-neutral-800 pt-1 text-white">
                    <span>Attribué au bénéficiaire :</span>
                    <span className="font-mono text-emerald-400">
                      {formatCurrency(splitBreakdown.beneficiaryAmountMinor, "XOF")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDonationSuccess(true)}
                  className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-neutral-200 transition shadow"
                >
                  Confirmer le don de {formatCurrency(BigInt(donationAmount), "XOF")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4 : SIGNATURES CITOYENNES */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Signature citoyenne anti-fraude</h3>
                <span className="text-[10px] text-neutral-400 block truncate max-w-[250px]">
                  {selectedCampaign.title}
                </span>
              </div>
              <button onClick={() => setShowSignatureModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300">
                Chaque signature est liée à une empreinte anti-sybil. À 100 signatures vérifiées, la cagnotte passe
                en validation communautaire.
              </p>

              <div className="space-y-1">
                <label className="font-semibold block text-neutral-400">Votre qualité :</label>
                <select className="w-full border border-neutral-700 p-2 rounded-lg text-xs bg-black text-white">
                  <option value="COMMUNITY">Membre de la communauté / Citoyen</option>
                  <option value="RELATIVE">Proche / Ami de la famille</option>
                  <option value="RESOURCE_PERSON">Personne ressource (Médecin, Enseignant)</option>
                </select>
              </div>

              <button
                onClick={handleSignCampaign}
                className="w-full bg-white text-black py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-200 transition shadow"
              >
                Valider ma signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5 : DIRECT SOLIDAIRE (AGORA RTC & CADEAUX) */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col max-w-md mx-auto w-full text-white">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/80">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                EN DIRECT SOLIDAIRE
              </span>
              <span className="text-xs text-neutral-300">
                Hôte : {selectedCampaign.liveHostName || selectedCampaign.authorName}
              </span>
            </div>
            <button
              onClick={() => setShowLiveModal(false)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-medium"
            >
              Quitter
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-neutral-950 p-4">
            <div className="text-center space-y-2 text-neutral-400">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto text-2xl shadow-inner">
                🎥
              </div>
              <p className="text-xs font-medium text-neutral-300">Flux vidéo Agora RTC interactif (faible latence)</p>
              <p className="text-[11px] text-neutral-500">
                Canal actif : <code className="text-neutral-400">{selectedCampaign.id}</code>
              </p>
            </div>

            {activeGiftAnimation && (
              <div className="absolute top-1/4 bg-black/80 px-4 py-2 rounded-full border border-white/20 text-xs font-bold animate-bounce text-emerald-400">
                {activeGiftAnimation}
              </div>
            )}
          </div>

          <div className="h-40 bg-black/70 p-3 overflow-y-auto space-y-1.5 text-xs border-t border-white/10">
            {chatMessages.map((msg, i) => (
              <p key={i} className="text-neutral-200">
                {msg}
              </p>
            ))}
          </div>

          <div className="p-3 bg-neutral-900 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Solde wallet : <strong className="text-white font-mono">{formatCurrency(userWalletBalance, "XOF")}</strong></span>
              <span className="text-[10px] text-neutral-400">Cadeaux = Débit ledger immédiat</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {DEFAULT_GIFT_CATALOG.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift.id)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-left shrink-0 border border-white/10 text-xs min-w-[90px] transition"
                >
                  <div className="font-semibold text-white">{gift.name}</div>
                  <div className="text-[10px] text-neutral-400">{gift.priceMinor.toString()} F</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={liveChatInput}
                onChange={(e) => setLiveChatInput(e.target.value)}
                placeholder="Écrire un message en direct..."
                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-white text-black text-xs font-bold px-4 rounded-xl hover:bg-neutral-200">
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6 : ESPACE CITOYEN & WALLET (POUR UTILISATEUR CONNECTÉ) */}
      {showUserSpaceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Mon Espace Citoyen</h3>
                <span className="text-[10px] text-neutral-400 block">{currentUser?.displayName}</span>
              </div>
              <button onClick={() => setShowUserSpaceModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            {/* Solde Wallet */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/60 to-black border border-emerald-500/30 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
                Solde de mon Portefeuille Solidaire
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(userWalletBalance, "XOF")}
              </div>
            </div>

            {rechargeSuccess && (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 font-medium">
                {rechargeSuccess}
              </div>
            )}

            {/* Recharges rapides */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 block">
                Recharger mon portefeuille (Mobile Money Bénin) :
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleRechargeWallet(10000, "MTN Bénin")}
                  className="p-2 border border-neutral-800 rounded-lg bg-black text-xs font-semibold hover:border-emerald-500 transition text-left"
                >
                  <div className="text-yellow-500 font-bold">MTN Bénin</div>
                  <div className="text-[11px] font-mono">+10 000 F</div>
                </button>
                <button
                  onClick={() => handleRechargeWallet(25000, "Moov Bénin")}
                  className="p-2 border border-neutral-800 rounded-lg bg-black text-xs font-semibold hover:border-emerald-500 transition text-left"
                >
                  <div className="text-blue-400 font-bold">Moov Bénin</div>
                  <div className="text-[11px] font-mono">+25 000 F</div>
                </button>
                <button
                  onClick={() => handleRechargeWallet(50000, "Wave")}
                  className="p-2 border border-neutral-800 rounded-lg bg-black text-xs font-semibold hover:border-emerald-500 transition text-left"
                >
                  <div className="text-sky-400 font-bold">Wave</div>
                  <div className="text-[11px] font-mono">+50 000 F</div>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <button
                onClick={() => {
                  setShowUserSpaceModal(false);
                  setShowCreateCampaignModal(true);
                }}
                className="w-full bg-white text-black py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-200 transition shadow"
              >
                ➕ Lancer une nouvelle cagnotte solidaire
              </button>
              <button
                onClick={handleLogout}
                className="w-full border border-neutral-800 py-2 rounded-xl text-neutral-400 hover:text-white text-xs"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7 : CRÉATION DE CAGNOTTE CITOYENNE */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Lancer une cagnotte solidaire</h3>
                <span className="text-[10px] text-neutral-400">Diffusion instantanée dans le fil TikTok</span>
              </div>
              <button onClick={() => setShowCreateCampaignModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Titre de votre cause :</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Forage solaire pour Parakou"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block text-neutral-300 mb-1">Objectif (FCFA) :</label>
                  <input
                    type="number"
                    required
                    value={newGoal}
                    onChange={(e) => setNewGoal(Number(e.target.value))}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-neutral-300 mb-1">Catégorie :</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-2.5 py-2 text-white"
                  >
                    <option value="MEDICAL">Urgence Médicale</option>
                    <option value="WATER">Eau & Climat</option>
                    <option value="EDUCATION">Éducation</option>
                    <option value="MATERNITY">Maternité</option>
                    <option value="DISASTER">Urgence Sinistrés</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Localisation :</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ex: Cotonou, Bénin"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Histoire de la cause :</label>
                <textarea
                  required
                  rows={3}
                  value={newStory}
                  onChange={(e) => setNewStory(e.target.value)}
                  placeholder="Expliquez la situation, le devis hospitalier ou associatif..."
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-neutral-200 transition shadow"
              >
                Publier la vidéo dans le fil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8 : CONSOLE D'ADMINISTRATION GÉNÉRALE (POUR ADMIN) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Console d&apos;Administration</h3>
                <span className="text-[10px] text-neutral-400">
                  {currentUser?.displayName} (SUPER_ADMIN)
                </span>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-black rounded-xl border border-neutral-800">
                  <div className="text-neutral-400">Dossiers KYC</div>
                  <div className="text-lg font-bold text-white">12</div>
                </div>
                <div className="p-3 bg-black rounded-xl border border-neutral-800">
                  <div className="text-neutral-400">Retraits &gt; 1M F</div>
                  <div className="text-lg font-bold text-emerald-400">2</div>
                </div>
              </div>

              <div className="border border-neutral-800 rounded-xl p-3 space-y-2 bg-black/40">
                <div className="font-semibold text-neutral-300">File de double approbation retraits :</div>
                <div className="p-2 rounded bg-neutral-900 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-bold text-white">Dr. Mamadou Diallo</span>
                    <span className="text-neutral-500 block">2 500 000 FCFA</span>
                  </div>
                  <button
                    onClick={() => {
                      alert("Virement approuvé par l'administrateur général.");
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-bold"
                  >
                    Valider
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full border border-neutral-800 py-2 rounded-xl text-neutral-400 hover:text-white text-xs"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
