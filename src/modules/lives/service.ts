export interface GiftItem {
  id: string;
  name: string;
  priceMinor: bigint;
  currency: string;
  assetKey: string;
}

export const DEFAULT_GIFT_CATALOG: GiftItem[] = [
  {
    id: "gift_rose",
    name: "🌹 Rose Solidaire",
    priceMinor: 100n, // 100 FCFA
    currency: "XOF",
    assetKey: "lottie/rose.json",
  },
  {
    id: "gift_heart",
    name: "💖 Cœur d'Espoir",
    priceMinor: 500n, // 500 FCFA
    currency: "XOF",
    assetKey: "lottie/heart.json",
  },
  {
    id: "gift_coffee",
    name: "☕ Café des Bénévoles",
    priceMinor: 1000n, // 1 000 FCFA
    currency: "XOF",
    assetKey: "lottie/coffee.json",
  },
  {
    id: "gift_tree",
    name: "🌳 Arbre de Vie",
    priceMinor: 2000n, // 2 000 FCFA
    currency: "XOF",
    assetKey: "lottie/tree.json",
  },
  {
    id: "gift_water",
    name: "💧 Puits d'Eau Potable",
    priceMinor: 5000n, // 5 000 FCFA
    currency: "XOF",
    assetKey: "lottie/water.json",
  },
  {
    id: "gift_crown",
    name: "👑 Couronne d'Impact",
    priceMinor: 10000n, // 10 000 FCFA
    currency: "XOF",
    assetKey: "three/crown.glb",
  },
  {
    id: "gift_lion",
    name: "🦁 Lion de la Solidarité",
    priceMinor: 25000n, // 25 000 FCFA
    currency: "XOF",
    assetKey: "three/lion.glb",
  },
];

export interface SendGiftParams {
  senderId: string;
  receiverId: string;
  giftId: string;
  liveId?: string;
  senderWalletBalanceMinor: bigint;
}

export interface SendGiftResult {
  success: boolean;
  gift: GiftItem;
  creatorShareMinor: bigint;
  platformShareMinor: bigint;
  newSenderBalanceMinor: bigint;
  error?: string;
}

/**
 * Traite l'envoi d'un cadeau virtuel lors d'un live solidaire.
 * Débite le portefeuille utilisateur de façon atomique et répartit les gains créateur.
 */
export function processGiftTransaction(params: SendGiftParams): SendGiftResult {
  const { senderId, receiverId, giftId, senderWalletBalanceMinor } = params;

  if (senderId === receiverId) {
    return {
      success: false,
      gift: DEFAULT_GIFT_CATALOG[0]!,
      creatorShareMinor: 0n,
      platformShareMinor: 0n,
      newSenderBalanceMinor: senderWalletBalanceMinor,
      error: "Impossible d'envoyer un cadeau à soi-même",
    };
  }

  const gift = DEFAULT_GIFT_CATALOG.find((g) => g.id === giftId);
  if (!gift) {
    return {
      success: false,
      gift: DEFAULT_GIFT_CATALOG[0]!,
      creatorShareMinor: 0n,
      platformShareMinor: 0n,
      newSenderBalanceMinor: senderWalletBalanceMinor,
      error: "Cadeau introuvable dans le catalogue",
    };
  }

  if (senderWalletBalanceMinor < gift.priceMinor) {
    return {
      success: false,
      gift,
      creatorShareMinor: 0n,
      platformShareMinor: 0n,
      newSenderBalanceMinor: senderWalletBalanceMinor,
      error: "Solde portefeuille insuffisant pour envoyer ce cadeau",
    };
  }

  // Répartition : 70% pour le créateur hôte, 30% pour la plateforme
  const creatorShareMinor = (gift.priceMinor * 70n) / 100n;
  const platformShareMinor = gift.priceMinor - creatorShareMinor;
  const newSenderBalanceMinor = senderWalletBalanceMinor - gift.priceMinor;

  return {
    success: true,
    gift,
    creatorShareMinor,
    platformShareMinor,
    newSenderBalanceMinor,
  };
}
