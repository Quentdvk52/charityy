"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { computeSplit } from "@/modules/payments/split";
import { computeSignatureProgress } from "@/modules/signatures/service";
import { formatCurrency } from "@/lib/currency";
import { DEFAULT_GIFT_CATALOG, processGiftTransaction } from "@/modules/lives/service";

// Interface des publications vidéo courtes & cagnottes solidaires TikTok
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
  isFollowing?: boolean;
}

// Données initiales des causes du fil TikTok
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

// Liste des comptes suivis / suggérés (comme sur la barre latérale TikTok)
const SUGGESTED_ACCOUNTS = [
  { handle: "princesse_ataroi", name: "Radiaprincesse_ataroi", verified: true, role: "Ambassadrice Santé" },
  { handle: "dr_diallo", name: "Dr. Mamadou Diallo", verified: true, role: "Chirurgien CHU" },
  { handle: "noirdabordoff", name: "Noir D'Abord", verified: true, role: "Collectif Solidaire" },
  { handle: "arminel_benin", name: "Arminel NOUATIN", verified: true, role: "Forages Bénin" },
  { handle: "quentindavakan", name: "Quentin DAVAKAN", verified: true, role: "Super-Admin Fondateur" },
  { handle: "karlchill02", name: "Karlchill", verified: false, role: "Créateur Citoyen" },
  { handle: "maitrevoyant43", name: "Maitre Solidaire", verified: false, role: "Bénévole Terrain" },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"for_you" | "explore" | "following" | "friends" | "dramas" | "lives">("for_you");
  const [feedItems, setFeedItems] = useState<CampaignItem[]>(() =>
    BASE_CAMPAIGNS.map((item, idx) => ({ ...item, uniqueKey: `${item.id}_${idx}` }))
  );
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem>(BASE_CAMPAIGNS[0]!);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // État utilisateur connecté
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
    username: string;
    roles: string[];
    email?: string | null;
  } | null>(null);

  // Modales et écrans dédiés
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Onglet interne de profil
  const [profileTab, setProfileTab] = useState<"campaigns" | "donations" | "likes" | "kyc">("campaigns");

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

  // Live & Cadeaux Agora
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Bienvenue dans le direct solidaire CHARITYY.",
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
    if (scrollTop + clientHeight >= scrollHeight - 350) {
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
      setProfileDropdownOpen(false);
      setShowProfileModal(false);
      setShowAdminModal(false);
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

  // Follow dynamique
  const handleToggleFollow = (handle: string) => {
    setFeedItems((prev) =>
      prev.map((c) => (c.handle === handle ? { ...c, isFollowing: !c.isFollowing } : c))
    );
    showNotification(`Abonnement mis à jour pour @${handle}`);
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
    showNotification("🎉 Votre vidéo et cagnotte ont été publiées sur TikTok CHARITYY !");
  };

  // Cadeau live Agora
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

  // Filtrage selon l'onglet TikTok sélectionné
  const filteredFeed = feedItems.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.story.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    if (activeTab === "lives") return c.hasLive;
    if (activeTab === "following") return c.isFollowing;
    if (activeTab === "dramas") return c.category === "MEDICAL" || c.category === "DISASTER";
    return true;
  });

  const splitBreakdown = computeSplit({
    grossAmountMinor: BigInt(donationAmount),
    processorFeeMinor: BigInt(Math.round(donationAmount * 0.025)),
    hasEligibleCreator: true,
  });

  const isAdmin = currentUser?.roles.some((r) => ["SUPER_ADMIN", "ADMIN", "FINANCE", "VERIFIER"].includes(r));

  return (
    <div className="relative w-full min-h-screen bg-black text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* TOAST FLOTTANT */}
      {activeToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl backdrop-blur animate-fade-in flex items-center gap-2">
          <span>🔔</span> {activeToast}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BARRE SUPÉRIEURE TIKTOK POUR ORDINATEUR (DESKTOP NAVBAR >= 768px)       */}
      {/* ========================================================================= */}
      <header className="hidden md:flex h-16 w-full fixed top-0 left-0 bg-black/95 backdrop-blur border-b border-neutral-850 z-50 items-center justify-between px-6">
        {/* LOGO CHARITYY (Style TikTok) */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative font-black text-2xl tracking-tighter text-white flex items-center">
              <span className="text-[#25F4EE] mr-0.5 group-hover:animate-pulse">♪</span>
              <span>CHARITYY</span>
              <span className="text-[#FE2C55] text-xs font-mono ml-1 px-1.5 py-0.5 rounded bg-[#FE2C55]/20 border border-[#FE2C55]/40">
                LIVE
              </span>
            </div>
          </Link>
        </div>

        {/* BARRE DE RECHERCHE CENTRALE TIKTOK */}
        <div className="w-[320px] lg:w-[460px] relative">
          <div className="bg-neutral-900 hover:bg-neutral-850 focus-within:bg-neutral-850 border border-neutral-700/80 focus-within:border-neutral-400 rounded-full flex items-center pl-4 pr-1.5 py-1.5 transition">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des causes, créateurs, urgences..."
              className="bg-transparent text-xs text-white placeholder-neutral-400 flex-1 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white text-xs px-2">
                ✕
              </button>
            )}
            <span className="w-px h-5 bg-neutral-700 mx-1.5" />
            <button
              onClick={() => showNotification("Recherche active")}
              className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition"
              title="Rechercher"
            >
              🔍
            </button>
          </div>
        </div>

        {/* ACTIONS DE DROITE TIKTOK (Importer, Messages, Activité, Profil) */}
        <div className="flex items-center gap-3.5">
          {/* BOUTON + IMPORTER (Style TikTok Studio) */}
          <button
            onClick={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowCreateCampaignModal(true);
            }}
            className="flex items-center gap-2 border border-neutral-700 hover:bg-neutral-800/90 text-white font-bold text-xs px-4 py-2 rounded-md transition shadow-sm"
          >
            <span className="text-sm font-black">+</span>
            <span>Importer</span>
          </button>

          {/* MESSAGES (Badge 99+) */}
          <button
            onClick={() => setShowInboxModal(true)}
            className="relative p-2 rounded-full hover:bg-neutral-850 text-neutral-300 hover:text-white transition"
            title="Messages"
          >
            <span className="text-xl">✈️</span>
            <span className="absolute -top-1 -right-1 bg-[#FE2C55] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
              99+
            </span>
          </button>

          {/* ACTIVITÉ / BOÎTE DE RÉCEPTION (Badge 99+) */}
          <button
            onClick={() => setShowInboxModal(true)}
            className="relative p-2 rounded-full hover:bg-neutral-850 text-neutral-300 hover:text-white transition"
            title="Activité"
          >
            <span className="text-xl">💬</span>
            <span className="absolute -top-1 -right-1 bg-[#FE2C55] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
              99+
            </span>
          </button>

          {/* BOUTON PROFIL / CONNEXION */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-850 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#FE2C55] text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/20">
                  {currentUser.displayName.charAt(0)}
                </div>
              </button>

              {/* Menu déroulant profil */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-scale-in space-y-1">
                  <div className="p-2 border-b border-neutral-800">
                    <div className="font-bold text-xs text-white flex items-center justify-between">
                      <span>{currentUser.displayName}</span>
                      {isAdmin && (
                        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">@{currentUser.username}</div>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                  >
                    <span>👤</span> Voir le profil
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowProfileModal(true);
                      setProfileTab("donations");
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                  >
                    <span>💰</span> Portefeuille Solidaire ({formatCurrency(userWalletBalance, "XOF")})
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowAdminModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold flex items-center gap-2.5"
                    >
                      <span>👑</span> Console Super-Admin
                    </button>
                  )}

                  <div className="border-t border-neutral-800 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center gap-2.5"
                    >
                      <span>🚪</span> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-[#FE2C55] hover:bg-[#e0264b] text-white font-bold text-xs px-5 py-2 rounded-md shadow-md transition"
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BARRE LATÉRALE TIKTOK POUR ORDINATEUR (DESKTOP SIDEBAR >= 768px)       */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-[240px] xl:w-[260px] fixed top-16 left-0 bottom-0 bg-black border-r border-neutral-850 p-3 overflow-y-auto flex-col justify-between text-white z-40 select-none no-scrollbar">
        <div className="space-y-4">
          {/* Navigation principale */}
          <nav className="space-y-1 text-sm font-bold">
            <button
              onClick={() => setActiveTab("for_you")}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === "for_you" ? "text-[#FE2C55] bg-neutral-900" : "text-white hover:bg-neutral-900"
              }`}
            >
              <span className="text-xl">🏠</span>
              <span>Pour toi</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("explore");
                setShowExploreModal(true);
              }}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === "explore" ? "text-[#FE2C55] bg-neutral-900" : "text-white hover:bg-neutral-900"
              }`}
            >
              <span className="text-xl">🧭</span>
              <span>Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab("following")}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === "following" ? "text-[#FE2C55] bg-neutral-900" : "text-white hover:bg-neutral-900"
              }`}
            >
              <span className="text-xl">👥</span>
              <span>Suivis</span>
            </button>

            <button
              onClick={() => setActiveTab("friends")}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === "friends" ? "text-[#FE2C55] bg-neutral-900" : "text-white hover:bg-neutral-900"
              }`}
            >
              <span className="text-xl">🤝</span>
              <span>Amis</span>
            </button>

            <button
              onClick={() => setActiveTab("dramas")}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === "dramas" ? "text-[#FE2C55] bg-neutral-900" : "text-white hover:bg-neutral-900"
              }`}
            >
              <span className="text-xl">🎭</span>
              <span>Mini-dramas & Causes</span>
            </button>

            <button
              onClick={() => setActiveTab("lives")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                activeTab === "lives" ? "text-[#FE2C55] bg-neutral-900" : "text-white hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-xl text-red-500">📹</span>
                <span>LIVE</span>
              </div>
              <span className="bg-[#FE2C55] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                99+
              </span>
            </button>

            {/* BOUTON PROFIL DANS LA SIDEBAR DESKTOP */}
            <button
              onClick={() => {
                if (!currentUser) setShowAuthModal(true);
                else setShowProfileModal(true);
              }}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-white hover:bg-neutral-900 transition"
            >
              <span className="text-xl">👤</span>
              <span>Profil</span>
            </button>
          </nav>

          <div className="h-px bg-neutral-800" />

          {/* Section Comptes suivis / Suggérés (exactement selon votre compte TikTok) */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-neutral-400">Comptes suivis</div>
            <div className="space-y-1">
              {SUGGESTED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.handle}
                  onClick={() => setSearchQuery(acc.handle)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-900 text-left transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {acc.name.charAt(0)}
                  </div>
                  <div className="truncate flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{acc.name}</span>
                      {acc.verified && <span className="text-sky-400 text-[10px]">✓</span>}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate font-mono">@{acc.handle}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => showNotification("Tous les comptes solidaires certifiés affichés")}
              className="px-3 text-xs font-bold text-[#FE2C55] hover:underline"
            >
              Tout voir
            </button>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Section Découvrir / Hashtags */}
          <div className="space-y-2 px-3">
            <div className="text-xs font-semibold text-neutral-400">Découvrir</div>
            <div className="flex flex-wrap gap-1.5">
              {["#UrgenceCotonou", "#ChirurgieAminata", "#EauPotableZe", "#MonerooSolidarite", "#BeninSolidaire"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag.replace("#", ""))}
                  className="text-[10px] bg-neutral-900 border border-neutral-800 hover:border-neutral-600 px-2 py-1 rounded-full text-neutral-300 hover:text-white transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer légal desktop */}
        <div className="pt-4 border-t border-neutral-850 px-3 space-y-1.5 text-[11px] text-neutral-500">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <Link href="/cgu" className="hover:underline">Conditions générales</Link>
            <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
            <span className="hover:underline cursor-pointer">Programme</span>
            <span className="hover:underline cursor-pointer">Entreprise</span>
          </div>
          <div className="text-[10px] text-neutral-600 font-mono pt-1">© 2026 CHARITYY TikTok Solidarité</div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. EN-TÊTE MOBILE FLOTTANT (< 768px)                                      */}
      {/* ========================================================================= */}
      <header className="md:hidden absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-4 py-3 flex items-center justify-between pointer-events-auto">
        {/* BOUTON LIVE MOBILE */}
        <button
          onClick={() => setActiveTab("lives")}
          className="text-xs font-bold text-white flex items-center gap-1 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10"
        >
          <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-pulse" />
          <span>LIVE</span>
        </button>

        {/* ONGLETS CENTRAUX FLOTTANTS TIKTOK */}
        <nav className="flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("following")}
            className={`transition ${activeTab === "following" ? "text-white border-b-2 border-white pb-0.5" : "text-neutral-400"}`}
          >
            Suivis
          </button>
          <button
            onClick={() => setActiveTab("for_you")}
            className={`transition ${activeTab === "for_you" ? "text-white border-b-2 border-white pb-0.5" : "text-neutral-400"}`}
          >
            Pour toi
          </button>
        </nav>

        {/* RECHERCHE MOBILE */}
        <button
          onClick={() => setShowExploreModal(true)}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-sm"
        >
          🔍
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 4. ZONE PRINCIPALE DU FIL (ADAPTÉE DESKTOP & MOBILE TIKTOK)               */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full md:ml-[240px] xl:ml-[260px] md:pt-16 pb-16 md:pb-8 flex flex-col items-center">
        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="w-full h-[100dvh] md:h-auto md:max-w-2xl overflow-y-scroll md:overflow-visible snap-y snap-mandatory md:snap-none no-scrollbar flex flex-col items-center gap-0 md:gap-8 md:py-6"
        >
          {filteredFeed.length === 0 ? (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <span className="text-4xl">🔍</span>
              <h3 className="font-bold text-base">Aucune cause trouvée</h3>
              <p className="text-xs text-neutral-400 max-w-xs">
                Aucune vidéo ne correspond à votre recherche &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("for_you");
                }}
                className="bg-[#FE2C55] text-white text-xs font-bold px-4 py-2 rounded-full"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            filteredFeed.map((camp) => {
              const progressPercent = Math.min(
                100,
                Math.round((Number(camp.collectedMinor) / Number(camp.goalMinor)) * 100)
              );

              return (
                <article
                  key={camp.uniqueKey}
                  className="w-full h-full md:h-auto snap-start snap-always relative flex flex-col justify-between overflow-hidden bg-black md:bg-neutral-950 md:rounded-2xl md:p-4 md:border md:border-neutral-850 shadow-2xl"
                >
                  {/* EN-TÊTE AUTEUR EN VERSION DESKTOP */}
                  <div className="hidden md:flex items-center justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-red-500 p-0.5">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-xs">
                          {camp.authorName.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                          <span>{camp.authorName}</span>
                          {camp.isCertified && <span className="text-sky-400 text-xs">✓</span>}
                          <span className="text-[11px] text-neutral-400 font-normal">@{camp.handle}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                          <span>📍 {camp.city}</span>
                          <span>•</span>
                          <span className="text-[#25F4EE] font-medium">{camp.categoryLabel}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFollow(camp.handle)}
                      className={`text-xs font-bold px-4 py-1.5 rounded-md border transition ${
                        camp.isFollowing
                          ? "border-neutral-700 bg-neutral-900 text-neutral-300"
                          : "border-[#FE2C55] text-[#FE2C55] hover:bg-[#FE2C55]/10"
                      }`}
                    >
                      {camp.isFollowing ? "Abonné" : "Suivre"}
                    </button>
                  </div>

                  {/* DESCRIPTION / HASHTAGS EN VERSION DESKTOP */}
                  <div className="hidden md:block pb-2.5 text-xs text-neutral-300">
                    <span className="font-semibold text-white mr-1.5">{camp.title}</span>
                    <span>{camp.story}</span>
                    <span className="text-sky-400 font-medium ml-1.5">#charityy #solidarite #moneroo</span>
                    <div className="pt-1 text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
                      <span>♫ son original</span>
                      <span>-</span>
                      <span className="truncate">{camp.authorName} Solidaire</span>
                    </div>
                  </div>

                  {/* CONTENEUR VIDÉO FAÇON TIKTOK AVEC ACTIONS */}
                  <div className="relative flex-1 md:flex-initial flex items-center justify-center">
                    <div className="relative w-full md:w-[350px] lg:w-[380px] h-full md:h-[580px] bg-neutral-900 rounded-none md:rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
                      {/* FOND ANIMÉ VIDÉO LÉGER (NON CHARGÉ POUR BANDE PASSANTE) */}
                      <div
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`absolute inset-0 bg-gradient-to-b ${camp.bgGradient} flex items-center justify-center cursor-pointer`}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/70 opacity-90" />
                        <div className="absolute top-16 md:top-3 right-3 text-[10px] font-mono bg-black/60 text-neutral-300 px-2 py-0.5 rounded-full border border-white/10">
                          {camp.durationLabel} • Mode Léger
                        </div>

                        {!isPlaying && (
                          <div className="w-16 h-16 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-2xl text-white backdrop-blur shadow-2xl animate-scale-in">
                            ▶
                          </div>
                        )}
                      </div>

                      {/* BADGES HAUT SUR LA VIDÉO MOBILE */}
                      <div className="relative z-10 pt-14 md:pt-3 px-4 flex justify-between items-start pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white">
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
                            className="pointer-events-auto bg-[#FE2C55] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            LIVE ({camp.liveViewers})
                          </button>
                        )}
                      </div>

                      {/* COLONNE D'ACTIONS SUR MOBILE (OVERLAY À DROITE) */}
                      <div className="md:hidden absolute right-2.5 bottom-24 z-30 flex flex-col items-center gap-3.5 pointer-events-auto">
                        {/* Avatar */}
                        <div className="relative mb-1">
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-neutral-800 flex items-center justify-center text-xs font-bold shadow-md">
                            {camp.authorName.charAt(0)}
                          </div>
                          <button
                            onClick={() => handleToggleFollow(camp.handle)}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FE2C55] text-white text-[10px] flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Like */}
                        <button
                          onClick={() => handleLike(camp.uniqueKey || camp.id)}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div
                            className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-xl transition transform active:scale-125 ${
                              camp.isLiked ? "text-[#FE2C55]" : "text-white"
                            }`}
                          >
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
                          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg text-white">
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
                          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg text-amber-400">
                            ✍️
                          </div>
                          <span className="text-[10px] font-bold text-amber-300 shadow-sm">
                            {camp.signaturesCount}/100
                          </span>
                        </button>

                        {/* Partage */}
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            showNotification("↗️ Lien de la cause copié !");
                          }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg text-white">
                            ↗️
                          </div>
                          <span className="text-[10px] font-bold text-white shadow-sm">{camp.sharesCount}</span>
                        </button>

                        {/* Son vinyle animé */}
                        <div className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-spin-slow">
                          <span className="text-xs">💿</span>
                        </div>
                      </div>

                      {/* OVERLAY INFÉRIEUR (SUR LA VIDÉO FAÇON TIKTOK) */}
                      <div className="relative z-20 pb-4 px-4 pr-16 md:pr-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 space-y-2 pointer-events-auto">
                        {/* Auteur sur mobile */}
                        <div className="md:hidden flex items-center gap-2">
                          <span className="font-bold text-sm text-white">@{camp.handle}</span>
                          <span className="text-[11px] text-neutral-300">• 📍 {camp.city}</span>
                        </div>

                        {/* Description mobile */}
                        <div className="md:hidden space-y-1">
                          <h3 className="font-bold text-xs text-white leading-snug line-clamp-2">{camp.title}</h3>
                          <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                            {camp.story} <span className="text-sky-400 font-semibold">#charityy #don</span>
                          </p>
                        </div>

                        {/* BARRE DE PROGRESSION FINANCIÈRE */}
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

                        {/* GRAND BOUTON D'ACTION SOLIDAIRE */}
                        <div className="pt-0.5">
                          {camp.hasLive ? (
                            <button
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setShowLiveModal(true);
                              }}
                              className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
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
                    </div>

                    {/* COLONNE D'ACTIONS SUR ORDINATEUR (À CÔTÉ DU LECTEUR VIDÉO) */}
                    <div className="hidden md:flex flex-col items-center gap-4 ml-4 justify-end pb-4">
                      {/* Like */}
                      <button
                        onClick={() => handleLike(camp.uniqueKey || camp.id)}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div
                          className={`w-12 h-12 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl transition transform active:scale-125 shadow-md ${
                            camp.isLiked ? "text-[#FE2C55]" : "text-white"
                          }`}
                        >
                          {camp.isLiked ? "❤️" : "🤍"}
                        </div>
                        <span className="text-[11px] font-bold text-neutral-300">
                          {camp.likesCount >= 1000 ? `${(camp.likesCount / 1000).toFixed(1)}k` : camp.likesCount}
                        </span>
                      </button>

                      {/* Commentaires */}
                      <button
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setShowCommentsModal(true);
                        }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg text-white transition shadow-md">
                          💬
                        </div>
                        <span className="text-[11px] font-bold text-neutral-300">{camp.commentsCount}</span>
                      </button>

                      {/* Signatures citoyennes */}
                      <button
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setShowSignatureModal(true);
                        }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg text-amber-400 transition shadow-md">
                          ✍️
                        </div>
                        <span className="text-[11px] font-bold text-amber-300">{camp.signaturesCount}/100</span>
                      </button>

                      {/* Partage */}
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          showNotification("↗️ Lien copié dans le presse-papiers !");
                        }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg text-white transition shadow-md">
                          ↗️
                        </div>
                        <span className="text-[11px] font-bold text-neutral-300">{camp.sharesCount}</span>
                      </button>

                      {/* Son */}
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-neutral-300"
                        title={isMuted ? "Activer le son" : "Couper le son"}
                      >
                        {isMuted ? "🔇" : "🔊"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. BARRE DE NAVIGATION INFÉRIEURE TIKTOK POUR MOBILE (< 768px)            */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-black/95 backdrop-blur border-t border-neutral-850 z-50 flex items-center justify-around px-2 text-white">
        {/* ACCUEIL */}
        <button
          onClick={() => {
            setActiveTab("for_you");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${
            activeTab === "for_you" ? "text-white" : "text-neutral-500"
          }`}
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] font-bold">Accueil</span>
        </button>

        {/* EXPLORER */}
        <button
          onClick={() => setShowExploreModal(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${
            activeTab === "explore" ? "text-white" : "text-neutral-500"
          }`}
        >
          <span className="text-lg">🧭</span>
          <span className="text-[10px] font-bold">Explorer</span>
        </button>

        {/* BOUTON CENTRAL + CRÉER (STYLE ICONIQUE TIKTOK) */}
        <button
          onClick={() => {
            if (!currentUser) setShowAuthModal(true);
            else setShowCreateCampaignModal(true);
          }}
          className="flex items-center justify-center px-2"
          aria-label="Créer une cagnotte"
        >
          <div className="tiktok-plus-btn shadow-lg">
            <span className="text-black font-black text-lg leading-none">+</span>
          </div>
        </button>

        {/* BOÎTE DE RÉCEPTION / MESSAGES */}
        <button
          onClick={() => setShowInboxModal(true)}
          className="relative flex flex-col items-center justify-center gap-0.5 flex-1 text-neutral-500 hover:text-white"
        >
          <span className="text-lg">💬</span>
          <span className="text-[10px] font-bold">Boîte de réc.</span>
          <span className="absolute top-0 right-4 bg-[#FE2C55] text-white text-[8px] font-black px-1 rounded-full">
            99+
          </span>
        </button>

        {/* BOUTON PROFIL (EXACTEMENT DEMANDÉ PAR L'UTILISATEUR) */}
        <button
          onClick={() => {
            if (!currentUser) setShowAuthModal(true);
            else setShowProfileModal(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 text-neutral-500 hover:text-white"
        >
          {currentUser ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-[#FE2C55] flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
              {currentUser.displayName.charAt(0)}
            </div>
          ) : (
            <span className="text-lg">👤</span>
          )}
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 6. MODALES ET ÉCRANS COMPLETS                                             */}
      {/* ========================================================================= */}

      {/* MODAL 1 : ÉCRAN DE PROFIL TIKTOK COMPLET */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 md:p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Profil */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/60">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">{currentUser.displayName}</span>
                {isAdmin && (
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Corps du profil */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
              {/* Avatar et identifiant */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#25F4EE] via-amber-500 to-[#FE2C55] p-1 shadow-xl">
                  <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-2xl font-bold">
                    {currentUser.displayName.charAt(0)}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center justify-center gap-1">
                    <span>{currentUser.displayName}</span>
                    <span className="text-sky-400 text-xs">✓</span>
                  </h3>
                  <div className="text-xs text-neutral-400 font-mono">@{currentUser.username}</div>
                </div>
              </div>

              {/* Statistiques TikTok (Abonnements, Abonnés, J'aime, Dons) */}
              <div className="flex justify-around text-center py-2 border-y border-neutral-800">
                <div>
                  <div className="font-black text-sm text-white">42</div>
                  <div className="text-[10px] text-neutral-400">Abonnements</div>
                </div>
                <div className="w-px bg-neutral-800" />
                <div>
                  <div className="font-black text-sm text-white">1.8k</div>
                  <div className="text-[10px] text-neutral-400">Abonnés</div>
                </div>
                <div className="w-px bg-neutral-800" />
                <div>
                  <div className="font-black text-sm text-white">24.5k</div>
                  <div className="text-[10px] text-neutral-400">J&apos;aime</div>
                </div>
                <div className="w-px bg-neutral-800" />
                <div>
                  <div className="font-black text-sm text-emerald-400 font-mono">50k F</div>
                  <div className="text-[10px] text-neutral-400">Solde Wallet</div>
                </div>
              </div>

              {/* Solde Portefeuille & Recharge Mobile Money Bénin */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-black border border-emerald-500/30 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                    Portefeuille Solidaire
                  </span>
                  <span className="text-[10px] text-neutral-400">Crédit immédiat</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {formatCurrency(userWalletBalance, "XOF")}
                </div>

                {rechargeSuccess && (
                  <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300 font-medium">
                    {rechargeSuccess}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleRechargeWallet(10000, "MTN Bénin")}
                    className="p-1.5 rounded-lg bg-black/60 border border-neutral-800 hover:border-yellow-500 text-left text-[11px]"
                  >
                    <div className="text-yellow-500 font-bold">MTN Bénin</div>
                    <div className="font-mono text-neutral-300">+10 000 F</div>
                  </button>
                  <button
                    onClick={() => handleRechargeWallet(25000, "Moov Bénin")}
                    className="p-1.5 rounded-lg bg-black/60 border border-neutral-800 hover:border-blue-400 text-left text-[11px]"
                  >
                    <div className="text-blue-400 font-bold">Moov Bénin</div>
                    <div className="font-mono text-neutral-300">+25 000 F</div>
                  </button>
                  <button
                    onClick={() => handleRechargeWallet(50000, "Wave")}
                    className="p-1.5 rounded-lg bg-black/60 border border-neutral-800 hover:border-sky-400 text-left text-[11px]"
                  >
                    <div className="text-sky-400 font-bold">Wave</div>
                    <div className="font-mono text-neutral-300">+50 000 F</div>
                  </button>
                </div>
              </div>

              {/* Bouton d'action Admin si habilité */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowAdminModal(true);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <span>👑</span> Ouvrir la Console Super-Admin (Double Approbation)
                </button>
              )}

              {/* Onglets internes du profil */}
              <div className="border-t border-neutral-800 pt-3">
                <div className="flex border-b border-neutral-800 text-xs font-bold text-neutral-400">
                  <button
                    onClick={() => setProfileTab("campaigns")}
                    className={`flex-1 pb-2 transition ${profileTab === "campaigns" ? "text-white border-b-2 border-white" : ""}`}
                  >
                    Mes Cagnottes
                  </button>
                  <button
                    onClick={() => setProfileTab("donations")}
                    className={`flex-1 pb-2 transition ${profileTab === "donations" ? "text-white border-b-2 border-white" : ""}`}
                  >
                    Mes Dons
                  </button>
                  <button
                    onClick={() => setProfileTab("likes")}
                    className={`flex-1 pb-2 transition ${profileTab === "likes" ? "text-white border-b-2 border-white" : ""}`}
                  >
                    Aimées
                  </button>
                  <button
                    onClick={() => setProfileTab("kyc")}
                    className={`flex-1 pb-2 transition ${profileTab === "kyc" ? "text-white border-b-2 border-white" : ""}`}
                  >
                    Pièces KYC
                  </button>
                </div>

                <div className="pt-3 text-xs text-neutral-400">
                  {profileTab === "campaigns" && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-black/40 border border-neutral-800">
                        <div className="font-bold text-white">Forage solaire pour 3 200 écoliers à Zè</div>
                        <div className="text-[11px] text-emerald-400 font-mono">5 620 000 / 7 500 000 XOF (75%)</div>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileModal(false);
                          setShowCreateCampaignModal(true);
                        }}
                        className="w-full py-2 rounded-xl border border-dashed border-neutral-700 hover:border-white text-white font-bold text-xs"
                      >
                        + Lancer une nouvelle cagnotte
                      </button>
                    </div>
                  )}

                  {profileTab === "donations" && (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">Chirurgie Aminata (CHU)</div>
                          <div className="text-[10px] text-neutral-500">Reçu fiscal #REC-2026-9482</div>
                        </div>
                        <span className="font-bold font-mono text-emerald-400">-10 000 FCFA</span>
                      </div>
                    </div>
                  )}

                  {profileTab === "likes" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-black/50 border border-neutral-800 text-[11px] text-white">
                        ❤️ Chirurgie Pédiatrique CHU
                      </div>
                      <div className="p-2 rounded bg-black/50 border border-neutral-800 text-[11px] text-white">
                        ❤️ Forage solaire Zè Bénin
                      </div>
                    </div>
                  )}

                  {profileTab === "kyc" && (
                    <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">Identité Bénin (CIP / CNI)</span>
                        <span className="text-emerald-400 font-bold text-[10px]">✓ VALIDÉ</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Vos pièces sont vérifiées et archivées de façon chiffrée selon les normes bancaires.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton de déconnexion */}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : MESSAGES & BOÎTE DE RÉCEPTION TIKTOK */}
      {showInboxModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 md:p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/60">
              <div>
                <h3 className="font-bold text-sm">Boîte de réception & Activité</h3>
                <span className="text-[10px] text-neutral-400">Notifications solidaires en temps réel</span>
              </div>
              <button
                onClick={() => setShowInboxModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs no-scrollbar">
              <div className="p-3 bg-black/40 border border-neutral-800 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  💰
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">Reçu de don validé</div>
                  <p className="text-neutral-400 text-[11px]">
                    Votre don de 10 000 FCFA a bien été reçu et affecté à l&apos;Urgence Pédiatrique Aminata.
                  </p>
                  <span className="text-[10px] text-neutral-500 block pt-1">Il y a 10 minutes</span>
                </div>
              </div>

              <div className="p-3 bg-black/40 border border-neutral-800 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FE2C55]/20 text-[#FE2C55] flex items-center justify-center font-bold shrink-0">
                  🔴
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">Dr. Mamadou Diallo est en DIRECT</div>
                  <p className="text-neutral-400 text-[11px]">
                    Rejoignez le live chirurgical et suivez l&apos;évolution des opérations en direct.
                  </p>
                  <span className="text-[10px] text-neutral-500 block pt-1">Il y a 25 minutes</span>
                </div>
              </div>

              <div className="p-3 bg-black/40 border border-neutral-800 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  ✍️
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">Signature citoyenne certifiée</div>
                  <p className="text-neutral-400 text-[11px]">
                    Votre signature anti-fraude pour le forage de Zè a été validée par le nœud de vérification.
                  </p>
                  <span className="text-[10px] text-neutral-500 block pt-1">Il y a 1 heure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 : EXPLORER & RECHERCHE */}
      {showExploreModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 md:p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/60">
              <h3 className="font-bold text-sm">Explorer les causes solidaires</h3>
              <button
                onClick={() => setShowExploreModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs overflow-y-auto no-scrollbar">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, ville, hôpital..."
                className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white"
              />

              <div className="space-y-2">
                <label className="text-neutral-400 font-semibold text-[11px] block">Catégories d&apos;impact :</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "🚨 Urgence Médicale", key: "chirurgie" },
                    { label: "💧 Eau & Climat", key: "eau" },
                    { label: "📚 Éducation", key: "classe" },
                    { label: "👶 Maternité", key: "couveuse" },
                    { label: "🚨 Urgence Sinistrés", key: "inondations" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setSearchQuery(cat.key);
                        setShowExploreModal(false);
                      }}
                      className="p-2 rounded-lg bg-black/60 border border-neutral-800 hover:border-[#FE2C55] text-left text-xs font-medium text-white transition"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-neutral-400 font-semibold text-[11px] block">Par Pays & Localisation :</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Bénin", "Cotonou", "Abidjan", "Dakar", "Lomé", "Douala"].map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSearchQuery(city);
                        setShowExploreModal(false);
                      }}
                      className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-[11px]"
                    >
                      📍 {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4 : CONNEXION SÉCURISÉE (AUCUNE DONNÉE DE TEST VISIBLE) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-6 space-y-4 border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Connexion à votre compte</h3>
                <span className="text-[10px] text-neutral-400">Accédez à votre espace en toute sécurité</span>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm"
              >
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
                className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white py-2.5 rounded-lg font-bold text-xs transition disabled:opacity-50 shadow-md"
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

      {/* MODAL 5 : COMMENTAIRES EN BOTTOM SHEET TIKTOK */}
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
              <button type="submit" className="bg-[#FE2C55] text-white font-bold text-xs px-4 py-2 rounded-xl">
                Publier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6 : TUNNEL DE DON MONEROO & SPLIT TRANSPARENT */}
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
                      📱 Mobile Money (Wave, MTN, Moov)
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
                  className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white py-3 rounded-xl font-bold text-xs transition shadow"
                >
                  Confirmer le don de {formatCurrency(BigInt(donationAmount), "XOF")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 7 : SIGNATURES CITOYENNES ANTI-FRAUDE */}
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
                className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white py-2.5 rounded-xl font-bold text-xs transition shadow"
              >
                Valider ma signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8 : DIRECT SOLIDAIRE (AGORA RTC & CADEAUX) */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col max-w-md mx-auto w-full text-white">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/80">
            <div>
              <span className="text-xs font-bold text-[#FE2C55] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
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
              <span>
                Solde wallet : <strong className="text-white font-mono">{formatCurrency(userWalletBalance, "XOF")}</strong>
              </span>
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
              <button
                type="submit"
                className="bg-[#FE2C55] text-white text-xs font-bold px-4 rounded-xl hover:bg-[#e0264b]"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9 : IMPORTER / CRÉER UNE CAGNOTTE (TIKTOK STUDIO) */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Téléverser une vidéo solidaire</h3>
                <span className="text-[10px] text-neutral-400">Diffusion instantanée dans le fil TikTok</span>
              </div>
              <button onClick={() => setShowCreateCampaignModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3 text-xs">
              {/* Zone Drag & Drop Vidéo TikTok */}
              <div className="border-2 border-dashed border-neutral-700 hover:border-[#FE2C55] rounded-xl p-4 text-center cursor-pointer transition bg-black/40">
                <span className="text-2xl block mb-1">📹</span>
                <span className="text-xs font-bold block text-white">Sélectionner une vidéo à téléverser</span>
                <span className="text-[10px] text-neutral-400 block pt-0.5">MP4 ou WebM • 720p minimum</span>
              </div>

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
                className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white py-3 rounded-xl font-bold text-xs transition shadow"
              >
                Publier la vidéo solidaire
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10 : CONSOLE D'ADMINISTRATION GÉNÉRALE (POUR ADMIN) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
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
