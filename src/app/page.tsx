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
  isFavorited?: boolean;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  commentsList: Array<{ user: string; text: string; time: string }>;
  isFollowing?: boolean;
  isFundraiser?: boolean;
  videoUrl?: string;
  proofs?: Array<{ name: string; size: string }>;
}

// Interface d'un profil de créateur ou utilisateur
interface CreatorProfile {
  handle: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  city: string;
  countryCode: string;
  bio: string;
  verified: boolean;
  isLive: boolean;
  liveViewers?: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isFollowing: boolean;
  officialDoc: string;
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
    viewsCount: 38400,
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
    viewsCount: 24500,
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
    viewsCount: 12800,
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
    viewsCount: 18900,
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
    viewsCount: 42100,
    commentsList: [
      { user: "Samuel E.", text: "Présent sur le terrain avec les bénévoles. Merci aux donateurs !", time: "Il y a 5m" },
      { user: "Chantal M.", text: "Kits alimentaires bien distribués aux mamans ce matin.", time: "Il y a 30m" },
    ],
  },
  {
    id: "camp_alerte_inondation",
    title: "Alerte Citoyenne : Pont dégradé et route coupée après les pluies",
    handle: "citoyen_alerte",
    story:
      "Témoignage citoyen : le ponceau du quartier est effondré, les écoliers ne peuvent plus traverser en sécurité. Signalement public pour sécurisation d'urgence par les services de voirie.",
    authorName: "Koffi Agbossou",
    authorRole: "Lanceur d'Alerte Citoyen",
    city: "Cotonou",
    countryCode: "BJ",
    category: "DISASTER",
    categoryLabel: "📢 Alerte Citoyenne",
    currency: "XOF",
    goalMinor: 0n,
    collectedMinor: 0n,
    isFundraiser: false,
    isCertified: false,
    isUrgent: true,
    hasLive: false,
    bgGradient: "from-sky-950 via-neutral-900 to-black",
    durationLabel: "0:36",
    signaturesCount: 142,
    likesCount: 980,
    commentsCount: 64,
    sharesCount: 412,
    viewsCount: 12400,
    commentsList: [
      { user: "Arminel NOUATIN", text: "Situation très risquée pour les enfants le matin. Soutien total à l'alerte !", time: "Il y a 10m" },
      { user: "Ablawa V.", text: "Partagé pour faire réagir rapidement la municipalité !", time: "Il y a 25m" },
    ],
  },
];

// Base de données des profils créateurs consultables
const CREATORS_DIRECTORY: Record<string, CreatorProfile> = {
  dr_diallo: {
    handle: "dr_diallo",
    name: "Dr. Mamadou Diallo",
    role: "Chirurgien pédiatrique au CHU",
    city: "Abidjan",
    countryCode: "CI",
    bio: "Chirurgien pédiatrique au CHU. Engagé pour opérer les enfants défavorisés d'Afrique de l'Ouest. Toutes les causes publiées sont certifiées par devis médical.",
    verified: true,
    isLive: true,
    liveViewers: 142,
    followersCount: 24500,
    followingCount: 68,
    likesCount: 89400,
    isFollowing: false,
    officialDoc: "CHU-PEDIATRIE-CERT-2026",
  },
  arminel_benin: {
    handle: "arminel_benin",
    name: "Arminel NOUATIN",
    role: "Coordination Citoyenne Forages",
    city: "Zè / Cotonou",
    countryCode: "BJ",
    bio: "Citoyen engagé pour l'accès universel à l'eau potable au Bénin. Chaque forage solaire alimente une école et un dispensaire. Donateur actif.",
    verified: true,
    isLive: false,
    followersCount: 18200,
    followingCount: 142,
    likesCount: 46700,
    isFollowing: true,
    officialDoc: "ONG-EAU-BENIN-RECEPISSE-941",
  },
  quentindavakan: {
    handle: "quentindavakan",
    name: "Quentin DAVAKAN",
    role: "Super-Admin & Fondateur CHARITYY",
    city: "Cotonou",
    countryCode: "BJ",
    bio: "Fondateur & Administrateur Général CHARITYY. Sécurisation cryptographique, audit anti-fraude et traçabilité intégrale des cagnottes solidaires.",
    verified: true,
    isLive: false,
    followersCount: 54300,
    followingCount: 38,
    likesCount: 142000,
    isFollowing: false,
    officialDoc: "CHARITYY-GOV-SUPERADMIN-KEY-001",
  },
  princesse_ataroi: {
    handle: "princesse_ataroi",
    name: "Radiaprincesse_ataroi",
    role: "Ambassadrice Santé & Solidarité",
    city: "Cotonou",
    countryCode: "BJ",
    bio: "Créatrice de contenu engagée. Sensibilisation pour les urgences néonatales et pédiatriques. Ensemble pour sauver des vies !",
    verified: true,
    isLive: false,
    followersCount: 31200,
    followingCount: 210,
    likesCount: 92400,
    isFollowing: true,
    officialDoc: "AMBASSADEUR-CERTIFIE-BJ",
  },
  noirdabordoff: {
    handle: "noirdabordoff",
    name: "Noir D'Abord",
    role: "Collectif d'Action Solidaire",
    city: "Cotonou",
    countryCode: "BJ",
    bio: "Collectif panafricain d'entraide et de secours d'urgence. Solidarité directe sans intermédiaires inutiles.",
    verified: true,
    isLive: false,
    followersCount: 41800,
    followingCount: 85,
    likesCount: 110500,
    isFollowing: true,
    officialDoc: "COLLECTIF-BENIN-ENREG-2024",
  },
  karlchill02: {
    handle: "karlchill02",
    name: "Karlchill",
    role: "Créateur Citoyen Bénin",
    city: "Porto-Novo",
    countryCode: "BJ",
    bio: "Récits immersifs sur le terrain. Découverte des initiatives citoyennes et cagnottes locales vérifiées.",
    verified: false,
    isLive: false,
    followersCount: 12400,
    followingCount: 195,
    likesCount: 34100,
    isFollowing: false,
    officialDoc: "CREATOR-KYC-PENDING",
  },
  fatima_sow: {
    handle: "fatima_sow",
    name: "Fatima Sow",
    role: "Comité Parents d'Élèves",
    city: "Thiès / Dakar",
    countryCode: "SN",
    bio: "Éducation et scolarisation des filles au Sénégal. Rénovation d'écoles rurales et fournitures scolaires pour tous.",
    verified: false,
    isLive: false,
    followersCount: 8400,
    followingCount: 92,
    likesCount: 18900,
    isFollowing: false,
    officialDoc: "ECOLE-THIES-APE-2026",
  },
  dr_mensah: {
    handle: "dr_mensah",
    name: "Dr. Koffi Mensah",
    role: "Pédiatre Référent Maternité",
    city: "Lomé",
    countryCode: "TG",
    bio: "Pédiatre à la maternité centrale de Lomé. Combat quotidien contre la mortalité néonatale.",
    verified: true,
    isLive: true,
    liveViewers: 86,
    followersCount: 15600,
    followingCount: 45,
    likesCount: 41200,
    isFollowing: false,
    officialDoc: "ORDRE-MEDECINS-TG-748",
  },
  solidarite_littoral: {
    handle: "solidarite_littoral",
    name: "Collectif Littoral",
    role: "Secours Citoyens Inondations",
    city: "Douala",
    countryCode: "CM",
    bio: "Aide d'urgence aux familles sinistrées des inondations du Littoral camerounais. Relogement et vivres.",
    verified: true,
    isLive: true,
    liveViewers: 215,
    followersCount: 22100,
    followingCount: 110,
    likesCount: 67300,
    isFollowing: true,
    officialDoc: "SECOURS-CIVIL-LITTORAL-CM",
  },
  citoyen_alerte: {
    handle: "citoyen_alerte",
    name: "Koffi Agbossou",
    role: "Lanceur d'Alerte Citoyen",
    city: "Cotonou",
    countryCode: "BJ",
    bio: "Citoyen engagé pour la sécurité locale, la voirie et le signalement d'urgences collectives. Publications d'alerte et de sensibilisation.",
    verified: false,
    isLive: false,
    followersCount: 1240,
    followingCount: 38,
    likesCount: 4500,
    isFollowing: false,
    officialDoc: "SIGNALEMENT-CITOYEN-VALIDATION",
  },
};

// Liste des comptes suivis / suggérés pour la barre latérale
const SUGGESTED_ACCOUNTS = [
  { handle: "princesse_ataroi", name: "Radiaprincesse_ataroi", verified: true, role: "Ambassadrice Santé" },
  { handle: "dr_diallo", name: "Dr. Mamadou Diallo", verified: true, role: "Chirurgien CHU" },
  { handle: "noirdabordoff", name: "Noir D'Abord", verified: true, role: "Collectif Solidaire" },
  { handle: "arminel_benin", name: "Arminel NOUATIN", verified: true, role: "Forages Bénin" },
  { handle: "quentindavakan", name: "Quentin DAVAKAN", verified: true, role: "Super-Admin Fondateur" },
  { handle: "karlchill02", name: "Karlchill", verified: false, role: "Créateur Citoyen" },
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

  // Photo de profil & Personnalisation utilisateur (avec persistence locale)
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userBio, setUserBio] = useState<string>("Solidaire et engagé pour les causes d'urgence en Afrique de l'Ouest 🌍");
  const [userCity, setUserCity] = useState<string>("Cotonou, Bénin");
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Modales et écrans dédiés
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCreatorProfileModal, setShowCreatorProfileModal] = useState(false);
  const [viewedCreator, setViewedCreator] = useState<CreatorProfile | null>(null);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [directMessageText, setDirectMessageText] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [showInboxModal, setShowInboxModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Onglet interne de profil utilisateur
  const [profileTab, setProfileTab] = useState<"videos" | "favorites" | "likes" | "donations" | "kyc">("videos");
  // Onglet interne du profil créateur consulté
  const [creatorTab, setCreatorTab] = useState<"videos" | "proofs" | "signatures">("videos");

  // Champs de modification de profil
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBioText, setEditBioText] = useState("");
  const [editCityText, setEditCityText] = useState("");

  // Formulaire d'authentification sécurisé
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Portefeuille utilisateur
  const [userWalletBalance, setUserWalletBalance] = useState<bigint>(50000n);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);

  // Création & publication vidéo (simple alerte ou cagnotte solidaire)
  const [newTitle, setNewTitle] = useState("");
  const [isFundraiser, setIsFundraiser] = useState(false);
  const [newGoal, setNewGoal] = useState<number>(3000000);
  const [newCategory, setNewCategory] = useState<"MEDICAL" | "WATER" | "EDUCATION" | "MATERNITY" | "DISASTER">("EDUCATION");
  const [newCity, setNewCity] = useState("Cotonou, Bénin");
  const [newStory, setNewStory] = useState("");
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedProofFiles, setUploadedProofFiles] = useState<Array<{ name: string; size: string }>>([]);
  const [proofHonorCertified, setProofHonorCertified] = useState(false);

  // Références d'inputs pour sélection vidéo, caméra et pièces justificatives
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  // Don
  const [donationAmount, setDonationAmount] = useState<number>(10000);
  const [selectedMethod, setSelectedMethod] = useState<"mobile_money" | "card">("mobile_money");
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Live & Cadeaux Agora (TikTok Live Experience)
  const [showStartLiveModal, setShowStartLiveModal] = useState(false);
  const [isLiveBroadcaster, setIsLiveBroadcaster] = useState(false);
  const [liveTitleInput, setLiveTitleInput] = useState("");
  const [liveCampaignSelection, setLiveCampaignSelection] = useState<string>("free");
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(0);
  const [liveTotalRaised, setLiveTotalRaised] = useState(15000);
  const [liveViewerCount, setLiveViewerCount] = useState(142);
  const [liveLikesCount, setLiveLikesCount] = useState(2450);
  const [isLocalMicMuted, setIsLocalMicMuted] = useState(false);
  const [isLocalCameraOff, setIsLocalCameraOff] = useState(false);
  const [activeGuests, setActiveGuests] = useState<
    Array<{ id: string; name: string; handle: string; isMuted: boolean }>
  >([]);
  const [coHostRequests, setCoHostRequests] = useState<
    Array<{ id: string; name: string; handle: string }>
  >([]);
  const [hasRequestedToJoin, setHasRequestedToJoin] = useState(false);
  const [showLiveSummaryModal, setShowLiveSummaryModal] = useState(false);
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<
    Array<{ id: number; emoji: string; left: number }>
  >([]);
  const [liveSummaryData, setLiveSummaryData] = useState<{
    title: string;
    duration: string;
    viewers: number;
    raised: number;
    likes: number;
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [chatMessages, setChatMessages] = useState<string[]>([
    "Bienvenue dans le direct solidaire CHARITYY.",
    "Merci à tous les donateurs et signataires !",
  ]);
  const [liveChatInput, setLiveChatInput] = useState("");
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);

  // Commentaires
  const [newCommentInput, setNewCommentInput] = useState("");

  const feedRef = useRef<HTMLDivElement>(null);

  // Charger la session et les données persistées au démarrage
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setEditDisplayName(data.user.displayName);
          setEditUsername(data.user.username);
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const savedAvatar = localStorage.getItem("charityy_user_avatar");
      if (savedAvatar) setUserAvatar(savedAvatar);

      const savedBio = localStorage.getItem("charityy_user_bio");
      if (savedBio) setUserBio(savedBio);

      const savedCity = localStorage.getItem("charityy_user_city");
      if (savedCity) setUserCity(savedCity);

      const savedFavs = localStorage.getItem("charityy_favorites");
      if (savedFavs) {
        try {
          setFavoritesList(JSON.parse(savedFavs));
        } catch {}
      }
    }
  }, []);

  // Chronomètre de diffusion du direct TikTok
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (showLiveModal) {
      interval = setInterval(() => {
        setLiveDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setLiveDurationSeconds(0);
      setHasRequestedToJoin(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showLiveModal]);

  // Formatage de la durée du live (MM:SS)
  const formatLiveDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Gestion du flux caméra/webcam réel
  useEffect(() => {
    if ((showLiveModal && isLiveBroadcaster) || showStartLiveModal) {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(() => {
            // Mode sans webcam physique
          });
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    }
  }, [showLiveModal, isLiveBroadcaster, showStartLiveModal]);

  const showNotification = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  };

  // Chargement de la photo de profil (Avatar Upload)
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("⚠️ La photo ne doit pas dépasser 5 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Img = reader.result as string;
        setUserAvatar(base64Img);
        if (typeof window !== "undefined") {
          localStorage.setItem("charityy_user_avatar", base64Img);
        }
        showNotification("📸 Photo de profil mise à jour avec succès !");
      };
      reader.readAsDataURL(file);
    }
  };

  // Enregistrer les modifications du profil
  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) return;

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        displayName: editDisplayName.trim(),
        username: editUsername.trim() || currentUser.username,
      });
    }
    setUserBio(editBioText.trim());
    setUserCity(editCityText.trim());

    if (typeof window !== "undefined") {
      localStorage.setItem("charityy_user_bio", editBioText.trim());
      localStorage.setItem("charityy_user_city", editCityText.trim());
    }

    setShowEditProfileModal(false);
    showNotification("✅ Profil mis à jour avec succès !");
  };

  // Ouvrir le profil d'un créateur du fil ou de la barre latérale
  const handleOpenCreatorProfile = (handle: string) => {
    const creator = CREATORS_DIRECTORY[handle] || {
      handle,
      name: handle.charAt(0).toUpperCase() + handle.slice(1),
      role: "Créateur Citoyen Solidaire",
      city: "Cotonou, Bénin",
      countryCode: "BJ",
      bio: "Créateur engagé sur CHARITYY pour la transparence et l'entraide communautaire.",
      verified: true,
      isLive: false,
      followersCount: 5400,
      followingCount: 88,
      likesCount: 14200,
      isFollowing: false,
      officialDoc: "REG-COMMUNITY-VAL-2026",
    };

    setViewedCreator(creator);
    setCreatorTab("videos");
    setShowCreatorProfileModal(true);
  };

  // Toggle follow d'un créateur
  const handleToggleFollowCreator = (handle: string) => {
    if (viewedCreator && viewedCreator.handle === handle) {
      const updatedFollowing = !viewedCreator.isFollowing;
      setViewedCreator({
        ...viewedCreator,
        isFollowing: updatedFollowing,
        followersCount: updatedFollowing
          ? viewedCreator.followersCount + 1
          : viewedCreator.followersCount - 1,
      });
    }

    setFeedItems((prev) =>
      prev.map((c) => (c.handle === handle ? { ...c, isFollowing: !c.isFollowing } : c))
    );

    showNotification(`Abonnement mis à jour pour @${handle}`);
  };

  // Envoi d'un message direct à un créateur
  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMessageText.trim()) return;

    showNotification(`Message direct envoyé à @${viewedCreator?.handle} !`);
    setDirectMessageText("");
    setShowDirectMessageModal(false);
  };

  // Scroll infini TikTok
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
      setEditDisplayName(data.user.displayName);
      setEditUsername(data.user.username);
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

  // Favoris / Bookmark dynamique
  const handleToggleFavorite = (campaignId: string) => {
    setFavoritesList((prev) => {
      const isFav = prev.includes(campaignId);
      const updated = isFav ? prev.filter((id) => id !== campaignId) : [...prev, campaignId];
      if (typeof window !== "undefined") {
        localStorage.setItem("charityy_favorites", JSON.stringify(updated));
      }
      showNotification(isFav ? "Signet retiré des favoris." : "🔖 Ajouté à vos favoris !");
      return updated;
    });

    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === campaignId ? { ...item, isFavorited: !item.isFavorited } : item
      )
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

  // Gestion sélection vidéo (Fichier ou Caméra directe)
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        showNotification("⚠️ La vidéo dépasse la taille maximale autorisée de 200 Mo.");
        return;
      }
      setUploadedVideoFile(file);
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      showNotification(`📹 Vidéo chargée : ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} Mo)`);
    }
  };

  // Gestion des pièces justificatives / preuves
  const handleProofFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles: Array<{ name: string; size: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f) continue;
        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
        const sizeLabel = f.size > 1024 * 1024 ? `${sizeMb} Mo` : `${Math.round(f.size / 1024)} Ko`;
        newFiles.push({ name: f.name, size: sizeLabel });
      }
      setUploadedProofFiles((prev) => [...prev, ...newFiles]);
      showNotification(`📎 ${newFiles.length} justificatif(s) ajouté(s)`);
    }
  };

  const handleRemoveProofFile = (index: number) => {
    setUploadedProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Créer et publier une nouvelle vidéo (simple alerte ou cagnotte solidaire)
  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStory.trim()) {
      showNotification("⚠️ Veuillez renseigner le titre et l'explication du sujet.");
      return;
    }

    if (isFundraiser && (!newGoal || newGoal <= 0)) {
      showNotification("⚠️ Veuillez spécifier un montant d'objectif valide.");
      return;
    }

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
      authorRole: isFundraiser ? "Porteur de Cagnotte" : "Lanceur d'Alerte Citoyen",
      city: newCity.trim() || "Cotonou, Bénin",
      countryCode: "BJ",
      category: newCategory,
      categoryLabel: isFundraiser
        ? (categoryLabels[newCategory] || "Solidarité")
        : "📢 Alerte Citoyenne",
      currency: "XOF",
      goalMinor: isFundraiser ? BigInt(newGoal) : 0n,
      collectedMinor: 0n,
      isCertified: false,
      isUrgent: isFundraiser ? (newCategory === "MEDICAL" || newCategory === "DISASTER") : true,
      hasLive: false,
      bgGradient: isFundraiser
        ? "from-emerald-950 via-neutral-900 to-black"
        : "from-sky-950 via-neutral-900 to-black",
      durationLabel: "0:45",
      signaturesCount: 1,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 1,
      commentsList: [],
      isFundraiser: isFundraiser,
      videoUrl: uploadedVideoUrl || undefined,
      proofs: uploadedProofFiles.length > 0 ? uploadedProofFiles : undefined,
    };

    setFeedItems((prev) => [newCamp, ...prev]);
    setSelectedCampaign(newCamp);
    setShowCreateCampaignModal(false);
    setNewTitle("");
    setNewStory("");
    setIsFundraiser(false);
    setUploadedVideoFile(null);
    setUploadedVideoUrl(null);
    setUploadedProofFiles([]);
    setProofHonorCertified(false);

    showNotification(
      isFundraiser
        ? "🎉 Votre cagnotte solidaire et ses justificatifs ont été publiés sur CHARITYY !"
        : "🎉 Votre vidéo d'alerte citoyenne a été publiée dans le fil TikTok !"
    );
  };

  // Cadeau live Agora & Débit Portefeuille
  const handleSendGift = (giftId: string) => {
    const result = processGiftTransaction({
      senderId: currentUser?.id || "usr_guest",
      receiverId: selectedCampaign.handle || "dr_diallo",
      giftId,
      senderWalletBalanceMinor: userWalletBalance,
    });

    if (result.success) {
      setUserWalletBalance(result.newSenderBalanceMinor);
      setLiveTotalRaised((prev) => prev + Number(result.gift.priceMinor));
      setActiveGiftAnimation(`🎁 ${result.gift.name} offert (+${result.gift.priceMinor} XOF)`);
      setChatMessages((prev) => [
        ...prev,
        `🎁 ${currentUser?.displayName || "Vous"} a offert un ${result.gift.name} (${result.gift.priceMinor} FCFA) !`,
      ]);
      showNotification(`🎁 ${result.gift.name} envoyé à l'hôte avec succès !`);
      setTimeout(() => setActiveGiftAnimation(null), 3500);
    } else {
      showNotification(`⚠️ ${result.error || "Solde portefeuille insuffisant."}`);
    }
  };

  // Clic/Tap sur l'écran du live -> Cœurs flottants TikTok
  const handleLiveTap = (e?: React.MouseEvent<any>) => {
    const emojis = ["❤️", "💖", "🔥", "✨", "💎", "🌟", "🌹"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)] || "❤️";
    const randomLeft = 20 + Math.random() * 60;
    const heartId = Date.now() + Math.random();

    setFloatingHearts((prev) => [...prev, { id: heartId, emoji: randomEmoji, left: randomLeft }]);
    setLiveLikesCount((prev) => prev + 1);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 1800);
  };

  // Demander à monter sur scène (Spectateur TikTok)
  const handleRequestCoHost = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setHasRequestedToJoin(true);
    setChatMessages((prev) => [
      ...prev,
      `🙋‍♂️ ${currentUser.displayName} a demandé à monter sur scène en direct !`,
    ]);
    showNotification("⏳ Demande envoyée à l'hôte. En attente d'approbation...");

    // En mode spectateur pour le test, simuler l'approbation de l'hôte après 2s
    setTimeout(() => {
      setActiveGuests((prev) => {
        if (prev.some((g) => g.id === currentUser.id)) return prev;
        return [
          ...prev,
          {
            id: currentUser.id,
            name: currentUser.displayName,
            handle: currentUser.username,
            isMuted: false,
          },
        ];
      });
      setChatMessages((prev) => [
        ...prev,
        `🎉 ${currentUser.displayName} est monté sur scène avec l'hôte !`,
      ]);
      showNotification("🎉 L'hôte a accepté votre demande ! Vous êtes en direct sur scène (écran divisé).");
    }, 2000);
  };

  // Accepter un invité sur scène (Hôte TikTok)
  const handleAcceptCoHost = (guest: { id: string; name: string; handle: string }) => {
    setCoHostRequests((prev) => prev.filter((r) => r.id !== guest.id));
    setActiveGuests((prev) => [
      ...prev,
      {
        id: guest.id,
        name: guest.name,
        handle: guest.handle,
        isMuted: false,
      },
    ]);
    setChatMessages((prev) => [
      ...prev,
      `🎉 @${guest.handle} est monté sur scène en direct !`,
    ]);
    showNotification(`🎉 Vous avez fait monter @${guest.handle} sur scène (écran divisé) !`);
  };

  // Refuser un invité (Hôte TikTok)
  const handleRejectCoHost = (guestId: string) => {
    setCoHostRequests((prev) => prev.filter((r) => r.id !== guestId));
    showNotification("Demande de scène refusée.");
  };

  // Faire descendre un invité ou quitter la scène
  const handleRemoveGuest = (guestId: string) => {
    setActiveGuests((prev) => prev.filter((g) => g.id !== guestId));
    if (currentUser?.id === guestId) {
      setHasRequestedToJoin(false);
      showNotification("Vous êtes descendu de scène.");
    } else {
      showNotification("Invité descendu de scène.");
    }
    setChatMessages((prev) => [...prev, "🚪 Un participant est descendu de scène."]);
  };

  // Lancer le LIVE (Créateur TikTok Studio)
  const handleStartLiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const title = liveTitleInput.trim() || `Direct solidaire de ${currentUser.displayName}`;
    setIsLiveBroadcaster(true);
    setLiveDurationSeconds(0);
    setLiveTotalRaised(0);
    setLiveViewerCount(38);
    setLiveLikesCount(120);
    setActiveGuests([]);
    setHasRequestedToJoin(false);

    // Si une cause existante est liée, l'utiliser comme selectedCampaign
    const linked = feedItems.find((c) => c.id === liveCampaignSelection);
    if (linked) {
      setSelectedCampaign({
        ...linked,
        hasLive: true,
        liveHostName: currentUser.displayName,
      });
    } else {
      setSelectedCampaign({
        id: `live_${Date.now()}`,
        uniqueKey: `live_${Date.now()}_camp`,
        handle: currentUser.username,
        title: title,
        story: "Direct solidaire en cours animé par le porteur citoyen.",
        authorName: currentUser.displayName,
        authorRole: "Hôte du Direct",
        city: userCity || "Cotonou, Bénin",
        countryCode: "BJ",
        category: "EDUCATION",
        categoryLabel: "🔴 EN DIRECT SOLIDAIRE",
        currency: "XOF",
        goalMinor: 2_000_000n,
        collectedMinor: 0n,
        isCertified: true,
        isUrgent: true,
        hasLive: true,
        liveHostName: currentUser.displayName,
        liveViewers: 38,
        bgGradient: "from-red-950 via-neutral-900 to-black",
        durationLabel: "EN DIRECT",
        signaturesCount: 1,
        likesCount: 120,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 38,
        commentsList: [],
      });
    }

    setShowStartLiveModal(false);
    setShowLiveModal(true);
    showNotification("🔴 Vous êtes en DIRECT sur CHARITYY (Diffusion Agora RTC activée) !");

    // Simuler l'arrivée d'une demande de co-hôte après 4s pour permettre à l'hôte de tester la division d'écran
    setTimeout(() => {
      setCoHostRequests([
        {
          id: "guest_arminel",
          name: "Arminel NOUATIN",
          handle: "arminel_benin",
        },
      ]);
    }, 4000);
  };

  // Terminer le LIVE (Hôte TikTok)
  const handleEndLive = () => {
    const summary = {
      title: selectedCampaign.title,
      duration: formatLiveDuration(liveDurationSeconds),
      viewers: liveViewerCount + Math.floor(liveDurationSeconds * 2.5),
      raised: liveTotalRaised,
      likes: liveLikesCount,
    };
    setLiveSummaryData(summary);
    setShowLiveModal(false);
    setIsLiveBroadcaster(false);
    setActiveGuests([]);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setShowLiveSummaryModal(true);
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

  // Vidéos publiées par le profil créateur actuellement consulté
  const creatorVideos = viewedCreator
    ? feedItems.filter((c) => c.handle === viewedCreator.handle)
    : [];

  // Vidéos publiées par l'utilisateur connecté
  const userPublishedVideos = currentUser
    ? feedItems.filter((c) => c.handle === currentUser.username || c.authorName === currentUser.displayName)
    : [];

  // Vidéos favorites de l'utilisateur
  const userFavoriteVideos = feedItems.filter(
    (c) => favoritesList.includes(c.id) || c.isFavorited
  );

  // Vidéos aimées par l'utilisateur
  const userLikedVideos = feedItems.filter((c) => c.isLiked);

  return (
    <div className="relative w-full min-h-screen bg-black text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* TOAST FLOTTANT */}
      {activeToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl backdrop-blur animate-fade-in flex items-center gap-2">
          <span>🔔</span> {activeToast}
        </div>
      )}

      {/* Input caché pour l'upload de photo de profil */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

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

        {/* ACTIONS DE DROITE TIKTOK (Importer, Live Studio, Messages, Activité, Profil) */}
        <div className="flex items-center gap-2.5">
          {/* BOUTON 🔴 LANCER UN LIVE (TIKTOK LIVE STUDIO) */}
          <button
            onClick={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowStartLiveModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#FE2C55] hover:bg-[#e0264b] text-white font-extrabold text-xs px-3 py-2 rounded-md transition shadow flex-shrink-0"
            title="Lancer un direct solidaire Agora RTC"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>🔴 Lancer un LIVE</span>
          </button>

          {/* BOUTON + IMPORTER (Style TikTok Studio) */}
          <button
            onClick={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowCreateCampaignModal(true);
            }}
            className="flex items-center gap-2 border border-neutral-700 hover:bg-neutral-800/90 text-white font-bold text-xs px-3.5 py-2 rounded-md transition shadow-sm"
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
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 to-[#FE2C55] text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/20">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.displayName.charAt(0)
                  )}
                </div>
              </button>

              {/* Menu déroulant profil */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-scale-in space-y-1">
                  <div className="p-2 border-b border-neutral-800 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {userAvatar ? (
                        <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.displayName.charAt(0)
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                        <span>{currentUser.displayName}</span>
                        {isAdmin && (
                          <span className="text-[9px] bg-red-600 text-white px-1 py-0.2 rounded font-mono font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">@{currentUser.username}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                  >
                    <span>👤</span> Voir le profil complet
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

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                  >
                    <span>⚙️</span> Paramètres du compte
                  </button>

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

            {/* BOUTON LANCER LIVE DANS LA SIDEBAR */}
            <div className="pt-1 pb-1">
              <button
                onClick={() => {
                  if (!currentUser) setShowAuthModal(true);
                  else setShowStartLiveModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-[#FE2C55] hover:opacity-95 text-white font-extrabold text-xs py-2 rounded-lg transition shadow-md"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>🔴 Lancer un LIVE</span>
              </button>
            </div>

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

          {/* Section Comptes suivis / Suggérés (Clic = Ouvre le profil du créateur !) */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-neutral-400">Comptes suivis</div>
            <div className="space-y-1">
              {SUGGESTED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.handle}
                  onClick={() => handleOpenCreatorProfile(acc.handle)}
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
              const progressPercent = camp.goalMinor > 0n
                ? Math.min(100, Math.round((Number(camp.collectedMinor) / Number(camp.goalMinor)) * 100))
                : 0;
              const isFav = favoritesList.includes(camp.id) || camp.isFavorited;

              return (
                <article
                  key={camp.uniqueKey}
                  className="w-full h-full md:h-auto snap-start snap-always relative flex flex-col justify-between overflow-hidden bg-black md:bg-neutral-950 md:rounded-2xl md:p-4 md:border md:border-neutral-850 shadow-2xl"
                >
                  {/* EN-TÊTE AUTEUR EN VERSION DESKTOP (CLIC = OUVRE LE PROFIL DU CRÉATEUR) */}
                  <div className="hidden md:flex items-center justify-between pb-3">
                    <div
                      onClick={() => handleOpenCreatorProfile(camp.handle)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-red-500 p-0.5 transition group-hover:scale-105">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-xs">
                          {camp.authorName.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-white group-hover:text-[#25F4EE] transition">
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
                      onClick={() => handleToggleFollowCreator(camp.handle)}
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
                      {/* FOND ANIMÉ VIDÉO LÉGER OU LECTEUR VIDÉO RÉEL */}
                      {camp.videoUrl ? (
                        <video
                          src={camp.videoUrl}
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
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
                      )}

                      {/* BADGES HAUT SUR LA VIDÉO MOBILE */}
                      <div className="relative z-10 pt-14 md:pt-3 px-4 flex justify-between items-start pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white">
                            {camp.categoryLabel}
                          </span>
                          {camp.isFundraiser === false ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/80 text-white flex items-center gap-1 shadow">
                              📢 Alerte Citoyenne
                            </span>
                          ) : camp.isCertified ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/80 text-white flex items-center gap-1 shadow">
                              ✓ Certifiée
                            </span>
                          ) : null}
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
                        {/* Avatar (Clic = Ouvre le profil du créateur !) */}
                        <div
                          onClick={() => handleOpenCreatorProfile(camp.handle)}
                          className="relative mb-1 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-neutral-800 flex items-center justify-center text-xs font-bold shadow-md">
                            {camp.authorName.charAt(0)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFollowCreator(camp.handle);
                            }}
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

                        {/* Signets / Favoris (TikTok Bookmark) */}
                        <button
                          onClick={() => handleToggleFavorite(camp.id)}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div
                            className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center text-lg transition ${
                              isFav ? "text-amber-400 bg-amber-400/20" : "text-white"
                            }`}
                          >
                            {isFav ? "🔖" : "🏷️"}
                          </div>
                          <span className="text-[10px] font-bold text-white shadow-sm">Favoris</span>
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
                        {/* Auteur sur mobile (Clic = Ouvre le profil du créateur !) */}
                        <div
                          onClick={() => handleOpenCreatorProfile(camp.handle)}
                          className="md:hidden flex items-center gap-2 cursor-pointer"
                        >
                          <span className="font-bold text-sm text-white hover:underline">@{camp.handle}</span>
                          <span className="text-[11px] text-neutral-300">• 📍 {camp.city}</span>
                        </div>

                        {/* Description mobile */}
                        <div className="md:hidden space-y-1">
                          <h3 className="font-bold text-xs text-white leading-snug line-clamp-2">{camp.title}</h3>
                          <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                            {camp.story} <span className="text-sky-400 font-semibold">#charityy #don</span>
                          </p>
                        </div>

                        {/* BARRE DE PROGRESSION FINANCIÈRE OU BANNIÈRE ALERTE */}
                        {camp.isFundraiser === false ? (
                          <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-sky-500/30 flex items-center gap-2.5 shadow-lg">
                            <span className="text-xl">📢</span>
                            <div className="text-[11px] leading-tight">
                              <span className="font-bold text-sky-300 block">Alerte & Sensibilisation Citoyenne</span>
                              <span className="text-neutral-400 text-[10px]">Publication de signalement/problème sans collecte d&apos;argent</span>
                            </div>
                          </div>
                        ) : (
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
                        )}

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
                          ) : camp.isFundraiser === false ? (
                            <button
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(window.location.href);
                                }
                                showNotification("📢 Lien de l'alerte copié ! Merci de relayer pour sensibiliser.");
                              }}
                              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                            >
                              <span>📢</span> Relayer & Partager cette alerte
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
                    <div className="hidden md:flex flex-col items-center gap-3.5 ml-4 justify-end pb-4">
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

                      {/* Signets / Favoris (TikTok Bookmark Desktop) */}
                      <button
                        onClick={() => handleToggleFavorite(camp.id)}
                        className="flex flex-col items-center gap-1 group"
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <div
                          className={`w-12 h-12 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg transition shadow-md ${
                            isFav ? "text-amber-400 bg-amber-400/20 border-amber-500/40" : "text-white"
                          }`}
                        >
                          {isFav ? "🔖" : "🏷️"}
                        </div>
                        <span className="text-[11px] font-bold text-neutral-300">Favoris</span>
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
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 to-[#FE2C55] flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.displayName.charAt(0)
              )}
            </div>
          ) : (
            <span className="text-lg">👤</span>
          )}
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 6. MODALE A : ÉCRAN DE PROFIL PERSONNEL TIKTOK COMPLET                    */}
      {/* ========================================================================= */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-6 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-lg rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header Profil */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/70">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">{currentUser.displayName}</span>
                {isAdmin && (
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-300 flex items-center justify-center text-base"
                  title="Paramètres"
                >
                  ⚙️
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corps du profil */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 no-scrollbar">
              {/* Photo de profil avec bouton d'upload */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative group cursor-pointer" onClick={() => avatarFileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#25F4EE] via-amber-500 to-[#FE2C55] p-1 shadow-2xl">
                    <div className="w-full h-full bg-neutral-900 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold">
                      {userAvatar ? (
                        <img src={userAvatar} alt="Photo de profil" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.displayName.charAt(0)
                      )}
                    </div>
                  </div>
                  {/* Badge appareil photo */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FE2C55] text-white flex items-center justify-center text-xs shadow-lg border-2 border-neutral-900 group-hover:scale-110 transition">
                    📷
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base flex items-center justify-center gap-1.5">
                    <span>{currentUser.displayName}</span>
                    <span className="text-sky-400 text-xs">✓</span>
                  </h3>
                  <div className="text-xs text-neutral-400 font-mono">@{currentUser.username}</div>
                  <div className="text-[11px] text-neutral-300 pt-1 max-w-sm mx-auto leading-relaxed">
                    {userBio}
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-0.5">📍 {userCity}</div>
                </div>

                {/* Boutons d'action du profil (Lancer un live, Modifier, Photo, Partager) */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowStartLiveModal(true);
                    }}
                    className="bg-gradient-to-r from-red-600 to-[#FE2C55] hover:opacity-95 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5 animate-pulse"
                    title="Lancer un direct solidaire Agora RTC"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>🔴 Lancer un LIVE</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditDisplayName(currentUser.displayName);
                      setEditUsername(currentUser.username);
                      setEditBioText(userBio);
                      setEditCityText(userCity);
                      setShowEditProfileModal(true);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition"
                  >
                    ✏️ Modifier le profil
                  </button>

                  <button
                    onClick={() => {
                      avatarFileInputRef.current?.click();
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition"
                    title="Changer la photo"
                  >
                    📸 Photo
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.origin + "/@" + currentUser.username);
                      showNotification("↗️ Lien de votre profil copié !");
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition"
                    title="Partager le profil"
                  >
                    ↗️ Partager
                  </button>
                </div>
              </div>

              {/* Statistiques TikTok (Abonnements, Abonnés, J'aime, Solde) */}
              <div className="flex justify-around text-center py-2.5 border-y border-neutral-800">
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

              {/* ================================================================= */}
              {/* ONGLETS DU PROFIL TIKTOK : VIDÉOS, FAVORIS, AIMÉES, DONS, KYC     */}
              {/* ================================================================= */}
              <div className="border-t border-neutral-800 pt-3">
                <div className="flex border-b border-neutral-800 text-xs font-bold text-neutral-400">
                  <button
                    onClick={() => setProfileTab("videos")}
                    className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 transition ${
                      profileTab === "videos" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    <span>📹</span>
                    <span>Vidéos</span>
                  </button>
                  <button
                    onClick={() => setProfileTab("favorites")}
                    className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 transition ${
                      profileTab === "favorites" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    <span>🔖</span>
                    <span>Favoris ({favoritesList.length})</span>
                  </button>
                  <button
                    onClick={() => setProfileTab("likes")}
                    className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 transition ${
                      profileTab === "likes" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    <span>❤️</span>
                    <span>Aimées</span>
                  </button>
                  <button
                    onClick={() => setProfileTab("donations")}
                    className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 transition ${
                      profileTab === "donations" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    <span>🧾</span>
                    <span>Dons</span>
                  </button>
                  <button
                    onClick={() => setProfileTab("kyc")}
                    className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 transition ${
                      profileTab === "kyc" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    <span>🛡️</span>
                    <span>KYC</span>
                  </button>
                </div>

                <div className="pt-3 text-xs">
                  {/* ONGLET 1 : VIDÉOS PUBLIÉES */}
                  {profileTab === "videos" && (
                    <div className="space-y-3">
                      {userPublishedVideos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {userPublishedVideos.map((camp) => (
                            <div
                              key={camp.id}
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setShowProfileModal(false);
                              }}
                              className="aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer group bg-neutral-800 border border-neutral-700/60"
                            >
                              {camp.videoUrl ? (
                                <video
                                  src={camp.videoUrl}
                                  muted
                                  playsInline
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className={`absolute inset-0 bg-gradient-to-b ${camp.bgGradient}`} />
                              )}
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition" />
                              <div className="absolute top-1.5 left-1.5 z-10">
                                {camp.isFundraiser === false ? (
                                  <span className="text-[9px] bg-sky-500/90 text-white font-bold px-1.5 py-0.5 rounded shadow">
                                    📢 Alerte
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-600/90 text-white font-bold px-1.5 py-0.5 rounded shadow">
                                    🤝 Cagnotte
                                  </span>
                                )}
                              </div>
                              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white flex items-center gap-1 z-10">
                                <span>▶</span>
                                <span>{camp.viewsCount ? `${(camp.viewsCount / 1000).toFixed(1)}k` : "1.2k"}</span>
                              </div>
                              <div className="absolute top-2 right-2 text-[9px] bg-black/60 px-1 rounded text-white font-mono z-10">
                                {camp.durationLabel}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center space-y-3">
                          <span className="text-3xl block">📹</span>
                          <div className="font-bold text-white text-sm">Partagez votre première vidéo solidaire</div>
                          <p className="text-neutral-400 text-[11px] max-w-xs mx-auto">
                            Vos vidéos publiées apparaîtront ici et seront diffusées dans le fil d&apos;actualité TikTok de CHARITYY.
                          </p>
                          <button
                            onClick={() => {
                              setShowProfileModal(false);
                              setShowCreateCampaignModal(true);
                            }}
                            className="bg-[#FE2C55] hover:bg-[#e0264b] text-white font-bold text-xs px-5 py-2 rounded-full shadow"
                          >
                            + Téléverser une vidéo
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ONGLET 2 : FAVORIS */}
                  {profileTab === "favorites" && (
                    <div className="space-y-3">
                      {userFavoriteVideos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {userFavoriteVideos.map((camp) => (
                            <div
                              key={camp.id}
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setShowProfileModal(false);
                              }}
                              className="aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer group bg-neutral-800 border border-neutral-700/60"
                            >
                              <div className={`absolute inset-0 bg-gradient-to-b ${camp.bgGradient}`} />
                              <div className="absolute top-2 left-2 text-xs">🔖</div>
                              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white flex items-center gap-1">
                                <span>▶</span>
                                <span>{camp.viewsCount ? `${(camp.viewsCount / 1000).toFixed(1)}k` : "2.4k"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center space-y-2">
                          <span className="text-3xl block">🔖</span>
                          <div className="font-bold text-white text-sm">Aucun signet enregistré</div>
                          <p className="text-neutral-400 text-[11px] max-w-xs mx-auto">
                            Cliquez sur l&apos;icône signet 🏷️ sur une vidéo du fil pour l&apos;enregistrer dans vos favoris.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ONGLET 3 : AIMÉES */}
                  {profileTab === "likes" && (
                    <div className="space-y-3">
                      {userLikedVideos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {userLikedVideos.map((camp) => (
                            <div
                              key={camp.id}
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setShowProfileModal(false);
                              }}
                              className="aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer group bg-neutral-800 border border-neutral-700/60"
                            >
                              <div className={`absolute inset-0 bg-gradient-to-b ${camp.bgGradient}`} />
                              <div className="absolute top-2 left-2 text-xs text-[#FE2C55]">❤️</div>
                              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white flex items-center gap-1">
                                <span>▶</span>
                                <span>{camp.likesCount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center space-y-2">
                          <span className="text-3xl block">❤️</span>
                          <div className="font-bold text-white text-sm">Aucune vidéo aimée</div>
                          <p className="text-neutral-400 text-[11px] max-w-xs mx-auto">
                            Les vidéos que vous aimez seront conservées ici en toute sécurité.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ONGLET 4 : DONS & REÇUS FISCAUX */}
                  {profileTab === "donations" && (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-xs">Chirurgie Aminata (CHU)</div>
                            <div className="text-[10px] text-neutral-400 font-mono">ID: #REC-2026-XOF-9482</div>
                          </div>
                          <span className="font-bold font-mono text-emerald-400 text-xs">-10 000 FCFA</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                          <span>Date : 13 Nov 2026 • Moneroo</span>
                          <button
                            onClick={() => showNotification("📄 Téléchargement du reçu fiscal PDF certifié...")}
                            className="text-[#25F4EE] hover:underline font-bold"
                          >
                            Télécharger le reçu fiscal (PDF)
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-xs">Forage Solaire Zè (Bénin)</div>
                            <div className="text-[10px] text-neutral-400 font-mono">ID: #REC-2026-XOF-4105</div>
                          </div>
                          <span className="font-bold font-mono text-emerald-400 text-xs">-25 000 FCFA</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                          <span>Date : 10 Nov 2026 • MTN Mobile Money</span>
                          <button
                            onClick={() => showNotification("📄 Téléchargement du reçu fiscal PDF certifié...")}
                            className="text-[#25F4EE] hover:underline font-bold"
                          >
                            Télécharger le reçu fiscal (PDF)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ONGLET 5 : PIÈCES KYC */}
                  {profileTab === "kyc" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-black/50 rounded-xl border border-neutral-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold text-xs">Identité Bénin (CIP / CNI)</span>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            ✓ CERTIFIÉ & VÉRIFIÉ
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Vos pièces d&apos;identité sont chiffrées selon la norme AES-GCM et validées par la commission d&apos;attribution.
                        </p>
                      </div>

                      <div className="p-3 bg-black/50 rounded-xl border border-neutral-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold text-xs">Niveau de confiance</span>
                          <span className="text-sky-400 font-bold text-[10px]">Tier 3 (Retraits illimités)</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Éligible aux collectes d&apos;urgences et certifications prioritaires.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton de déconnexion */}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALE B : PROFIL DU CRÉATEUR CONSULTÉ (ACCÈS DEPUIS LE FIL !)         */}
      {/* ========================================================================= */}
      {showCreatorProfileModal && viewedCreator && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-6 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-lg rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header Profil Créateur */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/70">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">{viewedCreator.name}</span>
                {viewedCreator.verified && <span className="text-sky-400 text-xs">✓</span>}
              </div>
              <button
                onClick={() => setShowCreatorProfileModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Corps du profil créateur */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 no-scrollbar">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`relative p-1 rounded-full ${viewedCreator.isLive ? "bg-gradient-to-tr from-[#FE2C55] to-amber-500 animate-pulse" : "bg-neutral-800"}`}>
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-3xl font-bold border-2 border-white/20">
                    {viewedCreator.avatarUrl ? (
                      <img src={viewedCreator.avatarUrl} alt={viewedCreator.name} className="w-full h-full object-cover" />
                    ) : (
                      viewedCreator.name.charAt(0)
                    )}
                  </div>
                  {viewedCreator.isLive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#FE2C55] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                      LIVE
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-base flex items-center justify-center gap-1.5">
                    <span>{viewedCreator.name}</span>
                    {viewedCreator.verified && <span className="text-sky-400 text-xs">✓</span>}
                  </h3>
                  <div className="text-xs text-neutral-400 font-mono">@{viewedCreator.handle}</div>
                  <div className="text-[11px] text-neutral-300 font-semibold pt-0.5">{viewedCreator.role}</div>
                  <p className="text-[11px] text-neutral-400 pt-1 max-w-sm mx-auto leading-relaxed">
                    {viewedCreator.bio}
                  </p>
                  <div className="text-[10px] text-neutral-500 pt-0.5">📍 {viewedCreator.city}</div>
                </div>

                {/* Boutons d'action créateur : Suivre, Message, Partager */}
                <div className="flex items-center gap-2 pt-1 w-full max-w-xs">
                  <button
                    onClick={() => handleToggleFollowCreator(viewedCreator.handle)}
                    className={`flex-1 font-bold text-xs py-2 rounded-lg transition shadow ${
                      viewedCreator.isFollowing
                        ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                        : "bg-[#FE2C55] hover:bg-[#e0264b] text-white"
                    }`}
                  >
                    {viewedCreator.isFollowing ? "✓ Abonné" : "+ Suivre"}
                  </button>

                  <button
                    onClick={() => setShowDirectMessageModal(true)}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 rounded-lg border border-neutral-700 transition"
                  >
                    💬 Message
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.origin + "/@" + viewedCreator.handle);
                      showNotification(`↗️ Lien du profil de @${viewedCreator.handle} copié !`);
                    }}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                    title="Partager le profil"
                  >
                    ↗️
                  </button>
                </div>

                {viewedCreator.isLive && (
                  <button
                    onClick={() => {
                      setShowCreatorProfileModal(false);
                      setShowLiveModal(true);
                    }}
                    className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-bounce"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Regarder le LIVE ({viewedCreator.liveViewers} spectateurs)
                  </button>
                )}
              </div>

              {/* Statistiques TikTok du créateur */}
              <div className="flex justify-around text-center py-2.5 border-y border-neutral-800">
                <div>
                  <div className="font-black text-sm text-white">{viewedCreator.followingCount}</div>
                  <div className="text-[10px] text-neutral-400">Abonnements</div>
                </div>
                <div className="w-px bg-neutral-800" />
                <div>
                  <div className="font-black text-sm text-white">
                    {viewedCreator.followersCount >= 1000
                      ? `${(viewedCreator.followersCount / 1000).toFixed(1)}k`
                      : viewedCreator.followersCount}
                  </div>
                  <div className="text-[10px] text-neutral-400">Abonnés</div>
                </div>
                <div className="w-px bg-neutral-800" />
                <div>
                  <div className="font-black text-sm text-white">
                    {viewedCreator.likesCount >= 1000
                      ? `${(viewedCreator.likesCount / 1000).toFixed(1)}k`
                      : viewedCreator.likesCount}
                  </div>
                  <div className="text-[10px] text-neutral-400">J&apos;aime</div>
                </div>
              </div>

              {/* Onglets du créateur : Vidéos, Preuves hospitalières, Signatures */}
              <div className="border-t border-neutral-800 pt-3">
                <div className="flex border-b border-neutral-800 text-xs font-bold text-neutral-400">
                  <button
                    onClick={() => setCreatorTab("videos")}
                    className={`flex-1 pb-2.5 transition ${
                      creatorTab === "videos" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    Vidéos & Causes ({creatorVideos.length})
                  </button>
                  <button
                    onClick={() => setCreatorTab("proofs")}
                    className={`flex-1 pb-2.5 transition ${
                      creatorTab === "proofs" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    Preuves Médicales
                  </button>
                  <button
                    onClick={() => setCreatorTab("signatures")}
                    className={`flex-1 pb-2.5 transition ${
                      creatorTab === "signatures" ? "text-white border-b-2 border-white font-extrabold" : "hover:text-neutral-300"
                    }`}
                  >
                    Soutiens Citoyens
                  </button>
                </div>

                <div className="pt-3 text-xs">
                  {creatorTab === "videos" && (
                    <div className="space-y-3">
                      {creatorVideos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {creatorVideos.map((camp) => (
                            <div
                              key={camp.id}
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setShowCreatorProfileModal(false);
                              }}
                              className="aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer group bg-neutral-800 border border-neutral-700/60"
                            >
                              <div className={`absolute inset-0 bg-gradient-to-b ${camp.bgGradient}`} />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition" />
                              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white flex items-center gap-1">
                                <span>▶</span>
                                <span>{camp.viewsCount ? `${(camp.viewsCount / 1000).toFixed(1)}k` : "1.2k"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-neutral-400">
                          Aucune vidéo supplémentaire publiée pour ce créateur.
                        </div>
                      )}
                    </div>
                  )}

                  {creatorTab === "proofs" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-black/50 rounded-xl border border-neutral-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-white">Agrément Professionnel & CHU</span>
                          <span className="text-emerald-400 font-bold text-[10px]">✓ VALIDÉ</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Référence d&apos;enregistrement : <code className="text-neutral-300">{viewedCreator.officialDoc}</code>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Chaque appel aux dons de ce praticien est soumis au contrôle du médecin référent et du service financier selon la charte CHARITYY.
                        </p>
                      </div>

                      {/* Justificatifs et devis rattachés */}
                      {creatorVideos.some((c) => c.proofs && c.proofs.length > 0) && (
                        <div className="p-3 bg-black/50 rounded-xl border border-neutral-800 space-y-2">
                          <span className="font-semibold text-white text-[11px] block">
                            Justificatifs & devis chargés :
                          </span>
                          <div className="space-y-1.5">
                            {creatorVideos
                              .flatMap((c) => c.proofs || [])
                              .map((proof, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px]"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span>📄</span>
                                    <span className="truncate text-neutral-200">{proof.name}</span>
                                  </div>
                                  <span className="text-emerald-400 font-mono text-[10px] ml-2">{proof.size}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {creatorTab === "signatures" && (
                    <div className="p-3 bg-black/50 rounded-xl border border-neutral-800 space-y-2">
                      <div className="font-semibold text-white">Sceau de réputation citoyenne</div>
                      <div className="text-2xl font-black font-mono text-amber-400">98 / 100</div>
                      <p className="text-[11px] text-neutral-400">
                        Ce créateur bénéficie d&apos;un taux d&apos;approbation communautaire exemplaire certifié par les signatures citoyennes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALE C : MODIFIER LE PROFIL (NOM, USERNAME, BIO, VILLE)               */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm">Modifier votre profil</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Nom affiché :</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Nom d&apos;utilisateur (@) :</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Biographie :</label>
                <textarea
                  rows={3}
                  value={editBioText}
                  onChange={(e) => setEditBioText(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Ville / Pays :</label>
                <input
                  type="text"
                  value={editCityText}
                  onChange={(e) => setEditCityText(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#FE2C55] hover:bg-[#e0264b] text-white font-bold transition shadow"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALE D : MESSAGE DIRECT À UN CRÉATEUR                                */}
      {/* ========================================================================= */}
      {showDirectMessageModal && viewedCreator && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Message à {viewedCreator.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono">@{viewedCreator.handle}</span>
              </div>
              <button onClick={() => setShowDirectMessageModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendDirectMessage} className="space-y-3 text-xs">
              <p className="text-neutral-400 text-[11px]">
                Posez une question sur la cagnotte, l&apos;avancement du projet ou les justificatifs hospitaliers.
              </p>
              <textarea
                rows={4}
                required
                value={directMessageText}
                onChange={(e) => setDirectMessageText(e.target.value)}
                placeholder="Écrivez votre message solidaire..."
                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#FE2C55] hover:bg-[#e0264b] text-white font-bold transition shadow"
              >
                Envoyer le message direct
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALE E : PARAMÈTRES DU COMPTE (SETTINGS)                             */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm">Paramètres & Confidentialité</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-neutral-400 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black border border-neutral-800 space-y-1">
                <div className="font-bold text-white">Sécurité du compte</div>
                <p className="text-[11px] text-neutral-400">
                  Mots de passe hachés avec PBKDF2 (600 000 itérations). Piste d&apos;audit active.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black border border-neutral-800 space-y-1">
                <div className="font-bold text-white">Confidentialité des dons</div>
                <p className="text-[11px] text-neutral-400">
                  Afficher mes dons publiquement : <strong className="text-emerald-400">Activé</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black border border-neutral-800 space-y-1">
                <div className="font-bold text-white">Notifications push</div>
                <p className="text-[11px] text-neutral-400">
                  Alertes lives & cagnottes d&apos;urgence à Cotonou : <strong className="text-[#25F4EE]">Activé</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  showNotification("Paramètres enregistrés.");
                }}
                className="w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold"
              >
                Fermer
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

      {/* MODAL 8 : DIRECT SOLIDAIRE TIKTOK (AGORA RTC, DIVISION D'ÉCRAN & MULTI-GUEST) */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col max-w-lg mx-auto w-full text-white select-none overflow-hidden">
          {/* EN-TÊTE DU LIVE TIKTOK (HÔTE, STATS EN DIRECT, TIMER, BOUTON QUITTER / TERMINER) */}
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/80 backdrop-blur z-30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-[#FE2C55] p-0.5">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-black text-xs">
                  {(isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName)?.charAt(0)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white truncate max-w-[120px]">
                    {isLiveBroadcaster ? currentUser?.displayName : (selectedCampaign.liveHostName || selectedCampaign.authorName)}
                  </span>
                  <span className="bg-[#FE2C55] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 font-mono">
                  <span>⏱️ {formatLiveDuration(liveDurationSeconds)}</span>
                  <span>•</span>
                  <span>👥 {liveViewerCount} spectateurs</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* CAGNOTTE DU LIVE RÉCOLTÉE */}
              <div className="bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span>💎</span>
                <span>{liveTotalRaised.toLocaleString()} F</span>
              </div>

              {/* BOUTON TERMINER (SI HÔTE) OU QUITTER (SI SPECTATEUR) */}
              {isLiveBroadcaster ? (
                <button
                  onClick={handleEndLive}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full font-bold shadow-md transition"
                >
                  Terminer
                </button>
              ) : (
                <button
                  onClick={() => setShowLiveModal(false)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-medium transition"
                >
                  Quitter
                </button>
              )}
            </div>
          </div>

          {/* ZONE PRINCIPALE DE DIFFUSION : GÈRE LA DIVISION OU MULTIPLICATION D'ÉCRAN */}
          <div
            onClick={handleLiveTap}
            className="flex-1 relative bg-neutral-950 overflow-hidden cursor-pointer flex flex-col justify-center"
          >
            {/* NOTIFICATION DE DEMANDE DE MONTÉE SUR SCÈNE (POUR L'HÔTE) */}
            {isLiveBroadcaster && coHostRequests.length > 0 && coHostRequests[0] && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 right-3 z-40 bg-neutral-900/95 border border-[#25F4EE] rounded-xl p-2.5 shadow-2xl flex items-center justify-between animate-bounce"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xl">🙋‍♂️</span>
                  <div className="truncate text-xs">
                    <span className="font-bold text-white truncate block">{coHostRequests[0].name}</span>
                    <span className="text-neutral-400 text-[10px]">demande à monter sur scène (Co-hôte)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => coHostRequests[0] && handleAcceptCoHost(coHostRequests[0])}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition shadow"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => coHostRequests[0] && handleRejectCoHost(coHostRequests[0].id)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            )}

            {/* ANIMATION CADEAU REÇU EN GRAND */}
            {activeGiftAnimation && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-emerald-400 px-5 py-2.5 rounded-full text-xs font-black text-emerald-300 shadow-2xl animate-bounce flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <span>{activeGiftAnimation}</span>
              </div>
            )}

            {/* CŒURS FLOTTANTS TIKTOK */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {floatingHearts.map((h) => (
                <div
                  key={h.id}
                  style={{ left: `${h.left}%` }}
                  className="absolute bottom-20 text-3xl opacity-90 animate-bounce transition-all duration-1000 transform -translate-y-48"
                >
                  {h.emoji}
                </div>
              ))}
            </div>

            {/* LAYOUT VIDÉO : MULTIPLICATION / DIVISION D'ÉCRAN TIKTOK */}
            {activeGuests.length === 0 ? (
              /* CAS 1 : 1 PARTICIPANT (HÔTE SOLO PLEIN ÉCRAN) */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {isLiveBroadcaster && localStreamRef.current && !isLocalCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-b ${selectedCampaign.bgGradient} flex flex-col items-center justify-center p-6 text-center`}>
                    <div className="relative mb-3">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 via-yellow-400 to-[#FE2C55] p-1 animate-pulse">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-black text-2xl text-white">
                          {(isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName)?.charAt(0)}
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 bg-[#FE2C55] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                        Hôte
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-white">
                      {isLiveBroadcaster ? currentUser?.displayName : (selectedCampaign.liveHostName || selectedCampaign.authorName)}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono">
                      @{isLiveBroadcaster ? currentUser?.username : selectedCampaign.handle}
                    </div>
                    <div className="mt-4 px-3 py-1 bg-black/60 backdrop-blur rounded-full border border-white/10 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Direct Agora RTC HD actif</span>
                    </div>
                  </div>
                )}
              </div>
            ) : activeGuests.length === 1 ? (
              /* CAS 2 : 2 PARTICIPANTS (DIVISION D'ÉCRAN 50/50 DUO / CO-HOSTING TIKTOK) */
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1 gap-1 p-1 bg-black">
                {/* CASE 1 : HÔTE */}
                <div className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-red-500/80 flex flex-col justify-between p-2">
                  <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-white">
                    <span className="text-yellow-400">👑</span>
                    <span className="truncate max-w-[120px]">
                      {isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName} (Hôte)
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>PARLE</span>
                  </div>

                  {isLiveBroadcaster && localStreamRef.current && !isLocalCameraOff ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-red-950/40 to-neutral-950">
                      <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-red-500 flex items-center justify-center font-black text-xl text-white mb-2 shadow">
                        {(isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName)?.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName}
                      </span>
                      <span className="text-[10px] text-neutral-400">Hôte du direct</span>
                    </div>
                  )}
                </div>

                {/* CASE 2 : INVITÉ MONTÉ SUR SCÈNE */}
                {activeGuests[0] && (
                  <div className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-cyan-400/80 flex flex-col justify-between p-2">
                    <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-white">
                      <span className="text-cyan-400">🙋‍♂️</span>
                      <span className="truncate max-w-[120px]">{activeGuests[0].name} (Invité)</span>
                    </div>
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                      {isLiveBroadcaster && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            activeGuests[0] && handleRemoveGuest(activeGuests[0].id);
                          }}
                          className="bg-red-600/90 hover:bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow"
                          title="Faire descendre l'invité"
                        >
                          ✕ Descendre
                        </button>
                      )}
                    </div>

                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-cyan-950/40 to-neutral-950">
                      <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-cyan-400 flex items-center justify-center font-black text-xl text-white mb-2 shadow animate-pulse">
                        {activeGuests[0].name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-cyan-300">{activeGuests[0].name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">@{activeGuests[0].handle} • 🎤 En direct</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CAS 3 : 3 OU 4 PARTICIPANTS (GRILLE MULTI-INVITÉS 2x2 TIKTOK) */
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-black">
                {/* HÔTE */}
                <div className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-red-500/80 flex items-center justify-center">
                  <span className="absolute top-1.5 left-1.5 z-10 text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-white font-bold">
                    👑 Hôte
                  </span>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 border border-red-500 mx-auto flex items-center justify-center font-bold text-sm">
                      {(isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName)?.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold block pt-1 text-white truncate max-w-[90px]">
                      {isLiveBroadcaster ? currentUser?.displayName : selectedCampaign.authorName}
                    </span>
                  </div>
                </div>

                {/* INVITÉS SUR SCÈNE */}
                {activeGuests.map((guest, idx) => (
                  <div
                    key={guest.id}
                    className="relative rounded-xl overflow-hidden bg-neutral-900 border-2 border-cyan-400/80 flex items-center justify-center"
                  >
                    <span className="absolute top-1.5 left-1.5 z-10 text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-cyan-300 font-bold">
                      Invité {idx + 1}
                    </span>
                    {isLiveBroadcaster && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGuest(guest.id);
                        }}
                        className="absolute top-1.5 right-1.5 z-10 bg-red-600/90 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      >
                        ✕
                      </button>
                    )}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-800 border border-cyan-400 mx-auto flex items-center justify-center font-bold text-sm text-cyan-300">
                        {guest.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold block pt-1 text-neutral-200 truncate max-w-[90px]">
                        {guest.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FLUX DE CHAT EN DIRECT EN SUPERPOSITION */}
          <div className="h-36 bg-gradient-to-t from-black via-black/80 to-transparent p-3 overflow-y-auto space-y-1 text-xs border-t border-white/10 z-20">
            {chatMessages.slice(-8).map((msg, i) => (
              <div key={i} className="text-neutral-200 text-[11px] leading-snug">
                {msg.startsWith("🎁") ? (
                  <span className="text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md inline-block">
                    {msg}
                  </span>
                ) : msg.startsWith("🎉") ? (
                  <span className="text-cyan-300 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-md inline-block">
                    {msg}
                  </span>
                ) : (
                  msg
                )}
              </div>
            ))}
          </div>

          {/* TIROIR DE CADEAUX SOLIDAIRES TIKTOK (AFFICHÉ SI TOGGLE) */}
          {showGiftDrawer && (
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 space-y-2 z-30 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>🎁</span> Cadeaux Solidaires TikTok
                </span>
                <span className="text-neutral-400 text-[11px]">
                  Solde : <strong className="text-emerald-400 font-mono">{formatCurrency(userWalletBalance, "XOF")}</strong>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_GIFT_CATALOG.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift.id)}
                    className="p-2 bg-black/60 hover:bg-neutral-800 rounded-xl border border-neutral-700/80 text-center transition group active:scale-95"
                  >
                    <div className="text-lg group-hover:scale-110 transition-transform">
                      {gift.name.split(" ")[0]}
                    </div>
                    <div className="text-[10px] font-bold text-white truncate pt-0.5">
                      {gift.name.substring(2)}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold">
                      {gift.priceMinor.toString()} F
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BARRE D'ACTIONS INFÉRIEURE : DIFFÉRENCIÉE SELON CRÉATEUR OU SPECTATEUR */}
          <div className="p-3 bg-black border-t border-neutral-800 space-y-2 z-30">
            <div className="flex items-center gap-2">
              {/* SAISIE DE MESSAGE DE CHAT */}
              <form onSubmit={handleSendChatMessage} className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  placeholder="Écrire dans le direct..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FE2C55]"
                />
                <button
                  type="submit"
                  className="bg-[#FE2C55] hover:bg-[#e0264b] text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                >
                  Envoyer
                </button>
              </form>

              {/* COMMANDES SPÉCIFIQUES CRÉATEUR (HÔTE) */}
              {isLiveBroadcaster ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsLocalMicMuted(!isLocalMicMuted)}
                    className={`p-2 rounded-xl text-xs font-bold border ${isLocalMicMuted ? "bg-red-600/30 border-red-500 text-red-300" : "bg-neutral-800 border-neutral-700 text-white"}`}
                    title={isLocalMicMuted ? "Activer le micro" : "Couper le micro"}
                  >
                    {isLocalMicMuted ? "🔇" : "🎤"}
                  </button>
                  <button
                    onClick={() => setIsLocalCameraOff(!isLocalCameraOff)}
                    className={`p-2 rounded-xl text-xs font-bold border ${isLocalCameraOff ? "bg-red-600/30 border-red-500 text-red-300" : "bg-neutral-800 border-neutral-700 text-white"}`}
                    title={isLocalCameraOff ? "Activer la caméra" : "Couper la caméra"}
                  >
                    {isLocalCameraOff ? "🚫" : "📹"}
                  </button>
                </div>
              ) : (
                /* COMMANDES SPÉCIFIQUES SPECTATEUR (DEMANDER À MONTER, CADEAUX, J'AIME) */
                <div className="flex items-center gap-1.5">
                  {/* BOUTON DEMANDER À MONTER SUR SCÈNE / DESCENDRE */}
                  {activeGuests.some((g) => g.id === currentUser?.id) ? (
                    <button
                      onClick={() => currentUser && handleRemoveGuest(currentUser.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-2 rounded-xl flex items-center gap-1 transition shadow"
                    >
                      <span>🚪</span>
                      <span>Descendre</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestCoHost}
                      disabled={hasRequestedToJoin}
                      className={`text-[10px] font-extrabold px-2.5 py-2 rounded-xl flex items-center gap-1 transition shadow ${
                        hasRequestedToJoin
                          ? "bg-neutral-800 text-neutral-400 cursor-not-allowed"
                          : "bg-cyan-500 hover:bg-cyan-400 text-black animate-pulse"
                      }`}
                    >
                      <span>🙋‍♂️</span>
                      <span>{hasRequestedToJoin ? "En attente..." : "Monter"}</span>
                    </button>
                  )}

                  {/* BOUTON TIROIR CADEAUX */}
                  <button
                    onClick={() => setShowGiftDrawer(!showGiftDrawer)}
                    className="p-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-90 text-black font-bold text-xs rounded-xl shadow transition"
                    title="Offrir un cadeau solidaire"
                  >
                    🎁
                  </button>

                  {/* BOUTON J'AIME */}
                  <button
                    onClick={handleLiveTap}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-[#FE2C55] font-bold text-xs rounded-xl border border-neutral-700 transition"
                    title="Envoyer des cœurs"
                  >
                    ❤️ {liveLikesCount >= 1000 ? `${(liveLikesCount / 1000).toFixed(1)}k` : liveLikesCount}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8BIS : CONFIGURATION DU DIRECT (TIKTOK LIVE STUDIO) */}
      {showStartLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <h3 className="font-bold text-sm">CHARITYY Live Studio</h3>
              </div>
              <button
                onClick={() => setShowStartLiveModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartLiveSubmit} className="space-y-4 text-xs">
              {/* RETOUR CAMÉRA PRÉ-DIRECT */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-neutral-700 flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Caméra prête • HD 720p</span>
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsLocalMicMuted(!isLocalMicMuted)}
                    className={`p-2 rounded-full text-xs ${isLocalMicMuted ? "bg-red-600 text-white" : "bg-black/60 text-white"}`}
                  >
                    {isLocalMicMuted ? "🔇" : "🎤"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLocalCameraOff(!isLocalCameraOff)}
                    className={`p-2 rounded-full text-xs ${isLocalCameraOff ? "bg-red-600 text-white" : "bg-black/60 text-white"}`}
                  >
                    {isLocalCameraOff ? "🚫" : "📹"}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Titre de votre direct solidaire :</label>
                <input
                  type="text"
                  required
                  value={liveTitleInput}
                  onChange={(e) => setLiveTitleInput(e.target.value)}
                  placeholder="Ex: Urgence Forages Zè : Point en direct avec les riverains"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FE2C55]"
                />
              </div>

              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Rattacher à une cagnotte / cause solidaire :</label>
                <select
                  value={liveCampaignSelection}
                  onChange={(e) => setLiveCampaignSelection(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="free">🌟 Direct solidaire libre (Sensibilisation & Mobilisation citoyenne)</option>
                  {feedItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.categoryLabel} : {c.title.substring(0, 42)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] space-y-1 text-neutral-400">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <span>🛡️</span> Diffusion Agora RTC & Division d&apos;Écran
                </div>
                <p>
                  Les spectateurs pourront vous envoyer des cadeaux solidaires déduits de leur wallet et demander à monter sur scène avec vous en écran divisé (co-hosting).
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-[#FE2C55] hover:opacity-95 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>🔴 Démarrer le LIVE maintenant</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8TER : RAPPORT DE MISSION SOLIDAIRE DE FIN DE DIRECT */}
      {showLiveSummaryModal && liveSummaryData && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-6 space-y-4 border border-neutral-800 shadow-2xl text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 mx-auto flex items-center justify-center text-3xl">
              🎉
            </div>

            <div>
              <h3 className="font-black text-lg text-white">LIVE TERMINÉ</h3>
              <p className="text-xs text-neutral-400 line-clamp-1 pt-1">{liveSummaryData.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-left">
              <div className="p-2.5 bg-black/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-400">Durée du direct</div>
                <div className="text-base font-black font-mono text-white pt-0.5">{liveSummaryData.duration}</div>
              </div>
              <div className="p-2.5 bg-black/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-400">Spectateurs uniques</div>
                <div className="text-base font-black font-mono text-sky-400 pt-0.5">{liveSummaryData.viewers}</div>
              </div>
              <div className="p-2.5 bg-black/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-400">Fonds récoltés</div>
                <div className="text-base font-black font-mono text-emerald-400 pt-0.5">
                  {liveSummaryData.raised.toLocaleString()} F
                </div>
              </div>
              <div className="p-2.5 bg-black/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-400">J&apos;aime reçus</div>
                <div className="text-base font-black font-mono text-[#FE2C55] pt-0.5">{liveSummaryData.likes}</div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowLiveSummaryModal(false);
                setLiveSummaryData(null);
              }}
              className="w-full bg-white hover:bg-neutral-200 text-black font-extrabold text-xs py-3 rounded-xl transition shadow"
            >
              Fermer et retourner au fil
            </button>
          </div>
        </div>
      )}

      {/* MODAL 9 : IMPORTER / PUBLIER UNE VIDÉO (TIKTOK STUDIO) */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 text-white w-full max-w-md rounded-2xl p-5 space-y-4 border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>📹</span>
                  <span>Publier une vidéo sur CHARITYY</span>
                </h3>
                <span className="text-[10px] text-neutral-400">Diffusion instantanée dans le fil TikTok</span>
              </div>
              <button
                onClick={() => setShowCreateCampaignModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              {/* INPUTS FICHIER CACHÉS : FICHIER VIDÉO, CAMÉRA DIRECTE ET JUSTIFICATIFS */}
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoFileChange}
              />
              <input
                ref={videoCameraInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={handleVideoFileChange}
              />
              <input
                ref={proofFileInputRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                className="hidden"
                onChange={handleProofFilesChange}
              />

              {/* ZONE VIDÉO (SÉLECTION OU LECTEUR DE PRÉVISUALISATION) */}
              {uploadedVideoUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black border border-neutral-700 space-y-0">
                  <video
                    src={uploadedVideoUrl}
                    controls
                    playsInline
                    className="w-full h-44 object-cover bg-black"
                  />
                  <div className="p-2.5 bg-neutral-950 flex items-center justify-between border-t border-neutral-800">
                    <div className="truncate text-[11px] text-neutral-300">
                      <span className="text-emerald-400 font-semibold mr-1">✓ Vidéo prête :</span>
                      {uploadedVideoFile?.name || "Vidéo sélectionnée"}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded transition"
                      >
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedVideoFile(null);
                          setUploadedVideoUrl(null);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 px-1 font-bold"
                        title="Supprimer la vidéo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => videoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-[#FE2C55] rounded-xl p-4 text-center cursor-pointer transition bg-black/40 space-y-2 group"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">📹</span>
                  <div className="text-xs font-bold text-white">Sélectionner ou enregistrer une vidéo</div>
                  <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">
                    Filmez directement depuis votre smartphone ou téléversez un fichier depuis votre galerie (MP4, WebM, MOV)
                  </p>
                  <div className="flex gap-2 justify-center pt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition border border-neutral-700"
                    >
                      <span>📁</span> Choisir une vidéo
                    </button>
                    <button
                      type="button"
                      onClick={() => videoCameraInputRef.current?.click()}
                      className="bg-[#FE2C55] hover:bg-[#e0264b] text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                    >
                      <span>📸</span> Lancer la caméra
                    </button>
                  </div>
                </div>
              )}

              {/* TITRE ET HISTOIRE GÉNÉRALE */}
              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Titre de la vidéo / du sujet :</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Alerte inondation quartier Agla ou Soutien pour école"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FE2C55]"
                />
              </div>

              <div>
                <label className="font-semibold block text-neutral-300 mb-1">Localisation (Ville, quartier) :</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ex: Cotonou, Bénin"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FE2C55]"
                />
              </div>

              <div>
                <label className="font-semibold block text-neutral-300 mb-1">
                  Description / Explication du problème exposé :
                </label>
                <textarea
                  required
                  rows={3}
                  value={newStory}
                  onChange={(e) => setNewStory(e.target.value)}
                  placeholder="Expliquez la situation, le constat sur le terrain ou le témoignage citoyen..."
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FE2C55]"
                />
              </div>

              {/* TOGGLE : CAGNOTTE SOLIDAIRE (MOBILISATION DE FONDS) */}
              <div className="p-3.5 rounded-xl border border-neutral-700 bg-neutral-950/80 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFundraiser}
                    onChange={(e) => setIsFundraiser(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#FE2C55] accent-[#FE2C55] bg-black border-neutral-700 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-white text-xs block">
                      🤝 Associer une cagnotte solidaire à cette vidéo (Mobilisation de fonds)
                    </span>
                    <span className="text-[10px] text-neutral-400 block pt-0.5">
                      Cochez cette option si cette vidéo fait un appel aux dons financiers. Si non cochée, elle sera publiée en simple vidéo citoyenne d&apos;alerte ou de sensibilisation sans demande d&apos;argent.
                    </span>
                  </div>
                </label>

                {/* CHAMPS DE LA CAGNOTTE SOLIDAIRE (AFFICHÉS SI COCHÉ) */}
                {isFundraiser && (
                  <div className="pt-3 border-t border-neutral-800 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold block text-neutral-300 mb-1">Objectif (FCFA) :</label>
                        <input
                          type="number"
                          required={isFundraiser}
                          value={newGoal}
                          onChange={(e) => setNewGoal(Number(e.target.value))}
                          min={1000}
                          step={1000}
                          className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block text-neutral-300 mb-1">Catégorie :</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as any)}
                          className="w-full bg-black border border-neutral-700 rounded-lg px-2.5 py-2 text-white"
                        >
                          <option value="MEDICAL">🚨 Urgence Médicale</option>
                          <option value="WATER">💧 Eau & Climat</option>
                          <option value="EDUCATION">📚 Éducation</option>
                          <option value="MATERNITY">👶 Maternité</option>
                          <option value="DISASTER">🚨 Urgence Sinistrés</option>
                        </select>
                      </div>
                    </div>

                    {/* SECTION PREUVES & JUSTIFICATIFS */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-neutral-300">
                          Preuves & Justificatifs (Double Approbation) :
                        </label>
                        <button
                          type="button"
                          onClick={() => proofFileInputRef.current?.click()}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                        >
                          <span>📎</span> Charger des devis
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        Chargez les devis d&apos;hôpital, factures proforma, ordonnances ou attestations officielles (.pdf ou photos).
                      </p>

                      {uploadedProofFiles.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {uploadedProofFiles.map((proof, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-black/60 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span>📄</span>
                                <span className="truncate text-neutral-200">{proof.name}</span>
                                <span className="text-neutral-500 text-[10px]">({proof.size})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveProofFile(idx)}
                                className="text-red-400 hover:text-red-300 ml-2 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          onClick={() => proofFileInputRef.current?.click()}
                          className="border border-dashed border-neutral-800 hover:border-neutral-600 rounded-lg p-2.5 text-center cursor-pointer transition bg-black/30"
                        >
                          <span className="text-[11px] text-neutral-400">
                            📄 Cliquez pour charger des devis d&apos;hôpital ou factures justificatives
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DÉCLARATION SUR L'HONNEUR */}
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        required={isFundraiser}
                        checked={proofHonorCertified}
                        onChange={(e) => setProofHonorCertified(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-emerald-500 accent-emerald-500 bg-black border-neutral-700"
                      />
                      <span className="text-[10px] text-neutral-300 leading-tight">
                        Je certifie sur l&apos;honneur l&apos;authenticité de cette cause et des justificatifs fournis, soumis à la double approbation selon la charte CHARITYY.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white py-3 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>{isFundraiser ? "Publier la cagnotte solidaire" : "Publier la vidéo citoyenne"}</span>
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
