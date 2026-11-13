"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { computeSplit } from "@/modules/payments/split";
import { computeSignatureProgress } from "@/modules/signatures/service";
import { formatCurrency } from "@/lib/currency";
import { DEFAULT_GIFT_CATALOG, processGiftTransaction } from "@/modules/lives/service";

// Interface des campagnes du fil solidaire
interface CampaignItem {
  id: string;
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
  signaturesCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  commentsList: Array<{ user: string; text: string; time: string }>;
}

// Données de test enrichies : 5 causes représentatives pour scroller et tester
const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: "camp_urgence_diallo",
    title: "Urgence vitale : Chirurgie pédiatrique à cœur ouvert pour Aminata",
    story:
      "Aminata, 6 ans, souffre d'une cardiopathie congénitale sévère. L'intervention chirurgicale d'urgence au CHU est programmée dès mobilisation du devis vérifié.",
    authorName: "Dr. Mamadou Diallo",
    authorRole: "Chirurgien pédiatrique (Personne Ressource Vérifiée)",
    city: "Abidjan",
    countryCode: "CI",
    category: "MEDICAL",
    categoryLabel: "Urgence Médicale",
    currency: "XOF",
    goalMinor: 5_000_000n,
    collectedMinor: 3_850_000n,
    isCertified: true,
    isUrgent: true,
    hasLive: true,
    liveHostName: "Dr. Mamadou Diallo",
    liveViewers: 142,
    bgGradient: "from-red-950/80 via-neutral-900 to-black",
    signaturesCount: 92,
    likesCount: 2480,
    commentsCount: 184,
    sharesCount: 620,
    commentsList: [
      { user: "Awa Traoré", text: "Je connais la famille à Treichville. Courage petite Aminata !", time: "Il y a 10m" },
      { user: "Dr. Koffi", text: "Dossier médical et devis clinique validés. Chaque don compte.", time: "Il y a 25m" },
      { user: "Solidarité CI", text: "Don de 50 000 FCFA effectué avec reçu ledger.", time: "Il y a 1h" },
    ],
  },
  {
    id: "camp_eau_benin",
    title: "Accès à l'eau potable : Château d'eau solaire pour 3 200 écoliers et villageois",
    story:
      "Les enfants de l'école primaire de Djigbé parcourent 4 km par jour pour puiser de l'eau insalubre. Ce forage solaire automatisé approvisionnera l'école et le dispensaire.",
    authorName: "Association Eau & Vie Bénin",
    authorRole: "ONG Agréée (Conformité certifiée)",
    city: "Zè / Cotonou",
    countryCode: "BJ",
    category: "WATER",
    categoryLabel: "Eau & Climat",
    currency: "XOF",
    goalMinor: 7_500_000n,
    collectedMinor: 5_620_000n,
    isCertified: true,
    isUrgent: false,
    hasLive: false,
    bgGradient: "from-cyan-950/80 via-neutral-900 to-black",
    signaturesCount: 100,
    likesCount: 1920,
    commentsCount: 96,
    sharesCount: 410,
    commentsList: [
      { user: "Patrice K.", text: "Bravo pour cette initiative concrète pour nos villages.", time: "Il y a 15m" },
      { user: "Sœur Jeanne", text: "Le dispensaire attend ce raccordement avec impatience.", time: "Il y a 2h" },
    ],
  },
  {
    id: "camp_ecole_senegal",
    title: "Éducation rurale : Reconstruction de 3 salles de classe détruites par les intempéries",
    story:
      "Suite aux tornades à Thiès, 140 écoliers étudient sous des bâches de fortune. Le projet finance toitures en bacs alu, tables-bancs neufs et sanitaires séparés.",
    authorName: "Fatima Sow",
    authorRole: "Présidente Comité Parents d'Élèves (Porteuse Citoyenne)",
    city: "Thiès / Dakar",
    countryCode: "SN",
    category: "EDUCATION",
    categoryLabel: "Éducation & Jeunesse",
    currency: "XOF",
    goalMinor: 3_200_000n,
    collectedMinor: 1_650_000n,
    isCertified: false,
    isUrgent: false,
    hasLive: false,
    bgGradient: "from-amber-950/70 via-neutral-900 to-black",
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
    title: "Santé Maternelle : 2 couveuses néonatales pour réduire la mortalité prématurée",
    story:
      "La maternité de district accueille 90 naissances par mois mais manque cruellement de couveuses pour les bébés prématurés. Matériel médical sourcé chez un fournisseur agréé.",
    authorName: "Dr. Koffi Mensah",
    authorRole: "Pédiatre Référent (Praticien Habilité)",
    city: "Lomé",
    countryCode: "TG",
    category: "MATERNITY",
    categoryLabel: "Maternité & Nourrissons",
    currency: "XOF",
    goalMinor: 4_200_000n,
    collectedMinor: 2_950_000n,
    isCertified: true,
    isUrgent: true,
    hasLive: true,
    liveHostName: "Dr. Koffi Mensah",
    liveViewers: 86,
    bgGradient: "from-purple-950/80 via-neutral-900 to-black",
    signaturesCount: 88,
    likesCount: 1540,
    commentsCount: 82,
    sharesCount: 330,
    commentsList: [
      { user: "Yawa A.", text: "Sauver des nouveau-nés est la plus belle des causes.", time: "Il y a 20m" },
      { user: "Donateur Anonyme", text: "Don de 25 000 FCFA avec reçu transparent.", time: "Il y a 1h" },
    ],
  },
  {
    id: "camp_sinistres_cameroun",
    title: "Urgence Sinistrés : Secours alimentaire et relogement pour 45 familles inondées",
    story:
      "Après la montée des eaux dans le quartier Makèpè, 45 familles ont perdu leurs logements et vivres. Distribution de kits d'urgence, nattes et abris temporaires.",
    authorName: "Collectif Solidarité Littoral",
    authorRole: "Coordination de secours citoyens (Vérifiée)",
    city: "Douala",
    countryCode: "CM",
    category: "DISASTER",
    categoryLabel: "Urgence Sinistrés",
    currency: "XOF",
    goalMinor: 6_000_000n,
    collectedMinor: 4_900_000n,
    isCertified: true,
    isUrgent: true,
    hasLive: true,
    liveHostName: "Collectif Littoral",
    liveViewers: 215,
    bgGradient: "from-orange-950/80 via-neutral-900 to-black",
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
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem>(INITIAL_CAMPAIGNS[0]!);

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
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Formulaire auth modal
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Don
  const [donationAmount, setDonationAmount] = useState<number>(10000);
  const [selectedMethod, setSelectedMethod] = useState<"mobile_money" | "card">("mobile_money");
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Live & Wallet
  const [walletBalance, setWalletBalance] = useState<bigint>(25000n);
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Bienvenue dans le direct solidaire.",
    "Merci à tous les signataires et donateurs !",
  ]);
  const [liveChatInput, setLiveChatInput] = useState("");
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);

  // Commentaires
  const [newCommentInput, setNewCommentInput] = useState("");

  // Vérifier la session utilisateur au chargement
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

  // Déconnexion
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
    } catch {}
  };

  // Connexion rapide via la modal
  const handleLoginSubmit = async (e?: React.FormEvent, directId?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const idToUse = directId || authIdentifier;
    const passToUse = directPass || authPassword;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idToUse, password: passToUse }),
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
    } catch {
      setAuthError("Erreur réseau lors de la connexion.");
      setAuthLoading(false);
    }
  };

  // Gestion des likes en temps réel
  const handleToggleLike = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, likesCount: c.likesCount + 1 } : c))
    );
  };

  // Ajout de commentaire
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;

    const authorName = currentUser?.displayName || "Citoyen Solidaire";
    const newEntry = {
      user: authorName,
      text: newCommentInput.trim(),
      time: "À l'instant",
    };

    setCampaigns((prev) =>
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

  // Signature d'une campagne
  const handleSignCampaign = () => {
    setCampaigns((prev) =>
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
    alert("Signature enregistrée avec succès ! Merci pour votre engagement civique.");
  };

  // Filtrage selon l'onglet actif
  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "urgencies") return c.isUrgent;
    if (activeTab === "lives") return c.hasLive;
    if (activeTab === "local") return c.city.includes("Abidjan");
    return true; // "for_you"
  });

  // Split financier dynamique
  const splitBreakdown = computeSplit({
    grossAmountMinor: BigInt(donationAmount),
    processorFeeMinor: BigInt(Math.round(donationAmount * 0.025)),
    hasEligibleCreator: true,
  });

  // Calcul progression signatures
  const signatureProgress = computeSignatureProgress(
    Array.from({ length: selectedCampaign.signaturesCount }, (_, i) => ({
      id: `sig_${i}`,
      campaignId: selectedCampaign.id,
      signerId: `usr_${i}`,
      kind: (i < 40 ? "RELATIVE" : i < 70 ? "RESOURCE_PERSON" : "COMMUNITY") as any,
      createdAt: new Date(),
    }))
  );

  const handleSendGift = (giftId: string) => {
    const result = processGiftTransaction({
      senderId: currentUser?.id || "current_user",
      receiverId: "creator_diallo",
      giftId,
      senderWalletBalanceMinor: walletBalance,
    });

    if (result.success) {
      setWalletBalance(result.newSenderBalanceMinor);
      setActiveGiftAnimation(`Cadeau offert : ${result.gift.name} (-${result.gift.priceMinor} XOF)`);
      setChatMessages((prev) => [
        ...prev,
        `🎁 ${currentUser?.displayName || "Vous"} a offert un ${result.gift.name}.`,
      ]);
      setTimeout(() => setActiveGiftAnimation(null), 3000);
    } else {
      alert(result.error);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    setChatMessages((prev) => [...prev, `${currentUser?.displayName || "Vous"} : ${liveChatInput.trim()}`]);
    setLiveChatInput("");
  };

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full border-x border-surface-border min-h-screen bg-background">
      {/* 1. BARRE SUPÉRIEURE AVEC AUTHENTIFICATION VISIBLE */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-surface-border px-4 py-2.5 flex items-center justify-between">
        <div>
          <Link href="/" className="font-extrabold tracking-tight text-lg block leading-none">
            CHARITYY
          </Link>
          <span className="text-[10px] text-neutral-500 font-medium">Monde Meilleure • Solidarité Vérifiée</span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-xs font-semibold block text-foreground leading-tight">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600 font-mono">
                  {currentUser.roles[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] border border-surface-border px-2 py-1 rounded text-neutral-500 hover:text-foreground hover:bg-surface-muted transition"
                title="Déconnexion"
              >
                Sortir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs bg-foreground text-background font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition shadow-sm"
              >
                Se connecter
              </button>
              <Link
                href="/login"
                className="text-xs border border-surface-border px-2.5 py-1.5 rounded-full text-neutral-600 hover:text-foreground"
              >
                Page Auth
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. ONGLETS DE NAVIGATION DYNAMIQUE */}
      <nav className="flex border-b border-surface-border text-xs font-semibold sticky top-[57px] z-30 bg-background">
        {[
          { key: "for_you", label: "Pour toi (Tous)" },
          { key: "local", label: "Abidjan (Local)" },
          { key: "urgencies", label: "Urgences 🚨" },
          { key: "lives", label: "Directs 🔴" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-foreground text-foreground font-bold"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 3. FLUX DÉFILABLE DE VIDÉOS & CAGNOTTES (SCROLL VERTICAL) */}
      <main className="flex-1 p-3 space-y-6">
        <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
          <span>{filteredCampaigns.length} cause(s) disponible(s) • Scrollez pour explorer</span>
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-[11px] text-neutral-400 hover:text-foreground underline"
          >
            Console Contrôle
          </button>
        </div>

        {filteredCampaigns.map((camp) => {
          const progress = Math.min(100, Math.round((Number(camp.collectedMinor) / Number(camp.goalMinor)) * 100));

          return (
            <article
              key={camp.id}
              className={`relative rounded-2xl overflow-hidden border border-neutral-800 bg-gradient-to-b ${camp.bgGradient} p-4 text-white shadow-lg space-y-4 transition-transform`}
            >
              {/* Badges supérieurs */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      camp.isUrgent ? "bg-red-600 text-white animate-pulse" : "bg-neutral-800 text-neutral-200"
                    }`}
                  >
                    {camp.categoryLabel}
                  </span>
                  {camp.isCertified && (
                    <span className="bg-sky-500/90 text-white text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm">
                      ✓ Certifiée Charityy
                    </span>
                  )}
                </div>

                {camp.hasLive && (
                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setShowLiveModal(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow animate-bounce"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE ({camp.liveViewers} spectateurs)
                  </button>
                )}
              </div>

              {/* Contenu principal de la cause */}
              <div className="space-y-2 pt-2">
                <h2 className="text-base sm:text-lg font-bold leading-snug tracking-tight text-white">
                  {camp.title}
                </h2>
                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">{camp.story}</p>
                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <span>
                    👤 <strong>{camp.authorName}</strong> ({camp.authorRole})
                  </span>
                  <span>📍 {camp.city}</span>
                </div>
              </div>

              {/* Barre de collecte financière */}
              <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {formatCurrency(camp.collectedMinor, camp.currency)}
                    </span>
                    <span className="text-neutral-400 text-[11px]"> / {formatCurrency(camp.goalMinor, camp.currency)}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{progress}%</span>
                </div>

                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Jauge des 100 Signatures citoyennes */}
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-neutral-200">
                  <span className="flex items-center gap-1">
                    ✍️ Mobilisation citoyenne anti-fraude
                  </span>
                  <span className="font-mono font-bold text-white">{camp.signaturesCount}/100</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, camp.signaturesCount)}%` }}
                  />
                </div>
                <div className="text-[10px] text-neutral-400 flex justify-between">
                  <span>Proches (40)</span>
                  <span>Personnes Ressources (30)</span>
                  <span>Communauté (30)</span>
                </div>
              </div>

              {/* Barre d'interaction sociale (Like, Commentaire, Partage) */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLike(camp.id)}
                    className="flex items-center gap-1.5 text-neutral-300 hover:text-red-400 transition font-medium"
                  >
                    <span>❤️</span>
                    <span>{camp.likesCount.toLocaleString()}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setShowCommentsModal(true);
                    }}
                    className="flex items-center gap-1.5 text-neutral-300 hover:text-sky-400 transition font-medium"
                  >
                    <span>💬</span>
                    <span>{camp.commentsCount} avis</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert("Lien solidaire copié dans votre presse-papiers !");
                    }}
                    className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition font-medium"
                  >
                    <span>↗️</span>
                    <span>{camp.sharesCount}</span>
                  </button>
                </div>

                <span className="text-[10px] text-neutral-400 font-mono">Ledger #XOF</span>
              </div>

              {/* Boutons d'action principaux */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setShowSignatureModal(true);
                  }}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold py-2.5 rounded-xl text-center transition border border-white/10"
                >
                  Signer
                </button>

                <button
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setShowDonateModal(true);
                  }}
                  className="bg-white text-black text-xs font-bold py-2.5 rounded-xl text-center hover:bg-neutral-200 transition shadow"
                >
                  Faire un don
                </button>

                <button
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setShowLiveModal(true);
                  }}
                  className={`text-xs font-semibold py-2.5 rounded-xl text-center transition ${
                    camp.hasLive
                      ? "bg-red-600 hover:bg-red-700 text-white shadow"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/5"
                  }`}
                >
                  {camp.hasLive ? "Direct Live 🔴" : "Salon Live"}
                </button>
              </div>
            </article>
          );
        })}

        {/* Mentions légales de transparence */}
        <div className="p-3 bg-surface-muted rounded-xl text-[11px] text-neutral-600 space-y-1.5 border border-surface-border">
          <p>
            <strong>Transparence & Règle d&apos;or :</strong> Les signatures citoyennes attestent d&apos;une mobilisation locale vérifiée.
            La certification Charityy valide la concordance documentaire (devis, factures médicales, identités).
          </p>
          <p className="text-[10px] text-neutral-500">
            Chaque transaction fait l&apos;objet d&apos;une double écriture immuable dans le grand livre comptable.
          </p>
        </div>
      </main>

      {/* PIED DE PAGE */}
      <footer className="p-4 border-t border-surface-border text-center text-xs text-neutral-500 space-y-2">
        <div className="flex justify-center gap-4 text-[11px]">
          <Link href="/login" className="hover:text-foreground font-semibold">Connexion</Link>
          <Link href="/cgu" className="hover:text-foreground underline">CGU</Link>
          <Link href="/confidentialite" className="hover:text-foreground underline">Confidentialité</Link>
          <a href="/api/currency/rates" target="_blank" className="hover:text-foreground">Taux Multi-Devises</a>
        </div>
        <p className="text-[10px] text-neutral-400">© 2026 Charityy : monde meilleure • Plateforme solidaire sécurisée</p>
      </footer>

      {/* MODAL AUTH : CONNEXION INSTANTANÉE & COMPTES DE TEST */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-md rounded-2xl p-6 space-y-4 border border-surface-border shadow-xl">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-sm">Espace Utilisateur & Connexion</h3>
                <span className="text-[11px] text-neutral-500">Connectez-vous pour signer et gérer vos dons</span>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-neutral-500 hover:text-foreground text-sm">
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">Identifiant ou Email</label>
                <input
                  type="text"
                  required
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  placeholder="donateur@charityy.org ou numéro"
                  className="w-full bg-surface-muted border border-surface-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-muted border border-surface-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-foreground text-background py-2.5 rounded-lg font-bold text-xs hover:opacity-90 transition disabled:opacity-50"
              >
                {authLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            {/* Comptes démo 1 clic */}
            <div className="pt-3 border-t border-surface-border space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Comptes de test (1 clic) :
              </span>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => handleLoginSubmit(undefined, "donateur@charityy.org", "Donateur2026!")}
                  className="p-2 border border-surface-border rounded-lg bg-surface-muted hover:border-foreground/30 transition text-left"
                >
                  <div className="text-xs font-bold text-foreground">👤 Donatrice</div>
                  <div className="text-[10px] text-neutral-500">Awa Traoré (USER)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoginSubmit(undefined, "diallo@hospital.ci", "DialloCharityy2026!")}
                  className="p-2 border border-surface-border rounded-lg bg-surface-muted hover:border-foreground/30 transition text-left"
                >
                  <div className="text-xs font-bold text-foreground">🩺 Dr. Diallo</div>
                  <div className="text-[10px] text-neutral-500">Porteur (CREATOR)</div>
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs text-neutral-600 hover:text-foreground underline"
                >
                  Accéder à la page complète de connexion / inscription
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMMENTAIRES INTERACTIFS */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-background w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 border border-surface-border max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-sm">Commentaires & Témoignages</h3>
                <span className="text-[10px] text-neutral-500 block truncate max-w-[280px]">
                  {selectedCampaign.title}
                </span>
              </div>
              <button onClick={() => setShowCommentsModal(false)} className="text-neutral-500 hover:text-foreground text-sm">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedCampaign.commentsList.map((comm, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface-muted border border-surface-border text-xs space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span className="font-semibold text-foreground">{comm.user}</span>
                    <span className="text-[10px] text-neutral-400">{comm.time}</span>
                  </div>
                  <p className="text-neutral-700">{comm.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-surface-border">
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Ajouter un mot de soutien solidaire..."
                className="flex-1 bg-surface-muted border border-surface-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <button type="submit" className="bg-foreground text-background font-semibold text-xs px-4 py-2 rounded-lg">
                Publier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DONATION AVEC MONEROO & SPLIT */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-background w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 border border-surface-border">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-sm">Faire un don solidaire</h3>
                <span className="text-[10px] text-neutral-500 block truncate max-w-[280px]">
                  Pour : {selectedCampaign.title}
                </span>
              </div>
              <button onClick={() => setShowDonateModal(false)} className="text-neutral-500 text-sm">
                ✕
              </button>
            </div>

            {donationSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-sm">Don validé & inscrit au Grand Livre</h4>
                <p className="text-xs text-neutral-600">
                  L&apos;écriture comptable a été enregistrée de façon immuable dans le ledger en partie double.
                </p>
                <button
                  onClick={() => {
                    setDonationSuccess(false);
                    setShowDonateModal(false);
                  }}
                  className="w-full bg-foreground text-background py-2.5 rounded-lg font-semibold text-xs"
                >
                  Retourner au fil
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1.5 font-medium">Choisissez le montant :</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2000, 5000, 10000, 25000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`py-2 text-xs font-mono rounded-lg border transition ${
                          donationAmount === amt
                            ? "border-foreground bg-foreground text-background font-bold"
                            : "border-surface-border bg-surface-muted text-foreground"
                        }`}
                      >
                        {amt.toLocaleString()} F
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-500 block mb-1.5 font-medium">Moyen de paiement :</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMethod("mobile_money")}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition ${
                        selectedMethod === "mobile_money"
                          ? "border-foreground bg-surface-muted font-bold"
                          : "border-surface-border text-neutral-600"
                      }`}
                    >
                      📱 Mobile Money (Wave, Orange, MTN, Moov)
                    </button>
                    <button
                      onClick={() => setSelectedMethod("card")}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition ${
                        selectedMethod === "card"
                          ? "border-foreground bg-surface-muted font-bold"
                          : "border-surface-border text-neutral-600"
                      }`}
                    >
                      💳 Carte Bancaire (Visa, Mastercard)
                    </button>
                  </div>
                </div>

                {/* Ventilation financière transparente */}
                <div className="bg-surface-muted p-3 rounded-xl text-xs space-y-1.5 border border-surface-border">
                  <div className="font-bold text-neutral-700">Ventilation transparente du don :</div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Montant brut versé :</span>
                    <span className="font-mono font-semibold">{formatCurrency(splitBreakdown.grossAmountMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Frais processeur Moneroo :</span>
                    <span className="font-mono">-{formatCurrency(splitBreakdown.processorFeeMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Frais plateforme (3% sur net) :</span>
                    <span className="font-mono">-{formatCurrency(splitBreakdown.platformFeeMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Part créateur apporteur (2%) :</span>
                    <span className="font-mono">-{formatCurrency(splitBreakdown.creatorShareMinor, "XOF")}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-surface-border pt-1 text-foreground">
                    <span>Attribué au bénéficiaire :</span>
                    <span className="font-mono text-emerald-600">
                      {formatCurrency(splitBreakdown.beneficiaryAmountMinor, "XOF")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDonationSuccess(true)}
                  className="w-full bg-foreground text-background py-3 rounded-xl font-bold text-sm hover:opacity-90 transition shadow"
                >
                  Confirmer le don de {formatCurrency(BigInt(donationAmount), "XOF")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SIGNATURES CITOYENNES */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-md rounded-2xl p-5 space-y-4 border border-surface-border shadow-xl">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-sm">Apporter votre signature citoyenne</h3>
                <span className="text-[10px] text-neutral-500 block truncate max-w-[280px]">
                  {selectedCampaign.title}
                </span>
              </div>
              <button onClick={() => setShowSignatureModal(false)} className="text-neutral-500 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-600">
                Chaque signature est nominative et liée à une empreinte anti-sybil pour prévenir les faux votes.
                À 100 signatures vérifiées, la cagnotte passe automatiquement en validation communautaire.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700">Votre qualité vis-à-vis de la cause :</label>
                <select className="w-full border border-surface-border p-2.5 rounded-lg text-xs bg-surface-muted">
                  <option value="COMMUNITY">Membre de la communauté / Citoyen solidaire</option>
                  <option value="RELATIVE">Proche / Ami de la famille</option>
                  <option value="RESOURCE_PERSON">Personne ressource (Médecin, Enseignant, Autorité locale)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-neutral-700">Mot d&apos;encouragement ou attestation :</label>
                <textarea
                  className="w-full border border-surface-border p-2.5 rounded-lg text-xs bg-surface-muted h-20 focus:outline-none focus:ring-1 focus:ring-foreground"
                  placeholder="Je soutiens cette cause car..."
                />
              </div>

              <button
                onClick={handleSignCampaign}
                className="w-full bg-foreground text-background py-3 rounded-xl font-bold text-xs hover:opacity-90 transition shadow"
              >
                Valider ma signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIRECT SOLIDAIRE (AGORA RTC, CHAT, CADEAUX) */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col max-w-lg mx-auto w-full text-white">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/60">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider block flex items-center gap-1.5">
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

          <div className="h-44 bg-black/60 p-3 overflow-y-auto space-y-1.5 text-xs border-t border-white/10">
            {chatMessages.map((msg, i) => (
              <p key={i} className="text-neutral-200">
                {msg}
              </p>
            ))}
          </div>

          <div className="p-3 bg-neutral-900 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Solde wallet : <strong className="text-white font-mono">{formatCurrency(walletBalance, "XOF")}</strong></span>
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

      {/* MODAL 4 : BACK-OFFICE ADMIN & AUDIT */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-lg rounded-2xl p-5 space-y-4 border border-surface-border max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-sm">Console d&apos;Administration & Modération</h3>
                <span className="text-xs text-neutral-500">Piste d&apos;audit append-only active (docs/05 &amp; 11)</span>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-neutral-500 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div className="text-neutral-500">Dossiers KYC en attente</div>
                  <div className="text-lg font-bold">12</div>
                </div>
                <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div className="text-neutral-500">Demandes de certification (5%)</div>
                  <div className="text-lg font-bold">4</div>
                </div>
                <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div className="text-neutral-500">Retraits à double approbation</div>
                  <div className="text-lg font-bold">2</div>
                </div>
                <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div className="text-neutral-500">Signalements modération</div>
                  <div className="text-lg font-bold text-red-600">1</div>
                </div>
              </div>

              <div className="border border-surface-border rounded-xl p-3 space-y-2">
                <div className="font-semibold text-neutral-700">File de double approbation (&gt; 1 000 000 FCFA) :</div>
                <div className="bg-surface-muted p-2.5 rounded-lg flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-bold text-foreground">Dr. Mamadou Diallo</span>
                    <span className="text-neutral-500 block">Cagnotte Aminata • 2 500 000 FCFA</span>
                  </div>
                  <button
                    onClick={() => alert("Première approbation validée par FINANCE. En attente de second signataire ADMIN.")}
                    className="bg-neutral-900 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-neutral-800"
                  >
                    Approuver (1/2)
                  </button>
                </div>
              </div>

              <div className="border border-surface-border rounded-xl p-3 space-y-2">
                <div className="font-semibold text-neutral-700">Sécurité & Confidentialité des Justificatifs :</div>
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  Toutes les pièces d&apos;identité et justificatifs sont chiffrés en base avec AES-256-GCM. Les URLs de
                  consultation pour les vérificateurs sont générées avec une durée de validité stricte de 60 secondes et
                  font l&apos;objet d&apos;un log d&apos;audit obligatoire.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
