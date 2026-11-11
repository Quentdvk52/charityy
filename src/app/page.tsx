"use client";

import React, { useState } from "react";
import { computeSplit } from "@/modules/payments/split";
import { computeSignatureProgress } from "@/modules/signatures/service";
import { formatCurrency } from "@/lib/currency";
import { DEFAULT_GIFT_CATALOG, processGiftTransaction } from "@/modules/lives/service";

// Données de démonstration locales
const SAMPLE_CAMPAIGN = {
  id: "camp_urgence_diallo",
  title: "Urgence médicale : Soins chirurgicaux pédiatriques pour Aminata",
  story:
    "Aminata, 6 ans, souffre d'une cardiopathie congénitale nécessitant une intervention chirurgicale urgente. Devis hospitalier et examens vérifiés par l'équipe Charityy.",
  authorName: "Dr. Mamadou Diallo",
  authorRole: "Chirurgien pédiatrique (Personne Ressource Vérifiée)",
  city: "Abidjan",
  countryCode: "CI",
  currency: "XOF",
  goalMinor: 5_000_000n, // 5 000 000 FCFA
  collectedMinor: 3_450_000n,
  isCertified: true,
  isUrgent: true,
  signatures: Array.from({ length: 82 }, (_, i) => ({
    id: `sig_${i}`,
    campaignId: "camp_urgence_diallo",
    signerId: `user_${i}`,
    kind: (i < 35 ? "RELATIVE" : i < 60 ? "RESOURCE_PERSON" : "COMMUNITY") as any,
    createdAt: new Date(),
  })),
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"for_you" | "local" | "urgencies" | "lives">("for_you");
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // États du don
  const [donationAmount, setDonationAmount] = useState<number>(10000); // 10 000 FCFA
  const [selectedMethod, setSelectedMethod] = useState<"mobile_money" | "card">("mobile_money");
  const [donationSuccess, setDonationSuccess] = useState(false);

  // États du live & wallet
  const [walletBalance, setWalletBalance] = useState<bigint>(25000n); // 25 000 FCFA
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Bienvenue dans le direct solidaire pour Aminata.",
    "Dr. Diallo : Merci à tous les signataires et donateurs !",
  ]);
  const [liveChatInput, setLiveChatInput] = useState("");
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);

  // Calcul du split financier en temps réel
  const splitBreakdown = computeSplit({
    grossAmountMinor: BigInt(donationAmount),
    processorFeeMinor: BigInt(Math.round(donationAmount * 0.025)), // 2.5% Moneroo
    hasEligibleCreator: true,
  });

  // Calcul de la progression des signatures
  const signatureProgress = computeSignatureProgress(SAMPLE_CAMPAIGN.signatures);

  const handleSendGift = (giftId: string) => {
    const result = processGiftTransaction({
      senderId: "current_user",
      receiverId: "creator_diallo",
      giftId,
      senderWalletBalanceMinor: walletBalance,
    });

    if (result.success) {
      setWalletBalance(result.newSenderBalanceMinor);
      setActiveGiftAnimation(`Cadeau envoyé : ${result.gift.name} (-${result.gift.priceMinor} XOF)`);
      setChatMessages((prev) => [
        ...prev,
        `🎁 Vous avez offert un ${result.gift.name} pour soutenir la cause.`,
      ]);
      setTimeout(() => setActiveGiftAnimation(null), 3000);
    } else {
      alert(result.error);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    setChatMessages((prev) => [...prev, `Vous : ${liveChatInput.trim()}`]);
    setLiveChatInput("");
  };

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full border-x border-surface-border min-h-screen bg-background">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-bold tracking-tight text-lg">CHARITYY</span>
          <span className="text-xs text-neutral-500 block">Monde Meilleure • Local & Sécurisé</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-xs border border-surface-border px-2.5 py-1.5 rounded text-neutral-600 hover:text-foreground"
          >
            Console Admin
          </button>
          <span className="text-xs font-mono bg-surface-muted px-2 py-1 rounded">XOF (FCFA)</span>
        </div>
      </header>

      {/* Onglets du fil */}
      <nav className="flex border-b border-surface-border text-sm font-medium">
        {[
          { key: "for_you", label: "Pour toi" },
          { key: "local", label: "Abidjan" },
          { key: "urgencies", label: "Urgences" },
          { key: "lives", label: "Directs" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-neutral-500 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Contenu principal : Carte Vidéo & Cagnotte */}
      <main className="flex-1 p-4 space-y-4">
        {/* Lecteur vidéo simulé (Cloudflare Stream) */}
        <div className="relative aspect-[9/16] bg-neutral-900 rounded-lg overflow-hidden flex flex-col justify-between p-4 text-white">
          <div className="flex justify-between items-start">
            <span className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-semibold tracking-wide uppercase">
              Urgence Médicale
            </span>
            {SAMPLE_CAMPAIGN.isCertified && (
              <span className="bg-sky-500 text-white text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1">
                Certifiée Charityy
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-semibold leading-snug">{SAMPLE_CAMPAIGN.title}</h2>
              <p className="text-xs text-neutral-300">
                {SAMPLE_CAMPAIGN.authorName} • {SAMPLE_CAMPAIGN.authorRole}
              </p>
              <p className="text-xs text-neutral-400">{SAMPLE_CAMPAIGN.city}, Côte d'Ivoire</p>
            </div>

            {/* Barre de progression des 100 signatures */}
            <div className="bg-black/60 p-2.5 rounded border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-200">
                <span>Mobilisation communautaire</span>
                <span className="font-mono font-medium">{signatureProgress.totalValid}/100 signatures</span>
              </div>
              <div className="w-full bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${signatureProgress.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                40 proches • 30 personnes ressources • 30 communauté
              </p>
            </div>

            {/* Actions principales */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => setShowSignatureModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 rounded text-center transition"
              >
                Signer
              </button>
              <button
                onClick={() => setShowDonateModal(true)}
                className="bg-white text-black text-xs font-semibold py-2 rounded text-center hover:bg-neutral-200 transition"
              >
                Faire un don
              </button>
              <button
                onClick={() => setShowLiveModal(true)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium py-2 rounded text-center transition"
              >
                Rejoindre Live
              </button>
            </div>
          </div>
        </div>

        {/* Mentions de transparence imposées */}
        <div className="p-3 bg-surface-muted rounded text-[11px] text-neutral-600 space-y-1 border border-surface-border">
          <p>
            <strong>Transparence :</strong> Les signatures attestent d'une mobilisation citoyenne et ne
            constituent pas une garantie légale ou financière.
          </p>
          <p>
            La certification atteste d'une vérification documentaire rigoureuse de cohérence (factures,
            titres médicaux), sans promesse de résultat.
          </p>
        </div>
      </main>

      {/* MODAL 1 : TUNNEL DE DON SÉCURISÉ & TRANSPARENT */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-background w-full max-w-md rounded-t-xl sm:rounded-xl p-5 space-y-4 border border-surface-border">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="font-semibold text-sm">Faire un don solidaire</h3>
              <button onClick={() => setShowDonateModal(false)} className="text-neutral-500 text-sm">
                Fermer
              </button>
            </div>

            {donationSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                  ✓
                </div>
                <h4 className="font-semibold">Don enregistré avec succès</h4>
                <p className="text-xs text-neutral-600">
                  L'écriture a été inscrite de façon immuable dans le ledger en partie double.
                </p>
                <button
                  onClick={() => {
                    setDonationSuccess(false);
                    setShowDonateModal(false);
                  }}
                  className="w-full bg-foreground text-background py-2.5 rounded font-medium text-xs"
                >
                  Retour
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1.5">Choisissez le montant :</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2000, 5000, 10000, 25000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`py-2 text-xs font-mono rounded border ${
                          donationAmount === amt
                            ? "border-foreground bg-foreground text-background font-semibold"
                            : "border-surface-border bg-surface-muted"
                        }`}
                      >
                        {amt.toLocaleString()} F
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-500 block mb-1.5">Moyen de paiement :</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMethod("mobile_money")}
                      className={`py-2 px-3 text-xs rounded border text-left ${
                        selectedMethod === "mobile_money"
                          ? "border-foreground bg-surface-subtle font-medium"
                          : "border-surface-border"
                      }`}
                    >
                      Mobile Money (Wave, Orange, MTN, Moov)
                    </button>
                    <button
                      onClick={() => setSelectedMethod("card")}
                      className={`py-2 px-3 text-xs rounded border text-left ${
                        selectedMethod === "card"
                          ? "border-foreground bg-surface-subtle font-medium"
                          : "border-surface-border"
                      }`}
                    >
                      Carte Bancaire (Visa, Mastercard)
                    </button>
                  </div>
                </div>

                {/* Ventilation financière transparente (computeSplit) */}
                <div className="bg-surface-muted p-3 rounded text-xs space-y-1.5 border border-surface-border">
                  <div className="font-semibold text-neutral-700">Ventilation du don :</div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Montant brut versé :</span>
                    <span className="font-mono">{formatCurrency(splitBreakdown.grossAmountMinor, "XOF")}</span>
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
                  <div className="flex justify-between font-semibold border-t border-surface-border pt-1">
                    <span>Attribué au bénéficiaire :</span>
                    <span className="font-mono text-foreground">
                      {formatCurrency(splitBreakdown.beneficiaryAmountMinor, "XOF")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDonationSuccess(true)}
                  className="w-full bg-foreground text-background py-3 rounded font-semibold text-sm hover:opacity-90 transition"
                >
                  Confirmer le don de {formatCurrency(BigInt(donationAmount), "XOF")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2 : SIGNATURES DE SOUTIEN & LUTTE ANTI-FRAUDE */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-md rounded-xl p-5 space-y-4 border border-surface-border">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="font-semibold text-sm">Apporter votre signature citoyenne</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-neutral-500 text-sm">
                Fermer
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-600">
                Chaque signature est nominative et liée à un compte vérifié par téléphone pour prévenir les faux
                comptes et les attaques automatisées.
              </p>

              <div className="space-y-2">
                <label className="font-medium block">Votre qualité vis-à-vis de la cause :</label>
                <select className="w-full border border-surface-border p-2 rounded text-xs bg-background">
                  <option value="COMMUNITY">Membre de la communauté / Citoyen solidaire</option>
                  <option value="RELATIVE">Proche / Ami de la famille</option>
                  <option value="RESOURCE_PERSON">Personne ressource (Médecin, Enseignant, Autorité)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium block">Mot d'encouragement ou attestation :</label>
                <textarea
                  className="w-full border border-surface-border p-2 rounded text-xs bg-background h-20"
                  placeholder="Je soutiens cette cause car..."
                />
              </div>

              <button
                onClick={() => {
                  alert("Signature enregistrée avec succès. Merci pour votre engagement civique !");
                  setShowSignatureModal(false);
                }}
                className="w-full bg-foreground text-background py-2.5 rounded font-medium text-xs"
              >
                Valider ma signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 : DIRECT SOLIDAIRE (AGORA RTC, CHAT, CADEAUX) */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col max-w-lg mx-auto w-full text-white">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider block">EN DIRECT</span>
              <span className="text-xs text-neutral-300">Live solidaire avec Dr. Mamadou Diallo</span>
            </div>
            <button onClick={() => setShowLiveModal(false)} className="text-xs bg-white/20 px-2.5 py-1 rounded">
              Quitter
            </button>
          </div>

          {/* Zone vidéo du live */}
          <div className="flex-1 relative flex items-center justify-center bg-neutral-950">
            <div className="text-center space-y-2 text-neutral-400">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto text-2xl">
                🎥
              </div>
              <p className="text-xs">Flux vidéo Agora RTC interactif (faible latence)</p>
            </div>

            {/* Animation de cadeau éphémère */}
            {activeGiftAnimation && (
              <div className="absolute top-1/4 bg-black/80 px-4 py-2 rounded-full border border-white/20 text-xs font-semibold animate-bounce">
                {activeGiftAnimation}
              </div>
            )}
          </div>

          {/* Fil de discussion du live */}
          <div className="h-44 bg-black/60 p-3 overflow-y-auto space-y-1.5 text-xs border-t border-white/10">
            {chatMessages.map((msg, i) => (
              <p key={i} className="text-neutral-200">
                {msg}
              </p>
            ))}
          </div>

          {/* Formulaire de message et catalogue de cadeaux */}
          <div className="p-3 bg-neutral-900 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Solde wallet : {formatCurrency(walletBalance, "XOF")}</span>
              <span className="text-[10px]">Cadeaux = Débit ledger immédiat</span>
            </div>

            {/* Catalogue de cadeaux */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DEFAULT_GIFT_CATALOG.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift.id)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded text-left shrink-0 border border-white/10 text-xs min-w-[90px]"
                >
                  <div className="font-medium text-white">{gift.name}</div>
                  <div className="text-[10px] text-neutral-400">{gift.priceMinor.toString()} F</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={liveChatInput}
                onChange={(e) => setLiveChatInput(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-1.5 text-xs text-white"
              />
              <button type="submit" className="bg-white text-black text-xs font-semibold px-4 rounded">
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4 : BACK-OFFICE ADMIN & CONSOLE DE CONFORMITÉ */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-lg rounded-xl p-5 space-y-4 border border-surface-border max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <div>
                <h3 className="font-semibold text-sm">Console d'Administration & Modération</h3>
                <span className="text-xs text-neutral-500">Rôle : SUPER_ADMIN (Audit append-only actif)</span>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-neutral-500 text-sm">
                Fermer
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-surface-muted rounded border border-surface-border">
                  <div className="text-neutral-500">Dossiers KYC en attente</div>
                  <div className="text-lg font-bold">12</div>
                </div>
                <div className="p-3 bg-surface-muted rounded border border-surface-border">
                  <div className="text-neutral-500">Demandes de certification (5%)</div>
                  <div className="text-lg font-bold">4</div>
                </div>
                <div className="p-3 bg-surface-muted rounded border border-surface-border">
                  <div className="text-neutral-500">Retraits à double approbation</div>
                  <div className="text-lg font-bold">2</div>
                </div>
                <div className="p-3 bg-surface-muted rounded border border-surface-border">
                  <div className="text-neutral-500">Signalements à modérer</div>
                  <div className="text-lg font-bold text-red-600">1</div>
                </div>
              </div>

              <div className="border border-surface-border rounded p-3 space-y-2">
                <div className="font-medium">File d'approbation des retraits (> 1 000 000 FCFA) :</div>
                <div className="bg-surface-subtle p-2 rounded flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-semibold">Dr. Mamadou Diallo</span>
                    <span className="text-neutral-500 block">Cagnotte Aminata • 2 500 000 FCFA</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => alert("Première approbation validée par FINANCE. En attente de second signataire.")}
                      className="bg-neutral-800 text-white px-2 py-1 rounded"
                    >
                      Approuver (1/2)
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-surface-border rounded p-3 space-y-2">
                <div className="font-medium">Contrôle de sécurité des justificatifs :</div>
                <p className="text-neutral-500 text-[11px]">
                  Les pièces d'identité et dossiers médicaux sont conservés dans un bucket R2 privé avec URL
                  éphémères de 60 secondes. Aucun accès direct n'est autorisé pour le personnel sans journalisation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
